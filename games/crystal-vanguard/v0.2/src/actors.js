import { directionFromVector } from './config.js';
import { scaleMonsterStats } from './core.js';

function drawFallbackShape(graphics, fallback, kind) {
  const primary = fallback.primary ?? 0x617a86;
  const secondary = fallback.secondary ?? 0xd8eee8;
  graphics.lineStyle(3, secondary, 0.9);
  graphics.fillStyle(primary, 1);

  switch (fallback.shape) {
    case 'shield':
      graphics.fillPoints([{ x: 0, y: -48 }, { x: 25, y: -34 }, { x: 20, y: -2 }, { x: 0, y: 9 }, { x: -20, y: -2 }, { x: -25, y: -34 }], true);
      graphics.strokePoints([{ x: 0, y: -48 }, { x: 25, y: -34 }, { x: 20, y: -2 }, { x: 0, y: 9 }, { x: -20, y: -2 }, { x: -25, y: -34 }], true);
      break;
    case 'diamond':
      graphics.fillPoints([{ x: 0, y: -48 }, { x: 25, y: -20 }, { x: 0, y: 8 }, { x: -25, y: -20 }], true);
      graphics.strokePoints([{ x: 0, y: -48 }, { x: 25, y: -20 }, { x: 0, y: 8 }, { x: -25, y: -20 }], true);
      break;
    case 'hex':
      graphics.fillPoints([{ x: -21, y: -43 }, { x: 21, y: -43 }, { x: 29, y: -20 }, { x: 21, y: 4 }, { x: -21, y: 4 }, { x: -29, y: -20 }], true);
      graphics.strokePoints([{ x: -21, y: -43 }, { x: 21, y: -43 }, { x: 29, y: -20 }, { x: 21, y: 4 }, { x: -21, y: 4 }, { x: -29, y: -20 }], true);
      break;
    case 'square':
    case 'wall':
      graphics.fillRoundedRect(-28, -48, 56, 52, 4);
      graphics.strokeRoundedRect(-28, -48, 56, 52, 4);
      if (fallback.shape === 'wall') {
        graphics.lineStyle(2, secondary, 0.45);
        graphics.lineBetween(-24, -31, 24, -31);
        graphics.lineBetween(-24, -14, 24, -14);
        graphics.lineBetween(-8, -46, -8, 2);
        graphics.lineBetween(12, -46, 12, 2);
      }
      break;
    case 'tower':
      graphics.fillPoints([{ x: -24, y: -42 }, { x: -12, y: -52 }, { x: 0, y: -42 }, { x: 12, y: -52 }, { x: 24, y: -42 }, { x: 20, y: 4 }, { x: -20, y: 4 }], true);
      graphics.strokePoints([{ x: -24, y: -42 }, { x: -12, y: -52 }, { x: 0, y: -42 }, { x: 12, y: -52 }, { x: 24, y: -42 }, { x: 20, y: 4 }, { x: -20, y: 4 }], true);
      break;
    case 'wing':
      graphics.fillEllipse(-15, -23, 30, 45);
      graphics.fillEllipse(15, -23, 30, 45);
      graphics.strokeEllipse(-15, -23, 30, 45);
      graphics.strokeEllipse(15, -23, 30, 45);
      break;
    case 'mushroom':
      graphics.fillEllipse(0, -34, 62, 36);
      graphics.fillRoundedRect(-13, -31, 26, 37, 8);
      graphics.strokeEllipse(0, -34, 62, 36);
      break;
    case 'boss':
      graphics.fillCircle(0, -21, 34);
      graphics.strokeCircle(0, -21, 34);
      graphics.fillTriangle(-29, -43, -12, -66, -5, -44);
      graphics.fillTriangle(29, -43, 12, -66, 5, -44);
      break;
    case 'blob':
      graphics.fillEllipse(0, -18, kind === 'monster' ? 52 : 58, kind === 'monster' ? 47 : 54);
      graphics.strokeEllipse(0, -18, kind === 'monster' ? 52 : 58, kind === 'monster' ? 47 : 54);
      break;
    case 'circle':
    default:
      graphics.fillCircle(0, -21, 28);
      graphics.strokeCircle(0, -21, 28);
      break;
  }
}

