import { GAME_CONFIG, PHASE, SPAWN_CELLS, SPAWN_LABELS, phaseLabel } from './config.js';
import {
  EventBus,
  GridModel,
  createRuntimeState,
  findGridPath,
  nextEntityId
} from './core.js';
import { ActorFactory } from './actors.js';
import {
  CombatSystem,
  PlacementSystem,
  RealtimeCombatMode,
  WaveSystem
} from './systems.js';

export class GameDirector {
  constructor(scene, registry, assetSystem) {
    this.scene = scene;
    this.registry = registry;
    this.assetSystem = assetSystem;
    this.events = new EventBus();
    this.state = createRuntimeState(GAME_CONFIG);
    this.grid = new GridModel(GAME_CONFIG.board, [
      GAME_CONFIG.board.crystal,
      ...Object.values(SPAWN_CELLS)
    ]);
    this.actorFactory = new ActorFactory(scene, registry, assetSystem);
    this.placement = new PlacementSystem({ registry, grid: this.grid, state: this.state });
    this.waveSystem = new WaveSystem();
    this.combatSystem = new CombatSystem({
      state: this.state,
      registry,
      grid: this.grid,
      events: this.events,
      callbacks: {
        onEntityDefeated: (entity, metadata) => this.onEntityDefeated(entity, metadata),
        onCrystalHit: (amount, monster) => this.damageCrystal(amount, monster)
      }
    });
    this.combatModes = new Map();
    this.registerCombatMode(
      'realtime',
      new RealtimeCombatMode({ waveSystem: this.waveSystem, combatSystem: this.combatSystem })
    );
    this.combatMode = this.combatModes.get(GAME_CONFIG.defaultCombatMode);
    if (!this.combatMode) throw new Error(`Unknown default combat mode: ${GAME_CONFIG.defaultCombatMode}`);
    this.assetReport = [];
    this.lastBroadcastAt = 0;
    this.crystalView = null;
  }

  registerCombatMode(id, mode) {
    if (!id || typeof id !== 'string') throw new TypeError('Combat mode id must be a non-empty string.');
    if (this.combatModes.has(id)) throw new Error(`Duplicate combat mode id: ${id}`);
    for (const method of ['start', 'update', 'stop']) {
      if (typeof mode?.[method] !== 'function') throw new TypeError(`Combat mode ${id} is missing ${method}().`);
    }
    this.combatModes.set(id, mode);
    return this;
  }

  setCombatMode(id) {
    if (this.state.phase !== PHASE.BUILD) throw new Error('Combat mode can only change during build phase.');
    const next = this.combatModes.get(id);
    if (!next) throw new Error(`Unknown combat mode id: ${id}`);
    this.combatMode?.stop();
    this.combatMode = next;
    return this;
  }

  initialize(assetReport = []) {
    this.assetReport = assetReport;
    this.createCrystalView();
    this.emitState(true);
    this.events.emit('assets:report', this.assetReport);
    this.toast('先選擇職業或建築，再點擊棋盤部署。右鍵可拆除並退款。', 'info');
  }

  createCrystalView() {
    const position = this.grid.cellToWorld(GAME_CONFIG.board.crystal);
    const glow = this.scene.add.circle(0, 1, 40, 0x62e8d4, 0.13);
    const base = this.scene.add.ellipse(0, 14, 76, 30, 0x17262c, 0.95).setStrokeStyle(3, 0x799c96, 0.7);
    const crystal = this.scene.add.polygon(
      0,
      -7,
      [0, -49, 29, -21, 21, 28, 0, 45, -21, 28, -29, -21],
      0x6fe4d3,
      1
    ).setStrokeStyle(3, 0xd9fff4, 0.92);
    const core = this.scene.add.polygon(0, -9, [0, -36, 12, -14, 7, 23, -6, 27, -12, -14], 0xc7fff0, 0.75);

    this.crystalView = this.scene.add.container(position.x, position.y, [glow, base, crystal, core]);
    this.crystalView.setDepth(position.y - 2);
    this.scene.tweens.add({
      targets: glow,
      scale: 1.18,
      alpha: 0.28,
      yoyo: true,
      repeat: -1,
      duration: 920,
      ease: 'Sine.easeInOut'
    });
  }

  get currentWaveDefinition() {
    const waves = this.registry.list('waves');
    return waves[(this.state.waveNumber - 1) % waves.length];
  }

  get waveCycle() {
    return Math.floor((this.state.waveNumber - 1) / this.registry.list('waves').length) + 1;
  }

  selectCatalog(kind, id) {
    if (this.state.phase !== PHASE.BUILD) {
      this.toast('戰鬥中無法更換部署工具。', 'bad');
      return;
    }
    this.placement.definitionFor(kind, id);
    this.state.selection = { kind, id };
    this.setInspectedEntity(null);
    this.events.emit('selection:changed', this.state.selection);
    this.emitState(true);
  }

