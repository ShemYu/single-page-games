import test from 'node:test';
import assert from 'node:assert/strict';

import { GAME_CONFIG, SPAWN_CELLS } from '../src/config.js';
import { createContentRegistry } from '../src/content.js';
import { EventBus, GridModel, createRuntimeState } from '../src/core.js';
import { CombatSystem, PlacementSystem, WaveSystem } from '../src/systems.js';

function fakeView() {
  return {
    actions: [],
    faceToward() { return 'E'; },
    play(action) { this.actions.push(action); },
    flashDamage() {},
    playDeath() { this.actions.push('death'); },
    sync() {}
  };
}

function actor(overrides) {
  return {
    id: 'actor',
    kind: 'job',
    faction: 'defender',
    x: 0,
    y: 0,
    homeX: 0,
    homeY: 0,
    hp: 100,
    maxHp: 100,
    armor: 0,
    attack: 20,
    moveSpeed: 0,
    attackRange: 100,
    detectionRange: 120,
    attackInterval: 1,
    attackCooldown: 0,
    skillCooldown: 0,
    radius: 10,
    aggroRange: 100,
    threat: 0,
    attackStyle: 'melee',
    skillId: null,
    targetId: null,
    direction: 'S',
    moving: false,
    alive: true,
    status: { slowFactor: 1, slowRemaining: 0 },
    view: fakeView(),
    ...overrides
  };
}

test('WaveSystem emits a deterministic time-ordered spawn queue', () => {
  const wave = new WaveSystem();
  const spawned = [];
  wave.begin({ groups: [
    { monsterId: 'sprout', count: 2, direction: 'W', delayMs: 200, intervalMs: 100 },
    { monsterId: 'moth', count: 1, direction: 'E', delayMs: 50, intervalMs: 1 }
  ] });
  wave.update(60, spawn => spawned.push(spawn.monsterId));
  assert.deepEqual(spawned, ['moth']);
  wave.update(150, spawn => spawned.push(spawn.monsterId));
  assert.deepEqual(spawned, ['moth', 'sprout']);
  wave.update(100, spawn => spawned.push(spawn.monsterId));
  assert.deepEqual(spawned, ['moth', 'sprout', 'sprout']);
  assert.equal(wave.exhausted, true);
});

test('PlacementSystem enforces economy, occupancy, and route safety', () => {
  const registry = createContentRegistry();
  const state = createRuntimeState(GAME_CONFIG);
  const grid = new GridModel(GAME_CONFIG.board, [GAME_CONFIG.board.crystal]);
  const placement = new PlacementSystem({ registry, grid, state });

  assert.equal(placement.validate('job', 'blade', { x: 1, y: 1 }).ok, true);
  grid.place('existing', { x: 1, y: 1 }, false);
  assert.match(placement.validate('job', 'blade', { x: 1, y: 1 }).reason, /占用/);
  state.gold = 0;
  assert.match(placement.validate('job', 'blade', { x: 2, y: 1 }).reason, /金幣不足/);
});


test('Reserved crystal and spawn gates cannot be deployed on', () => {
  const registry = createContentRegistry();
  const state = createRuntimeState(GAME_CONFIG);
  const grid = new GridModel(GAME_CONFIG.board, [
    GAME_CONFIG.board.crystal,
    ...Object.values(SPAWN_CELLS)
  ]);
  const placement = new PlacementSystem({ registry, grid, state });

  assert.match(placement.validate('job', 'blade', GAME_CONFIG.board.crystal).reason, /入口與水晶格/);
  assert.match(placement.validate('building', 'barricade', SPAWN_CELLS.W).reason, /入口與水晶格/);
});

test('CombatSystem resolves a basic attack and delegates entity cleanup', () => {
  const registry = createContentRegistry();
  const state = createRuntimeState(GAME_CONFIG);
  const events = new EventBus();
  const grid = new GridModel(GAME_CONFIG.board);
  const defender = actor({ id: 'defender', attack: 20 });
  const monster = actor({
    id: 'monster',
    kind: 'monster',
    faction: 'monster',
    x: 20,
    hp: 10,
    maxHp: 10,
    attack: 1,
    attackRange: 5,
    detectionRange: 0,
    aggroRange: 0,
    path: [{ x: 0, y: 0 }],
    pathIndex: 0,
    flying: false,
    crystalDamage: 1,
    reward: 1
  });
  state.entities.set(defender.id, defender);
  state.entities.set(monster.id, monster);
  state.defenders.add(defender.id);
  state.monsters.add(monster.id);

  const defeated = [];
  const combat = new CombatSystem({
    state,
    registry,
    grid,
    events,
    callbacks: {
      onEntityDefeated(entity, metadata) {
        defeated.push({ entity, metadata });
        state.entities.delete(entity.id);
        state.monsters.delete(entity.id);
      },
      onCrystalHit() {}
    }
  });

  combat.update(0.016, 0);
  assert.equal(defeated.length, 1);
  assert.equal(defeated[0].entity.id, 'monster');
  assert.equal(defeated[0].metadata.reason, 'killed');
  assert.equal(state.monsters.size, 0);
});


test('Ground monsters stay on their path instead of chasing across blockers', () => {
  const registry = createContentRegistry();
  const state = createRuntimeState(GAME_CONFIG);
  const events = new EventBus();
  const grid = new GridModel(GAME_CONFIG.board);
  const start = grid.cellToWorld(SPAWN_CELLS.W);
  const next = { x: SPAWN_CELLS.W.x + 1, y: SPAWN_CELLS.W.y };

  const defender = actor({
    id: 'defender',
    x: start.x,
    y: start.y - 70,
    homeX: start.x,
    homeY: start.y - 70
  });
  const monster = actor({
    id: 'monster',
    kind: 'monster',
    faction: 'monster',
    x: start.x,
    y: start.y,
    homeX: start.x,
    homeY: start.y,
    moveSpeed: 40,
    attackRange: 10,
    aggroRange: 100,
    path: [SPAWN_CELLS.W, next, GAME_CONFIG.board.crystal],
    pathIndex: 1,
    flying: false,
    crystalDamage: 1
  });

  state.entities.set(defender.id, defender);
  state.entities.set(monster.id, monster);
  state.defenders.add(defender.id);
  state.monsters.add(monster.id);

  const combat = new CombatSystem({
    state,
    registry,
    grid,
    events,
    callbacks: { onEntityDefeated() {}, onCrystalHit() {} }
  });

  combat.processMonster(monster, 0.1, 0);
  assert.ok(monster.x > start.x, 'monster should advance to the next path cell');
  assert.equal(monster.y, start.y, 'monster should not move vertically toward an off-lane defender');
  assert.equal(monster.targetId, null);
});
