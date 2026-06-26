import test from 'node:test';
import assert from 'node:assert/strict';

class PhaserContainerStub {}
class PhaserSceneStub {}

globalThis.Phaser = {
  GameObjects: { Container: PhaserContainerStub },
  Scene: PhaserSceneStub
};

test('browser-facing modules import with the Phaser boundary stubbed', async () => {
  const modules = await Promise.all([
    import('../src/config.js'),
    import('../src/core.js'),
    import('../src/content.js'),
    import('../src/asset-system.js'),
    import('../src/actors.js'),
    import('../src/systems.js'),
    import('../src/director.js'),
    import('../src/ui.js'),
    import('../src/scenes.js')
  ]);

  assert.equal(modules.length, 9);
  assert.equal(typeof modules[4].ActorFactory, 'function');
  assert.equal(typeof modules[8].BattleScene, 'function');
});