  clearSelection() {
    this.state.selection = null;
    this.events.emit('selection:changed', null);
    this.emitState(true);
  }

  previewPlacement(cell) {
    if (!cell || !this.state.selection) return { ok: false, reason: '' };
    return this.placement.validate(this.state.selection.kind, this.state.selection.id, cell);
  }

  handlePrimaryCell(cell) {
    if (!cell) return;
    const existing = this.grid.getAt(cell);
    if (existing) {
      this.setInspectedEntity(existing.entityId);
      return;
    }
    if (!this.state.selection) {
      this.toast('請先從右側選擇職業或建築。', 'info');
      return;
    }
    this.placeSelection(cell);
  }

  placeSelection(cell) {
    const { kind, id } = this.state.selection;
    const validation = this.placement.validate(kind, id, cell);
    if (!validation.ok) {
      this.toast(validation.reason, 'bad');
      return false;
    }

    const definition = validation.definition;
    const entityId = nextEntityId(this.state, kind);
    const position = this.grid.cellToWorld(cell);
    const entity = kind === 'job'
      ? this.actorFactory.createJob(entityId, definition, cell, position)
      : this.actorFactory.createBuilding(entityId, definition, cell, position);

    this.state.gold -= definition.cost;
    this.state.entities.set(entity.id, entity);
    if (kind === 'job') this.state.defenders.add(entity.id);
    else this.state.buildings.add(entity.id);
    this.grid.place(entity.id, cell, definition.blocksPath);
    this.setInspectedEntity(entity.id);
    this.toast(`${definition.name} 已部署。`, 'good');
    this.events.emit('placement:created', { entity });
    this.emitState(true);
    return true;
  }

  removeAt(cell) {
    if (!cell) return false;
    if (this.state.phase !== PHASE.BUILD) {
      this.toast('戰鬥中不能拆除部署。', 'bad');
      return false;
    }
    const placement = this.grid.getAt(cell);
    if (!placement) return false;
    const entity = this.state.entities.get(placement.entityId);
    if (!entity || entity.kind === 'monster') return false;

    const refund = this.placement.refundFor(entity);
    this.state.gold += refund;
    this.grid.removeAt(cell);
    this.state.entities.delete(entity.id);
    this.state.defenders.delete(entity.id);
    this.state.buildings.delete(entity.id);
    entity.alive = false;
    entity.view?.destroy();
    if (this.state.inspectedEntityId === entity.id) this.setInspectedEntity(null);
    this.toast(`${entity.name} 已拆除，返還 ${refund} 金幣。`, 'info');
    this.events.emit('placement:removed', { entity, refund });
    this.emitState(true);
    return true;
  }

  setInspectedEntity(entityId) {
    const previous = this.state.entities.get(this.state.inspectedEntityId);
    previous?.view?.setSelected(false);
    this.state.inspectedEntityId = entityId;
    const current = this.state.entities.get(entityId);
    current?.view?.setSelected(true);
    this.events.emit('inspection:changed', current ?? null);
    this.emitState(true);
  }

  startWave() {
    if (this.state.phase !== PHASE.BUILD) return false;
    if (this.state.defenders.size + this.state.buildings.size === 0) {
      this.toast('至少部署一個單位或防禦建築。', 'bad');
      return false;
    }

    this.state.phase = PHASE.COMBAT;
    this.clearSelection();
    this.setInspectedEntity(null);
    this.combatMode.start({
      waveDefinition: this.currentWaveDefinition,
      waveNumber: this.state.waveNumber
    });
    this.toast(`第 ${this.state.waveNumber} 波：${this.currentWaveDefinition.label}`, 'warning');
    this.events.emit('wave:started', {
      waveNumber: this.state.waveNumber,
      definition: this.currentWaveDefinition
    });
    this.emitState(true);
    return true;
  }

  update(time, delta) {
    if (this.state.phase !== PHASE.COMBAT) return;
    const deltaSeconds = Math.min(delta / 1000, 0.05);
    this.combatMode.update(deltaSeconds, time, spawn => this.spawnMonster(spawn));

    if (this.state.crystalHp <= 0) {
      this.defeat();
      return;
    }

    if (this.combatMode.waveExhausted && this.state.monsters.size === 0) {
      this.completeWave();
      return;
    }

    if (time - this.lastBroadcastAt >= GAME_CONFIG.timings.stateBroadcastMs) {
      this.emitState();
      this.lastBroadcastAt = time;
    }
  }

