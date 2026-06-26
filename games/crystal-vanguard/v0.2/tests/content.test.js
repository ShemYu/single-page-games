import test from 'node:test';
import assert from 'node:assert/strict';

import { createContentRegistry } from '../src/content.js';

test('Content registry boots with all v0.2 extension points connected', () => {
  const registry = createContentRegistry();
  assert.equal(registry.list('jobs').length, 6);
  assert.equal(registry.list('skills').length, 6);
  assert.equal(registry.list('monsters').length, 6);
  assert.equal(registry.list('buildings').length, 2);
  assert.equal(registry.list('waves').length, 5);
});

test('Blade uses the integrated directional sheet and every other asset has a fallback', () => {
  const registry = createContentRegistry();
  const blade = registry.get('assets', 'unit.blade.rank1');
  assert.equal(blade.type, 'directional-sprite');
  assert.deepEqual(Object.keys(blade.actions), ['idle', 'walk', 'attack', 'cast', 'hurt', 'death']);
  assert.equal(blade.actions.idle.file, '../assets/units/blade-rank1-idle.png');

  const placeholderAssets = registry.list('assets').filter(asset => asset.type === 'placeholder');
  assert.equal(placeholderAssets.length, 13);
  assert.ok(placeholderAssets.every(asset => asset.fallback?.glyph));
});

test('All wave groups reference registered monsters', () => {
  const registry = createContentRegistry();
  for (const wave of registry.list('waves')) {
    for (const group of wave.groups) {
      assert.ok(registry.has('monsters', group.monsterId), `${wave.id} -> ${group.monsterId}`);
      assert.ok(group.count > 0);
      assert.ok(group.intervalMs > 0);
    }
  }
});
