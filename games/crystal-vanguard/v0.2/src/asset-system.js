import { DIRECTION_ROWS } from './config.js';

export class AssetSystem {
  constructor(contentRegistry) {
    this.registry = contentRegistry;
    this.failedKeys = new Set();
    this.readyDirectionalAssets = new Set();
    this.readyStaticAssets = new Set();
    this.report = [];
  }

  textureKey(assetId, action) {
    return `cv:${assetId}:${action}`;
  }

  animationKey(assetId, action, direction) {
    return `cv:${assetId}:${action}:${direction}`;
  }

  preload(scene) {
    scene.load.on('loaderror', file => {
      this.failedKeys.add(file.key);
      console.warn(`[Crystal Vanguard] Failed to load asset: ${file.key}`, file.src);
    });

    for (const asset of this.registry.list('assets')) {
      if (asset.type === 'directional-sprite') {
        for (const [actionName, action] of Object.entries(asset.actions)) {
          scene.load.spritesheet(this.textureKey(asset.id, actionName), action.file, {
            frameWidth: asset.cell,
            frameHeight: asset.cell
          });
        }
      } else if (asset.type === 'static-sprite') {
        scene.load.image(this.textureKey(asset.id, 'static'), asset.file);
      }
    }
  }

  finalize(scene) {
    this.report = [];
    this.readyDirectionalAssets.clear();
    this.readyStaticAssets.clear();

    for (const asset of this.registry.list('assets')) {
      if (asset.type === 'placeholder') {
        this.report.push({
          id: asset.id,
          requested: asset.status,
          runtime: 'placeholder',
          issue: 'source artwork missing'
        });
        continue;
      }

      if (asset.type === 'static-sprite') {
        const key = this.textureKey(asset.id, 'static');
        const issues = [];
        if (this.failedKeys.has(key) || !scene.textures.exists(key)) {
          issues.push('static: load failed');
        } else {
          const texture = scene.textures.get(key);
          const image = texture.getSourceImage?.(0) ?? texture.source?.[0]?.image;
          if (asset.size && (!image || image.width !== asset.size[0] || image.height !== asset.size[1])) {
            issues.push(`static: expected ${asset.size[0]}×${asset.size[1]}, got ${image?.width ?? '?'}×${image?.height ?? '?'}`);
          }
        }
        if (issues.length === 0) this.readyStaticAssets.add(asset.id);
        this.report.push({
          id: asset.id,
          requested: asset.status,
          runtime: issues.length ? 'fallback' : 'static-sprite',
          issue: issues.join('; ') || 'none'
        });
        continue;
      }

      const issues = [];
      for (const [actionName, action] of Object.entries(asset.actions)) {
        const key = this.textureKey(asset.id, actionName);
        if (this.failedKeys.has(key) || !scene.textures.exists(key)) {
          issues.push(`${actionName}: load failed`);
          continue;
        }

        const texture = scene.textures.get(key);
        const image = texture.getSourceImage?.(0) ?? texture.source?.[0]?.image;
        const expectedWidth = action.frames * asset.cell;
        const expectedHeight = asset.rows * asset.cell;
        if (!image || image.width !== expectedWidth || image.height !== expectedHeight) {
          issues.push(
            `${actionName}: expected ${expectedWidth}×${expectedHeight}, got ${image?.width ?? '?'}×${image?.height ?? '?'}`
          );
        }
      }

      if (issues.length === 0) {
        this.readyDirectionalAssets.add(asset.id);
        this.registerAnimations(scene, asset);
      }

      this.report.push({
        id: asset.id,
        requested: asset.status,
        runtime: issues.length ? 'fallback' : 'directional-sprite',
        issue: issues.join('; ') || 'none'
      });
    }

    console.table(this.report);
    return this.report.map(row => ({ ...row }));
  }

  registerAnimations(scene, asset) {
    for (const [actionName, action] of Object.entries(asset.actions)) {
      const texture = this.textureKey(asset.id, actionName);
      for (const [direction, row] of Object.entries(DIRECTION_ROWS)) {
        const key = this.animationKey(asset.id, actionName, direction);
        if (scene.anims.exists(key)) continue;
        scene.anims.create({
          key,
          frames: scene.anims.generateFrameNumbers(texture, {
            start: row * action.frames,
            end: row * action.frames + action.frames - 1
          }),
          frameRate: action.fps,
          repeat: action.repeat,
          skipMissedFrames: true
        });
      }
    }
  }

  get(assetId) {
    return this.registry.get('assets', assetId);
  }

  isDirectionalReady(assetId) {
    return this.readyDirectionalAssets.has(assetId);
  }

  isStaticReady(assetId) {
    return this.readyStaticAssets.has(assetId);
  }

  getReport() {
    return this.report.map(row => ({ ...row }));
  }
}
