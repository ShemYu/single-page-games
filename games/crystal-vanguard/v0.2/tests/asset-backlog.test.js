import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { createContentRegistry } from '../src/content.js';

const backlogUrl = new URL('../asset-backlog.json', import.meta.url);
const csvUrl = new URL('../art-assets.csv', import.meta.url);

async function loadBacklog() {
  return JSON.parse(await readFile(backlogUrl, 'utf8'));
}

test('every runtime visual has exactly one art backlog record', async () => {
  const registry = createContentRegistry();
  const backlog = await loadBacklog();
  const runtimeIds = registry.list('assets').map(asset => asset.id).sort();
  const trackedIds = backlog.runtime_assets.map(item => item.runtime_asset_id).sort();

  assert.deepEqual(trackedIds, runtimeIds);
  assert.equal(new Set(trackedIds).size, trackedIds.length);
});

test('art records contain actionable production fields and valid statuses', async () => {
  const backlog = await loadBacklog();
  const allowed = new Set(backlog.status_values);

  for (const item of [...backlog.runtime_assets, ...backlog.supporting_assets]) {
    assert.ok(item.ticket_id);
    assert.ok(allowed.has(item.status), `${item.ticket_id}: invalid status ${item.status}`);
    assert.match(item.priority, /^P[0-2]$/);
    assert.ok(item.runtime_now);
    assert.ok(Array.isArray(item.deliverables) && item.deliverables.length > 0);
    assert.ok(item.issue);
    assert.ok(item.next_action);
  }
});

test('CSV handoff includes all ticket and runtime IDs', async () => {
  const backlog = await loadBacklog();
  const csv = await readFile(csvUrl, 'utf8');

  assert.match(csv.split(/\r?\n/, 1)[0], /ticket_id,runtime_asset_id/);
  for (const item of backlog.runtime_assets) {
    assert.ok(csv.includes(item.ticket_id));
    assert.ok(csv.includes(item.runtime_asset_id));
  }
});
