import { cellKey } from './config.js';

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

export class ContentRegistry {
  constructor() {
    this.groups = new Map();
    this.locked = false;
  }

  register(kind, definitions) {
    if (this.locked) throw new Error('ContentRegistry is frozen. Register content before boot.');
    if (!kind || !Array.isArray(definitions)) throw new TypeError('register(kind, definitions[]) is required.');

    const bucket = this.groups.get(kind) ?? new Map();
    for (const definition of definitions) {
      if (!definition?.id || typeof definition.id !== 'string') {
        throw new TypeError(`${kind} definition is missing a string id.`);
      }
      if (bucket.has(definition.id)) {
        throw new Error(`Duplicate ${kind} id: ${definition.id}`);
      }
      bucket.set(definition.id, deepFreeze(definition));
    }
    this.groups.set(kind, bucket);
    return this;
  }

  get(kind, id) {
    const value = this.groups.get(kind)?.get(id);
    if (!value) throw new Error(`Unknown ${kind} id: ${id}`);
    return value;
  }

  maybe(kind, id) {
    return this.groups.get(kind)?.get(id) ?? null;
  }

  has(kind, id) {
    return this.groups.get(kind)?.has(id) ?? false;
  }

  list(kind) {
    return [...(this.groups.get(kind)?.values() ?? [])];
  }

  assertReference(kind, id, owner) {
    if (!this.has(kind, id)) throw new Error(`${owner} references missing ${kind} id: ${id}`);
  }

  freeze() {
    this.locked = true;
    return this;
  }
}

export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(eventName, listener) {
    const listeners = this.listeners.get(eventName) ?? new Set();
    listeners.add(listener);
    this.listeners.set(eventName, listeners);
    return () => this.off(eventName, listener);
  }

  off(eventName, listener) {
    this.listeners.get(eventName)?.delete(listener);
  }

  emit(eventName, payload) {
    for (const listener of [...(this.listeners.get(eventName) ?? [])]) listener(payload);
  }

  clear() {
    this.listeners.clear();
  }
}

export class GridModel {
  constructor(boardConfig, reservedCells = []) {
    this.originX = boardConfig.originX;
    this.originY = boardConfig.originY;
    this.cols = boardConfig.cols;
    this.rows = boardConfig.rows;
    this.cellSize = boardConfig.cell;
    this.reserved = new Set(reservedCells.map(cellKey));
    this.placements = new Map();
  }

  inside(cell) {
    return Number.isInteger(cell?.x) && Number.isInteger(cell?.y) &&
      cell.x >= 0 && cell.y >= 0 && cell.x < this.cols && cell.y < this.rows;
  }

  isReserved(cell) {
    return this.reserved.has(cellKey(cell));
  }

  getAt(cell) {
    return this.placements.get(cellKey(cell)) ?? null;
  }

  isOccupied(cell) {
    return this.placements.has(cellKey(cell));
  }

  isBlocked(cell, additionalBlocked = new Set()) {
    const key = cellKey(cell);
    return additionalBlocked.has(key) || Boolean(this.placements.get(key)?.blocksPath);
  }

  place(entityId, cell, blocksPath = false) {
    if (!this.inside(cell)) throw new Error(`Cannot place outside board: ${cellKey(cell)}`);
    if (this.isOccupied(cell)) throw new Error(`Cell already occupied: ${cellKey(cell)}`);
    const placement = Object.freeze({ entityId, cell: Object.freeze({ ...cell }), blocksPath: Boolean(blocksPath) });
    this.placements.set(cellKey(cell), placement);
    return placement;
  }

  removeAt(cell) {
    const key = cellKey(cell);
    const existing = this.placements.get(key) ?? null;
    this.placements.delete(key);
    return existing;
  }

  removeEntity(entityId) {
    for (const [key, placement] of this.placements) {
      if (placement.entityId === entityId) {
        this.placements.delete(key);
        return placement;
      }
    }
    return null;
  }