export class ActorView extends Phaser.GameObjects.Container {
  constructor(scene, model, assetSystem) {
    super(scene, model.x, model.y);
    this.model = model;
    this.assetSystem = assetSystem;
    this.asset = assetSystem.get(model.assetId);
    this.currentAction = '';
    this.currentDirection = 'S';
    this.lockedUntil = 0;
    this.selected = false;

    scene.add.existing(this);

    this.shadow = scene.add.ellipse(0, 3, Math.max(30, model.radius * 2.25), Math.max(11, model.radius * 0.82), 0x020708, 0.42);
    this.shadow.setStrokeStyle(1, 0xc8fff0, 0.12);
    this.add(this.shadow);

    if (assetSystem.isDirectionalReady(model.assetId)) {
      const texture = assetSystem.textureKey(model.assetId, 'idle');
      this.sprite = scene.add.sprite(0, 0, texture, 0);
      this.sprite.setOrigin(this.asset.anchor.x / this.asset.cell, this.asset.anchor.y / this.asset.cell);
      this.sprite.setScale(this.asset.displayScale ?? 1);
      this.add(this.sprite);
    } else if (assetSystem.isStaticReady(model.assetId)) {
      const texture = assetSystem.textureKey(model.assetId, 'static');
      this.staticSprite = scene.add.image(0, 0, texture);
      const width = this.asset.size?.[0] ?? this.staticSprite.width;
      const height = this.asset.size?.[1] ?? this.staticSprite.height;
      const anchor = this.asset.anchor ?? { x: width / 2, y: height };
      this.staticSprite.setOrigin(anchor.x / width, anchor.y / height);
      this.staticSprite.setScale(this.asset.displayScale ?? 1);
      this.add(this.staticSprite);
    } else {
      this.fallbackGraphics = scene.add.graphics();
      drawFallbackShape(this.fallbackGraphics, this.asset.fallback ?? {}, model.kind);
      this.add(this.fallbackGraphics);
      this.fallbackGlyph = scene.add.text(0, -21, this.asset.fallback?.glyph ?? '?', {
        fontFamily: 'ui-monospace, monospace',
        fontSize: model.kind === 'monster' && model.isBoss ? '25px' : '20px',
        color: '#f7ffe9',
        fontStyle: 'bold',
        stroke: '#10181b',
        strokeThickness: 3
      }).setOrigin(0.5);
      this.add(this.fallbackGlyph);
    }

    this.healthBar = scene.add.graphics();
    this.add(this.healthBar);

    this.selectionRing = scene.add.ellipse(0, 3, Math.max(44, model.radius * 2.8), Math.max(18, model.radius * 1.15));
    this.selectionRing.setStrokeStyle(2, 0xffdc75, 0.95);
    this.selectionRing.setVisible(false);
    this.addAt(this.selectionRing, 1);

    this.setSize(60, 68);
    this.setInteractive(new Phaser.Geom.Rectangle(-30, -58, 60, 68), Phaser.Geom.Rectangle.Contains);
    this.sync(true);
    this.play('idle', 'S', true);
  }

  play(action, direction = this.currentDirection, force = false) {
    if (!this.model.alive && action !== 'death') return;
    const now = this.scene.time.now;
    if (!force && now < this.lockedUntil && action !== 'hurt' && action !== 'death') return;

    this.currentDirection = direction ?? this.currentDirection;
    const directionalReady = this.assetSystem.isDirectionalReady(this.model.assetId);
    const resolvedAction = directionalReady
      ? (this.asset.actions?.[action] ? action : 'idle')
      : action;
    const actionDefinition = this.asset.actions?.[resolvedAction];
    const key = directionalReady
      ? this.assetSystem.animationKey(this.model.assetId, resolvedAction, this.currentDirection)
      : null;

    if (!force && this.currentAction === resolvedAction) {
      const isLoop = actionDefinition?.repeat === -1 || (!directionalReady && (resolvedAction === 'idle' || resolvedAction === 'walk'));
      const oneShotStillPlaying = Boolean(this.sprite?.anims.isPlaying && actionDefinition?.repeat === 0);
      if (isLoop || oneShotStillPlaying) return;
    }
    this.currentAction = resolvedAction;

    if (this.sprite && key && this.scene.anims.exists(key)) {
      this.sprite.play(key, true);
      if (actionDefinition?.repeat === 0) {
        this.lockedUntil = now + (actionDefinition.frames / actionDefinition.fps) * 1000;
      } else {
        this.lockedUntil = 0;
      }
      return;
    }

    const fallbackTarget = this.staticSprite ?? this.fallbackGraphics;
    if (fallbackTarget && (resolvedAction === 'attack' || resolvedAction === 'cast')) {
      this.scene.tweens.killTweensOf(fallbackTarget);
      fallbackTarget.setScale(this.asset.displayScale ?? 1);
      const baseScale = this.asset.displayScale ?? 1;
      this.scene.tweens.add({
        targets: fallbackTarget,
        scaleX: baseScale * 1.14,
        scaleY: baseScale * 0.9,
        yoyo: true,
        duration: 90
      });
      this.lockedUntil = now + 190;
    }
  }

  faceToward(target) {
    const dx = target.x - this.model.x;
    const dy = target.y - this.model.y;
    this.currentDirection = directionFromVector(dx, dy, this.currentDirection);
    return this.currentDirection;
  }

  flashDamage() {
    if (this.sprite) {
      this.sprite.setTint(0xffaaa4);
      this.scene.time.delayedCall(95, () => this.sprite?.clearTint());
    } else if (this.staticSprite) {
      this.staticSprite.setTint(0xffaaa4);
      this.scene.time.delayedCall(95, () => this.staticSprite?.clearTint());
    } else if (this.fallbackGraphics) {
      this.fallbackGraphics.setAlpha(0.4);
      this.scene.time.delayedCall(95, () => this.fallbackGraphics?.setAlpha(1));
    }
  }

