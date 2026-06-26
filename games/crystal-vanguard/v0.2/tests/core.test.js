import test from 'node:test';
import assert from 'node:assert/strict';

import { directionFromVector } from '../src/config.js';
import {
  ContentRegistry,
  GridModel,
  allSpawnRoutesExist,
  findGridPath,
  mitigateDamage,
  movePointTowards
} from '../src/core.js';

test('ContentRegistry rejects duplicate ids and unknown lookups', () => {
  const registry = new ContentRegistry().register('jobs', [{ id: 'blade' }]);
  assert.throws(() => registry.register('jobs', [{ id: 'blade' }]), /Duplicate jobs id/);
  assert.throws(() => registry.get('jobs', 'mage'), /Unknown jobs id/);
});

test('Grid pathfinder routes around blocking placements', () => {
  const grid = new GridModel({ originX: 0, originY: 0, cols: 5, rows: 5, cell: 10 });
  grid.place('wall-a', { x: 2, y: 1 }, true);
  grid.place('wall-b', { x: 2, y: 2 }, true);
  grid.place('wall-c', { x: 2, y: 3 }, true);

  const path = findGridPath(grid, { x: 0, y: 2 }, { x: 4, y: 2 });
  assert.ok(path.length > 0);
  assert.equal(path[0].x, 0);
  assert.equal(path.at(-1).x, 4);
  assert.ok(path.some(cell => cell.y === 0 || cell.y === 4));
});

test('Grid pathfinder detects a sealed board and route guard rejects final block', () => {
  const grid = new GridModel({ originX: 0, originY: 0, cols: 5, rows: 5, cell: 10 });
  for (let y = 0; y < 5; y += 1) grid.place(`wall-${y}`, { x: 2, y }, true);
  assert.deepEqual(findGridPath(grid, { x: 0, y: 2 }, { x: 4, y: 2 }), []);

  const corridor = new GridModel({ originX: 0, originY: 0, cols: 3, rows: 1, cell: 10 });
  assert.equal(allSpawnRoutesExist(
    corridor,
    { W: { x: 0, y: 0 } },
    { x: 2, y: 0 },
    { x: 1, y: 0 }
  ), false);
});

test('Combat math applies armor and movement clamps to target', () => {
  assert.equal(mitigateDamage(100, 0.25), 75);
  assert.equal(mitigateDamage(1, 0.75), 1);

  const point = { x: 0, y: 0 };
  const first = movePointTowards(point, { x: 3, y: 4 }, 2.5);
  assert.equal(first.arrived, false);
  assert.equal(point.x, 1.5);
  assert.equal(point.y, 2);
  const second = movePointTowards(point, { x: 3, y: 4 }, 3);
  assert.equal(second.arrived, true);
  assert.deepEqual(point, { x: 3, y: 4 });
});

test('Eight-direction mapping follows the sprite row contract', () => {
  assert.equal(directionFromVector(1, 0, 'S'), 'E');
  assert.equal(directionFromVector(0, 1, 'E'), 'S');
  assert.equal(directionFromVector(-1, -1, 'S'), 'NW');
  assert.equal(directionFromVector(1, -1, 'S'), 'NE');
});
