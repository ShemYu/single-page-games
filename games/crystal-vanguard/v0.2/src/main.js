import { GAME_CONFIG } from './config.js';
import { createContentRegistry } from './content.js';
import { AssetSystem } from './asset-system.js';
import { BattleScene, BootScene } from './scenes.js';

function showBootError(message) {
  const root = document.querySelector('#game');
  if (root) {
    root.innerHTML = `<div class="boot-error"><strong>Crystal Vanguard 無法啟動</strong><p>${message}</p></div>`;
  }
}

try {
  if (!window.Phaser) throw new Error('Phaser 3.90.0 未載入，請檢查 CDN 或網路連線。');

  const contentRegistry = createContentRegistry();
  const assetSystem = new AssetSystem(contentRegistry);
  const bootScene = new BootScene(contentRegistry, assetSystem);
  const battleScene = new BattleScene(contentRegistry, assetSystem);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    backgroundColor: GAME_CONFIG.backgroundColor,
    pixelArt: true,
    render: {
      antialias: false,
      pixelArt: true,
      roundPixels: true
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_CONFIG.width,
      height: GAME_CONFIG.height
    },
    scene: [bootScene, battleScene]
  });

  window.__CRYSTAL_VANGUARD_V02__ = {
    game,
    contentRegistry,
    assetSystem,
    version: GAME_CONFIG.version
  };
} catch (error) {
  console.error(error);
  showBootError(error instanceof Error ? error.message : String(error));
}
