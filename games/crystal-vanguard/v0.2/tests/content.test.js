import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ASSETS,
  CONTENT_DEFINITIONS,
  ContentRegistry,
  createContentRegistry
} from '../src/content.js';

test('all v0.2 content definitions validate and cross references resolve', () => {
  const registry = createContentRegistry();

  assert.equal(registry.get('profession', 'blade').visualAssetId, 'unit.blade.rank1');
  assert.equal(registry.get('building', 'bolt-tower').attack.type, 'projectile');
  assert.equal(registry.all('wave').length, 3);
});

test('duplicate ids fail fast within a content collection', () => {
  assert.throws(
    () => new ContentRegistry({
      asset: [ASSETS[0], { ...ASSETS[0] }]
    }),
    /Duplicate asset id/
  );
});

test('missing references are rejected before Phaser boots', () => {
  const brokenProfession = {
    ...CONTENT_DEFINITIONS.profession[0],
    visualAssetId: 'unit.missing'
  };

  assert.throws(
    () => createContentRegistry({
      ...CONTENT_DEFINITIONS,
      profession: [brokenProfession]
    }),
    /references missing asset/
  );
});

test('validated definitions are frozen to prevent runtime mutation', () => {
  const registry = createContentRegistry();
  const blade = registry.get('profession', 'blade');

  assert.equal(Object.isFrozen(blade), true);
  assert.equal(Object.isFrozen(blade.stats), true);
});