  setSelected(selected) {
    this.selected = Boolean(selected);
    this.selectionRing.setVisible(this.selected);
  }

  sync(force = false) {
    this.setPosition(Math.round(this.model.x), Math.round(this.model.y));
    this.setDepth(Math.floor(this.model.y));
    this.shadow.setAlpha(this.model.alive ? 0.42 : 0.12);
    this.updateHealthBar(force);
  }

  updateHealthBar(force = false) {
    const ratio = Math.max(0, Math.min(1, this.model.hp / this.model.maxHp));
    if (!force && Math.abs((this.lastHealthRatio ?? -1) - ratio) < 0.002) return;
    this.lastHealthRatio = ratio;
    this.healthBar.clear();
    if (ratio >= 0.999 && this.model.kind === 'building') return;
    const width = Math.max(32, this.model.radius * 2.4);
    const y = this.model.kind === 'monster' && this.model.isBoss ? -70 : -61;
    this.healthBar.fillStyle(0x071013, 0.88);
    this.healthBar.fillRect(-width / 2 - 1, y - 1, width + 2, 7);
    this.healthBar.fillStyle(ratio > 0.55 ? 0x8bd47a : ratio > 0.25 ? 0xf0c267 : 0xf06f69, 1);
    this.healthBar.fillRect(-width / 2, y, width * ratio, 5);
  }

  playDeath(onComplete) {
    this.play('death', this.currentDirection, true);
    this.disableInteractive();
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y + 8,
      duration: 360,
      ease: 'Quad.easeIn',
      onComplete: () => {
        onComplete?.();
        this.destroy();
      }
    });
  }
}

function commonModel({ id, kind, faction, definition, position, cell = null }) {
  return {
    id,
    kind,
    faction,
    definitionId: definition.id,
    name: definition.name,
    assetId: definition.assetId,
    x: position.x,
    y: position.y,
    homeX: position.x,
    homeY: position.y,
    cell: cell ? { ...cell } : null,
    hp: definition.stats.hp,
    maxHp: definition.stats.hp,
    armor: definition.stats.armor ?? 0,
    attack: definition.stats.attack ?? 0,
    moveSpeed: definition.stats.moveSpeed ?? 0,
    attackRange: definition.stats.attackRange ?? 0,
    detectionRange: definition.stats.detectionRange ?? 0,
    attackInterval: definition.stats.attackInterval ?? 1,
    radius: definition.stats.radius ?? 14,
    aggroRange: definition.stats.aggroRange ?? 0,
    threat: definition.stats.threat ?? 0,
    attackStyle: definition.attackStyle ?? 'melee',
    skillId: definition.skillId ?? null,
    attackCooldown: 0,
    skillCooldown: 0,
    targetId: null,
    direction: 'S',
    moving: false,
    alive: true,
    status: { slowFactor: 1, slowRemaining: 0 },
    view: null
  };
}

export class ActorFactory {
  constructor(scene, registry, assetSystem) {
    this.scene = scene;
    this.registry = registry;
    this.assetSystem = assetSystem;
  }

  createJob(id, jobDefinition, cell, position) {
    const model = commonModel({ id, kind: 'job', faction: 'defender', definition: jobDefinition, position, cell });
    Object.assign(model, {
      cost: jobDefinition.cost,
      rank: jobDefinition.rank,
      leash: jobDefinition.stats.leash ?? 0,
      critChance: jobDefinition.stats.critChance ?? 0,
      critMultiplier: jobDefinition.stats.critMultiplier ?? 1.5,
      blocksPath: false
    });
    model.view = new ActorView(this.scene, model, this.assetSystem);
    return model;
  }

  createBuilding(id, buildingDefinition, cell, position) {
    const model = commonModel({ id, kind: 'building', faction: 'defender', definition: buildingDefinition, position, cell });
    Object.assign(model, {
      cost: buildingDefinition.cost,
      blocksPath: Boolean(buildingDefinition.blocksPath),
      moveSpeed: 0,
      leash: 0
    });
    model.view = new ActorView(this.scene, model, this.assetSystem);
    return model;
  }

  createMonster(id, monsterDefinition, position, path, waveNumber) {
    const scaled = scaleMonsterStats(monsterDefinition, waveNumber);
    const definition = {
      ...monsterDefinition,
      stats: {
        ...monsterDefinition.stats,
        hp: scaled.maxHp,
        attack: scaled.attack,
        armor: scaled.armor
      }
    };
    const model = commonModel({ id, kind: 'monster', faction: 'monster', definition, position });
    Object.assign(model, {
      path: path.map(cell => ({ ...cell })),
      pathIndex: path.length > 1 ? 1 : 0,
      flying: monsterDefinition.traits?.includes('flying') ?? false,
      siege: monsterDefinition.traits?.includes('siege') ?? false,
      isBoss: monsterDefinition.traits?.includes('boss') ?? false,
      crystalDamage: monsterDefinition.stats.crystalDamage,
      reward: monsterDefinition.stats.reward,
      blocksPath: false
    });
    model.view = new ActorView(this.scene, model, this.assetSystem);
    return model;
  }
}
