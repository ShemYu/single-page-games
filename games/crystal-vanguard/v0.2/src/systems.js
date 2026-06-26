import { GAME_CONFIG, PHASE, SPAWN_CELLS, directionFromVector } from './config.js';
import {
  allSpawnRoutesExist,
  distance,
  distanceSquared,
  mitigateDamage,
  movePointTowards
} from './core.js';

export class PlacementSystem {
  constructor({ registry, grid, state }) {
    this.registry = registry;
    this.grid = grid;
    this.state = state;
  }

  definitionFor(kind, id) {
    if (kind === 'job') return this.registry.get('jobs', id);
    if (kind === 'building') return this.registry.get('buildings', id);
    throw new Error(`Unsupported placement kind: ${kind}`);
  }

  validate(kind, id, cell) {
    if (this.state.phase !== PHASE.BUILD) return { ok: false, reason: '戰鬥中不能調整部署。' };
    if (!this.grid.inside(cell)) return { ok: false, reason: '請選擇棋盤內的格子。' };
    if (this.grid.isReserved(cell)) return { ok: false, reason: '入口與水晶格不可部署。' };
    if (this.grid.isOccupied(cell)) return { ok: false, reason: '這個格子已被占用。' };

    const definition = this.definitionFor(kind, id);
    if (this.state.gold < definition.cost) return { ok: false, reason: `金幣不足，需要 ${definition.cost}。` };
    if (kind === 'job' && this.state.defenders.size >= GAME_CONFIG.economy.defenderCap) {
      return { ok: false, reason: `職業單位上限為 ${GAME_CONFIG.economy.defenderCap}。` };
    }

    if (definition.blocksPath && !allSpawnRoutesExist(
      this.grid,
      SPAWN_CELLS,
      GAME_CONFIG.board.crystal,
      cell
    )) {
      return { ok: false, reason: '這會封死至少一個入口，請保留可通行路徑。' };
    }

    return { ok: true, definition };
  }

  refundFor(entity) {
    return Math.max(1, Math.floor((entity.cost ?? 0) * GAME_CONFIG.economy.sellRefundRate));
  }
}

export class WaveSystem {
  constructor() {
    this.active = false;
    this.elapsedMs = 0;
    this.queue = [];
    this.spawned = 0;
  }

  begin(waveDefinition) {
    this.active = true;
    this.elapsedMs = 0;
    this.spawned = 0;
    this.queue = waveDefinition.groups
      .flatMap(group => Array.from({ length: group.count }, (_, index) => ({
        atMs: (group.delayMs ?? 0) + index * group.intervalMs,
        monsterId: group.monsterId,
        direction: group.direction
      })))
      .sort((a, b) => a.atMs - b.atMs);
  }

  update(deltaMs, spawn) {
    if (!this.active) return;
    this.elapsedMs += deltaMs;
    while (this.queue.length > 0 && this.queue[0].atMs <= this.elapsedMs) {
      const next = this.queue.shift();
      spawn(next);
      this.spawned += 1;
    }
  }

  get exhausted() {
    return this.active && this.queue.length === 0;
  }

  stop() {
    this.active = false;
    this.queue = [];
  }
}

function aliveEntities(state, ids) {
  const entities = [];
  for (const id of ids) {
    const entity = state.entities.get(id);
    if (entity?.alive) entities.push(entity);
  }
  return entities;
}