  spawnMonster(spawn) {
    const definition = this.registry.get('monsters', spawn.monsterId);
    const spawnCell = SPAWN_CELLS[spawn.direction];
    const position = this.grid.cellToWorld(spawnCell);
    const path = definition.traits?.includes('flying')
      ? [spawnCell, GAME_CONFIG.board.crystal]
      : findGridPath(this.grid, spawnCell, GAME_CONFIG.board.crystal);

    if (path.length === 0) {
      console.error('Placement invariant broken: no route at spawn time.', spawn);
      return;
    }

    const id = nextEntityId(this.state, 'monster');
    const monster = this.actorFactory.createMonster(id, definition, position, path, this.state.waveNumber);
    monster.spawnDirection = spawn.direction;
    this.state.entities.set(monster.id, monster);
    this.state.monsters.add(monster.id);
    this.events.emit('monster:spawned', { monster, direction: spawn.direction });
  }

  onEntityDefeated(entity, metadata) {
    this.state.entities.delete(entity.id);
    this.state.defenders.delete(entity.id);
    this.state.buildings.delete(entity.id);
    this.state.monsters.delete(entity.id);
    this.grid.removeEntity(entity.id);

    if (entity.kind === 'monster' && metadata.reason === 'killed') {
      this.state.gold += entity.reward ?? 0;
    }
    if (this.state.inspectedEntityId === entity.id) this.state.inspectedEntityId = null;

    this.events.emit('entity:defeated', { entity, metadata });
    this.emitState(true);
  }

  damageCrystal(amount, monster) {
    this.state.crystalHp = Math.max(0, this.state.crystalHp - amount);
    this.scene.cameras.main.shake(110, 0.0034);
    if (this.crystalView) {
      this.scene.tweens.killTweensOf(this.crystalView);
      this.crystalView.setScale(1);
      this.scene.tweens.add({ targets: this.crystalView, scale: 1.08, yoyo: true, duration: 100 });
    }
    this.events.emit('crystal:damaged', { amount, monster, hp: this.state.crystalHp });
    this.emitState(true);
  }

  completeWave() {
    this.combatMode.stop();
    const completedWave = this.currentWaveDefinition;
    const reward = completedWave.reward + Math.max(0, this.waveCycle - 1) * 2;
    this.state.gold += reward;
    this.state.waveNumber += 1;
    this.state.phase = PHASE.BUILD;

    for (const entity of this.state.entities.values()) {
      if (entity.faction !== 'defender') continue;
      const healRatio = entity.kind === 'building' ? 0.18 : 0.32;
      entity.hp = Math.min(entity.maxHp, entity.hp + Math.round(entity.maxHp * healRatio));
      entity.attackCooldown = 0;
      entity.skillCooldown = 0;
      entity.targetId = null;
      entity.x = entity.homeX;
      entity.y = entity.homeY;
      entity.view?.play('idle', entity.direction, true);
      entity.view?.sync(true);
    }

    this.toast(`守住了！波次獎勵 ${reward} 金幣。`, 'good');
    this.events.emit('wave:completed', { reward, completedWave });
    this.emitState(true);
  }

  defeat() {
    if (this.state.phase === PHASE.DEFEAT) return;
    this.combatMode.stop();
    this.state.phase = PHASE.DEFEAT;
    this.toast(`水晶失守。你守到了第 ${this.state.waveNumber} 波。`, 'bad');
    this.events.emit('game:defeated', this.snapshot());
    this.emitState(true);
  }

  toggleDebug(force = null) {
    this.state.debug = force == null ? !this.state.debug : Boolean(force);
    this.events.emit('debug:changed', this.state.debug);
    this.emitState(true);
    return this.state.debug;
  }

  snapshot() {
    const inspected = this.state.entities.get(this.state.inspectedEntityId) ?? null;
    return {
      version: GAME_CONFIG.version,
      phase: this.state.phase,
      phaseLabel: phaseLabel(this.state.phase),
      waveNumber: this.state.waveNumber,
      waveLabel: this.currentWaveDefinition.label,
      waveCycle: this.waveCycle,
      gold: this.state.gold,
      crystalHp: this.state.crystalHp,
      crystalMaxHp: this.state.crystalMaxHp,
      defenderCount: this.state.defenders.size,
      buildingCount: this.state.buildings.size,
      defenderCap: GAME_CONFIG.economy.defenderCap,
      enemyCount: this.state.monsters.size,
      selection: this.state.selection ? { ...this.state.selection } : null,
      inspected,
      debug: this.state.debug,
      assetReport: this.assetReport
    };
  }

  emitState(force = false) {
    if (force) this.lastBroadcastAt = this.scene.time.now;
    this.events.emit('state:changed', this.snapshot());
  }

  toast(message, tone = 'info') {
    this.events.emit('toast', { message, tone });
  }

  destroy() {
    this.combatMode.stop();
    for (const entity of this.state.entities.values()) entity.view?.destroy();
    this.state.entities.clear();
    this.events.clear();
    this.crystalView?.destroy();
  }

  waveForecast() {
    return this.currentWaveDefinition.groups.map(group => ({
      ...group,
      directionLabel: SPAWN_LABELS[group.direction],
      monsterName: this.registry.get('monsters', group.monsterId).name
    }));
  }
}
