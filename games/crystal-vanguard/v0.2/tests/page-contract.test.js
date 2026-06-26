import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('page boot contract loads Phaser before the guarded module import', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const phaserIndex = html.indexOf('phaser@3.90.0/dist/phaser.min.js');
  const mainIndex = html.indexOf("import('./src/main.js')");

  assert.ok(phaserIndex >= 0);
  assert.ok(mainIndex > phaserIndex);
  assert.match(html, /if \(!window\.Phaser\)/);
});

test('all documented local entry points exist', async () => {
  const paths = [
    'src/main.js',
    'src/content.js',
    'src/core.js',
    'src/asset-system.js',
    'src/actors.js',
    'src/systems.js',
    'src/director.js',
    'src/scenes.js',
    'src/ui.js',
    'docs/ARCHITECTURE.md',
    'docs/ASSET_BACKLOG.md',
    'asset-backlog.json',
    'art-assets.csv'
  ];
  await Promise.all(paths.map(path => access(new URL(path, root))));
});