  neighbors(cell, allowDiagonal = false) {
    const offsets = allowDiagonal
      ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, -1]]
      : [[1, 0], [-1, 0], [0, 1], [0, -1]];
    return offsets
      .map(([dx, dy]) => ({ x: cell.x + dx, y: cell.y + dy }))
      .filter(next => this.inside(next));
  }

  cellToWorld(cell) {
    return {
      x: this.originX + cell.x * this.cellSize + this.cellSize / 2,
      y: this.originY + cell.y * this.cellSize + this.cellSize / 2
    };
  }

  worldToCell(x, y) {
    const cell = {
      x: Math.floor((x - this.originX) / this.cellSize),
      y: Math.floor((y - this.originY) / this.cellSize)
    };
    return this.inside(cell) ? cell : null;
  }
}

export function findGridPath(grid, start, goal, options = {}) {
  if (!grid.inside(start) || !grid.inside(goal)) return [];

  const blocked = options.additionalBlocked ?? new Set();
  const allowDiagonal = Boolean(options.allowDiagonal);
  const startKey = cellKey(start);
  const goalKey = cellKey(goal);
  const queue = [{ ...start }];
  const parents = new Map([[startKey, null]]);

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    const currentKey = cellKey(current);
    if (currentKey === goalKey) break;

    for (const next of grid.neighbors(current, allowDiagonal)) {
      const nextKey = cellKey(next);
      if (parents.has(nextKey)) continue;
      if (nextKey !== goalKey && grid.isBlocked(next, blocked)) continue;
      parents.set(nextKey, currentKey);
      queue.push(next);
    }
  }

  if (!parents.has(goalKey)) return [];
  const path = [];
  let cursorKey = goalKey;
  while (cursorKey) {
    const [x, y] = cursorKey.split(',').map(Number);
    path.push({ x, y });
    cursorKey = parents.get(cursorKey);
  }
  return path.reverse();
}

export function allSpawnRoutesExist(grid, spawnCells, goal, candidateBlock = null) {
  const additionalBlocked = candidateBlock ? new Set([cellKey(candidateBlock)]) : new Set();
  return Object.values(spawnCells).every(spawn =>
    findGridPath(grid, spawn, goal, { additionalBlocked }).length > 0
  );
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function distanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function distance(a, b) {
  return Math.sqrt(distanceSquared(a, b));
}

export function movePointTowards(point, target, maxDistance) {
  const dx = target.x - point.x;
  const dy = target.y - point.y;
  const length = Math.hypot(dx, dy);
  if (length <= maxDistance || length < 0.0001) {
    point.x = target.x;
    point.y = target.y;
    return { arrived: true, dx, dy };
  }
  const scale = maxDistance / length;
  point.x += dx * scale;
  point.y += dy * scale;
  return { arrived: false, dx, dy };
}

export function mitigateDamage(rawDamage, armor = 0) {
  return Math.max(1, Math.round(rawDamage * (1 - clamp(armor, -0.5, 0.75))));
}

export function scaleMonsterStats(definition, waveNumber) {
  const level = Math.max(0, waveNumber - 1);
  return {
    maxHp: Math.round(definition.stats.hp * (1 + level * 0.16)),
    attack: Math.round(definition.stats.attack * (1 + level * 0.09)),
    armor: clamp((definition.stats.armor ?? 0) + Math.floor(level / 5) * 0.02, 0, 0.55)
  };
}

export function createRuntimeState(config) {
  return {
    phase: 'build',
    waveNumber: 1,
    gold: config.economy.startingGold,
    crystalHp: config.crystal.maxHp,
    crystalMaxHp: config.crystal.maxHp,
    selection: null,
    inspectedEntityId: null,
    entities: new Map(),
    defenders: new Set(),
    buildings: new Set(),
    monsters: new Set(),
    nextEntityNumber: 1,
    debug: false
  };
}

export function nextEntityId(state, prefix) {
  const id = `${prefix}-${state.nextEntityNumber}`;
  state.nextEntityNumber += 1;
  return id;
}