function nearestEntity(source, candidates, maxRange, scoreModifier = null) {
  const maxRangeSq = maxRange * maxRange;
  let best = null;
  let bestScore = Infinity;
  for (const candidate of candidates) {
    if (!candidate.alive || candidate.id === source.id) continue;
    const rangeSq = distanceSquared(source, candidate);
    if (rangeSq > maxRangeSq) continue;
    const score = rangeSq + (scoreModifier?.(candidate) ?? 0);
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

export class SkillSystem {
  constructor(registry) {
    this.registry = registry;
    this.handlers = new Map([
      ['area-damage', this.areaDamage.bind(this)],
      ['chain-damage', this.chainDamage.bind(this)],
      ['heal', this.heal.bind(this)],
      ['execute', this.execute.bind(this)],
      ['slow-area', this.slowArea.bind(this)]
    ]);
  }

  registerEffect(type, handler) {
    if (this.handlers.has(type)) throw new Error(`Skill effect already registered: ${type}`);
    this.handlers.set(type, handler);
  }

  tryUse(actor, target, context) {
    if (!actor.skillId || actor.skillCooldown > 0 || !actor.alive) return false;
    const skill = this.registry.get('skills', actor.skillId);
    const handler = this.handlers.get(skill.effect.type);
    if (!handler) throw new Error(`No handler for skill effect: ${skill.effect.type}`);

    const used = handler(actor, target, skill, context);
    if (!used) return false;

    actor.skillCooldown = skill.cooldown;
    const direction = target ? actor.view.faceToward(target) : actor.direction;
    actor.direction = direction;
    actor.view.play(skill.animation ?? 'cast', direction, true);
    context.events.emit('combat:skill', { actor, target, skill });
    return true;
  }

  areaDamage(actor, target, skill, context) {
    if (!target || distance(actor, target) > actor.attackRange + target.radius) return false;
    const victims = context.enemiesOf(actor).filter(enemy => distance(enemy, target) <= skill.effect.radius);
    if (victims.length === 0) return false;
    for (const victim of victims) context.damage(actor, victim, actor.attack * skill.effect.multiplier, { skillId: skill.id });
    return true;
  }

  chainDamage(actor, target, skill, context) {
    if (!target || distance(actor, target) > actor.attackRange + target.radius) return false;
    const candidates = context.enemiesOf(actor);
    const hit = new Set();
    let current = target;
    let multiplier = skill.effect.multiplier;
    for (let index = 0; index < skill.effect.maxTargets && current; index += 1) {
      hit.add(current.id);
      context.damage(actor, current, actor.attack * multiplier, { skillId: skill.id });
      const remaining = candidates.filter(candidate => !hit.has(candidate.id) && candidate.alive);
      current = nearestEntity(current, remaining, skill.effect.jumpRadius);
      multiplier *= 0.82;
    }
    return hit.size > 0;
  }

  heal(actor, _target, skill, context) {
    const allies = context.alliesOf(actor)
      .filter(ally => ally.hp < ally.maxHp && distance(actor, ally) <= skill.effect.range)
      .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
    const target = allies[0];
    if (!target) return false;
    context.heal(actor, target, actor.attack * skill.effect.multiplier, { skillId: skill.id });
    return true;
  }

  execute(actor, target, skill, context) {
    if (!target || distance(actor, target) > actor.attackRange + target.radius) return false;
    const multiplier = target.hp / target.maxHp <= skill.effect.threshold
      ? skill.effect.executeMultiplier
      : skill.effect.multiplier;
    context.damage(actor, target, actor.attack * multiplier, { skillId: skill.id });
    return true;
  }

  slowArea(actor, target, skill, context) {
    if (!target || distance(actor, target) > actor.attackRange + target.radius) return false;
    const victims = context.enemiesOf(actor).filter(enemy => distance(enemy, target) <= skill.effect.radius);
    if (victims.length === 0) return false;
    for (const victim of victims) {
      context.damage(actor, victim, actor.attack * skill.effect.multiplier, { skillId: skill.id });
      context.slow(victim, skill.effect.slowFactor, skill.effect.duration);
    }
    return true;
  }
}

export class CombatSystem {
  constructor({ state, registry, grid, events, callbacks }) {
    this.state = state;
    this.registry = registry;
    this.grid = grid;
    this.events = events;
    this.callbacks = callbacks;
    this.skills = new SkillSystem(registry);
  }

  update(deltaSeconds, now) {
    this.tickTimers(deltaSeconds);

    for (const entity of aliveEntities(this.state, [...this.state.defenders, ...this.state.buildings])) {
      this.processDefender(entity, deltaSeconds, now);
    }
    for (const monster of aliveEntities(this.state, this.state.monsters)) {
      this.processMonster(monster, deltaSeconds, now);
    }

    for (const entity of this.state.entities.values()) entity.view?.sync();
  }

  tickTimers(deltaSeconds) {
    for (const entity of this.state.entities.values()) {
      entity.attackCooldown = Math.max(0, entity.attackCooldown - deltaSeconds);
      entity.skillCooldown = Math.max(0, entity.skillCooldown - deltaSeconds);
      entity.status.slowRemaining = Math.max(0, entity.status.slowRemaining - deltaSeconds);
      if (entity.status.slowRemaining === 0) entity.status.slowFactor = 1;
    }
  }

  processDefender(actor, deltaSeconds, now) {
    const enemies = aliveEntities(this.state, this.state.monsters);
    let target = this.resolveTarget(actor, enemies, actor.detectionRange || actor.attackRange);

    const context = this.skillContext(actor);
    if (this.skills.tryUse(actor, target, context)) {
      actor.attackCooldown = Math.max(actor.attackCooldown, 0.28);
      return;
    }

    if (!target) {
      actor.targetId = null;
      this.returnHome(actor, deltaSeconds, now);
      return;
    }

    const targetDistance = distance(actor, target);
    actor.direction = actor.view.faceToward(target);
    const inRange = targetDistance <= actor.attackRange + target.radius;

    if (inRange) {
      actor.moving = false;
      if (actor.attackCooldown <= 0) this.basicAttack(actor, target);
      else actor.view.play('idle', actor.direction);
      return;
    }

    if (actor.kind === 'building' || actor.moveSpeed <= 0) {
      actor.targetId = null;
      actor.view.play('idle', actor.direction);
      return;
    }

    const targetFromHome = Math.hypot(target.x - actor.homeX, target.y - actor.homeY);
    if (targetFromHome > actor.leash + actor.attackRange) {
      actor.targetId = null;
      this.returnHome(actor, deltaSeconds, now);
      return;
    }

    this.moveActor(actor, target, deltaSeconds, now);
  }

  processMonster(monster, deltaSeconds, now) {
    const defenders = aliveEntities(this.state, [...this.state.defenders, ...this.state.buildings]);
    let target = this.resolveMonsterTarget(monster, defenders);

    if (target) {
      monster.direction = monster.view.faceToward(target);
      const targetDistance = distance(monster, target);
      if (targetDistance <= monster.attackRange + target.radius) {
        monster.moving = false;
        if (monster.attackCooldown <= 0) this.basicAttack(monster, target);
        else monster.view.play('idle', monster.direction);
        return;
      }

      // Monsters never leave their planned lane to chase. They only engage a
      // defender or building once it is already in attack range; this keeps
      // path-blocking structures meaningful without introducing nav-mesh
      // collision into the v0.2 backbone.
      monster.targetId = null;
    }

    this.followCrystalPath(monster, deltaSeconds, now);
  }

  resolveTarget(actor, candidates, range) {
    const current = this.state.entities.get(actor.targetId);
    if (current?.alive && distance(actor, current) <= range * 1.15) return current;
    const target = nearestEntity(actor, candidates, range);
    actor.targetId = target?.id ?? null;
    return target;
  }

  resolveMonsterTarget(monster, candidates) {
    const current = this.state.entities.get(monster.targetId);
    if (current?.alive && distance(monster, current) <= monster.aggroRange * 1.2) return current;

    const target = nearestEntity(monster, candidates, monster.aggroRange, candidate => {
      const threatBias = -(candidate.threat ?? 0) * 900;
      const siegeBias = monster.siege && candidate.kind === 'building' ? -1800 : 0;
      return threatBias + siegeBias;
    });
    monster.targetId = target?.id ?? null;
    return target;
  }

  returnHome(actor, deltaSeconds, now) {
    if (actor.kind === 'building') {
      actor.moving = false;
      actor.view.play('idle', actor.direction);
      return;
    }
    const home = { x: actor.homeX, y: actor.homeY };
    if (distance(actor, home) <= 2) {
      actor.x = actor.homeX;
      actor.y = actor.homeY;
      actor.moving = false;
      actor.view.play('idle', actor.direction);
      return;
    }
    this.moveActor(actor, home, deltaSeconds, now);
  }

  moveActor(actor, target, deltaSeconds, _now) {
    const speed = actor.moveSpeed * actor.status.slowFactor;
    const before = { x: actor.x, y: actor.y };
    movePointTowards(actor, target, speed * deltaSeconds);
    actor.direction = directionFromVector(actor.x - before.x, actor.y - before.y, actor.direction);
    actor.moving = true;
    actor.view.play('walk', actor.direction);
  }

  followCrystalPath(monster, deltaSeconds, now) {
    const crystalWorld = this.grid.cellToWorld(GAME_CONFIG.board.crystal);
    const destination = monster.flying
      ? crystalWorld
      : this.grid.cellToWorld(monster.path[Math.min(monster.pathIndex, monster.path.length - 1)] ?? GAME_CONFIG.board.crystal);

    if (distance(monster, crystalWorld) <= monster.radius + 15) {
      this.callbacks.onCrystalHit(monster.crystalDamage, monster);
      this.kill(monster, null, 'leak');
      return;
    }

    const arrived = distance(monster, destination) <= 5;
    if (arrived && !monster.flying && monster.pathIndex < monster.path.length - 1) {
      monster.pathIndex += 1;
    }
    this.moveActor(monster, destination, deltaSeconds, now);
  }

  basicAttack(attacker, target) {
    attacker.attackCooldown = attacker.attackInterval;
    attacker.direction = attacker.view.faceToward(target);
    attacker.view.play('attack', attacker.direction, true);

    let rawDamage = attacker.attack;
    let critical = false;
    if (attacker.critChance && Math.random() < attacker.critChance) {
      rawDamage *= attacker.critMultiplier;
      critical = true;
    }

    this.events.emit('combat:attack', {
      attacker,
      target,
      ranged: attacker.attackStyle === 'ranged',
      critical
    });
    this.damage(attacker, target, rawDamage, { critical });
  }

  damage(source, target, rawDamage, metadata = {}) {
    if (!target?.alive) return 0;
    const amount = mitigateDamage(rawDamage, target.armor);
    target.hp = Math.max(0, target.hp - amount);
    target.view?.flashDamage();
    target.view?.play('hurt', target.direction, true);
    this.events.emit('combat:damage', { source, target, amount, metadata });
    if (target.hp <= 0) this.kill(target, source, 'killed');
    return amount;
  }

  heal(source, target, rawAmount, metadata = {}) {
    if (!target?.alive || target.hp >= target.maxHp) return 0;
    const amount = Math.max(1, Math.round(rawAmount));
    const restored = Math.min(amount, target.maxHp - target.hp);
    target.hp += restored;
    this.events.emit('combat:heal', { source, target, amount: restored, metadata });
    return restored;
  }

  slow(target, factor, duration) {
    if (!target?.alive) return;
    target.status.slowFactor = Math.min(target.status.slowFactor, factor);
    target.status.slowRemaining = Math.max(target.status.slowRemaining, duration);
  }

  kill(entity, source, reason) {
    if (!entity.alive) return;
    entity.alive = false;
    entity.targetId = null;
    entity.view?.playDeath();
    this.callbacks.onEntityDefeated(entity, { source, reason });
  }

  skillContext(actor) {
    return {
      events: this.events,
      enemiesOf: source => source.faction === 'monster'
        ? aliveEntities(this.state, [...this.state.defenders, ...this.state.buildings])
        : aliveEntities(this.state, this.state.monsters),
      alliesOf: source => source.faction === 'monster'
        ? aliveEntities(this.state, this.state.monsters)
        : aliveEntities(this.state, [...this.state.defenders, ...this.state.buildings]),
      damage: (source, target, amount, metadata) => this.damage(source, target, amount, metadata),
      heal: (source, target, amount, metadata) => this.heal(source, target, amount, metadata),
      slow: (target, factor, duration) => this.slow(target, factor, duration)
    };
  }
}

export class RealtimeCombatMode {
  constructor({ waveSystem, combatSystem }) {
    this.waveSystem = waveSystem;
    this.combatSystem = combatSystem;
    this.active = false;
  }

  start({ waveDefinition }) {
    this.waveSystem.begin(waveDefinition);
    this.active = true;
  }

  update(deltaSeconds, now, spawn) {
    if (!this.active) return;
    this.waveSystem.update(deltaSeconds * 1000, spawn);
    this.combatSystem.update(deltaSeconds, now);
  }

  get waveExhausted() {
    return this.waveSystem.exhausted;
  }

  stop() {
    this.waveSystem.stop();
    this.active = false;
  }
}
