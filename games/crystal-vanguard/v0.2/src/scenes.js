import { GAME_CONFIG, PHASE, SPAWN_CELLS, SPAWN_LABELS } from './config.js';
import { GameDirector } from './director.js';
import { HudController } from './ui.js';

export class BootScene extends Phaser.Scene {
  constructor(registry, assetSystem) {
    super('boot');
    this.contentRegistry = registry;
    this.assetSystem = assetSystem;
  }

  preload() {
    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;
    this.add.text(centerX, centerY - 46, 'CRYSTAL VANGUARD v0.2', {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '22px',
      color: '#fff2bd',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(centerX, centerY - 12, '載入職業動作與 runtime fallback…', {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '12px',
      color: '#a8beb4'
    }).setOrigin(0.5);

    const frame = this.add.rectangle(centerX, centerY + 24, 328, 18, 0x071013, 1).setStrokeStyle(2, 0x586d69, 1);
    const bar = this.add.rectangle(centerX - 158, centerY + 24, 0, 10, 0x72ddc9, 1).setOrigin(0, 0.5);
    this.load.on('progress', progress => bar.setSize(316 * progress, 10));
    this.load.once('complete', () => frame.setStrokeStyle(2, 0xa9e8d8, 1));

    this.assetSystem.preload(this);
  }

  create() {
    const assetReport = this.assetSystem.finalize(this);
    this.scene.start('battle', { assetReport });
  }
}

export class BattleScene extends Phaser.Scene {
  constructor(registry, assetSystem) {
    super('battle');
    this.contentRegistry = registry;
    this.assetSystem = assetSystem;
    this.hoverCell = null;
    this.effectUnsubscribers = [];
  }

  create(data) {
    this.cameras.main.setBackgroundColor(GAME_CONFIG.backgroundColor);
    this.cameras.main.roundPixels = true;
    this.createBoard();

    this.hoverGraphics = this.add.graphics().setDepth(100000);
    this.debugGraphics = this.add.graphics().setDepth(99990);

    this.director = new GameDirector(this, this.contentRegistry, this.assetSystem);
    this.hud = new HudController(this.director);
    this.bindDirectorEffects();
    this.configureInput();
    this.director.initialize(data.assetReport ?? []);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdown());
  }

  createBoard() {
    const board = GAME_CONFIG.board;
    const boardWidth = board.cols * board.cell;
    const boardHeight = board.rows * board.cell;

    this.add.rectangle(GAME_CONFIG.width / 2, GAME_CONFIG.height / 2, GAME_CONFIG.width, GAME_CONFIG.height, 0x0c1719)
      .setDepth(-3000);
    this.add.rectangle(
      board.originX + boardWidth / 2,
      board.originY + boardHeight / 2,
      boardWidth + 18,
      boardHeight + 18,
      0x0a1013,
      1
    ).setStrokeStyle(3, 0x71837b, 0.7).setDepth(-2500);

    const graphics = this.add.graphics().setDepth(-2400);
    for (let y = 0; y < board.rows; y += 1) {
      for (let x = 0; x < board.cols; x += 1) {
        const worldX = board.originX + x * board.cell;
        const worldY = board.originY + y * board.cell;
        const isCrystal = x === board.crystal.x && y === board.crystal.y;
        const spawnId = Object.entries(SPAWN_CELLS).find(([, cell]) => cell.x === x && cell.y === y)?.[0];
        const noise = (x * 17 + y * 31) % 6;
        const baseColor = noise < 2 ? 0x19332f : noise < 4 ? 0x1d3833 : 0x213d36;
        const color = isCrystal ? 0x284c4c : spawnId ? 0x3b2f2b : baseColor;
        graphics.fillStyle(color, 1);
        graphics.fillRect(worldX, worldY, board.cell, board.cell);
        graphics.lineStyle(1, isCrystal ? 0x88ded1 : spawnId ? 0xbd7962 : 0x668077, isCrystal || spawnId ? 0.66 : 0.22);
        graphics.strokeRect(worldX + 0.5, worldY + 0.5, board.cell - 1, board.cell - 1);

        if (!isCrystal && !spawnId && noise === 0) {
          graphics.fillStyle(0x92ad7d, 0.16);
          graphics.fillRect(worldX + 9, worldY + 13, 3, 8);
          graphics.fillRect(worldX + 12, worldY + 11, 3, 10);
        }
      }
    }

    for (const [direction, cell] of Object.entries(SPAWN_CELLS)) {
      const x = board.originX + cell.x * board.cell + board.cell / 2;
      const y = board.originY + cell.y * board.cell + board.cell / 2;
      this.add.text(x, y, direction, {
        fontFamily: 'ui-monospace, monospace',
        fontSize: '12px',
        color: '#ffd0b0',
        fontStyle: 'bold',
        stroke: '#1a1515',
        strokeThickness: 3
      }).setOrigin(0.5).setAlpha(0.82).setDepth(-2000);
    }
  }

  configureInput() {
    this.input.mouse?.disableContextMenu();
    this.input.on('pointermove', pointer => {
      this.hoverCell = this.director.grid.worldToCell(pointer.worldX, pointer.worldY);
    });
    this.input.on('gameout', () => {
      this.hoverCell = null;
      this.hoverGraphics.clear();
    });
    this.input.on('pointerdown', pointer => {
      const cell = this.director.grid.worldToCell(pointer.worldX, pointer.worldY);
      if (!cell) return;
      if (pointer.rightButtonDown()) this.director.removeAt(cell);
      else this.director.handlePrimaryCell(cell);
    });

    const keyboard = this.input.keyboard;
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on('down', (_key, event) => {
      event?.preventDefault?.();
      this.director.startWave();
    });
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => this.director.clearSelection());
    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D).on('down', () => this.director.toggleDebug());

    const jobs = this.contentRegistry.list('jobs');
    const numberKeyCodes = [
      Phaser.Input.Keyboard.KeyCodes.ONE,
      Phaser.Input.Keyboard.KeyCodes.TWO,
      Phaser.Input.Keyboard.KeyCodes.THREE,
      Phaser.Input.Keyboard.KeyCodes.FOUR,
      Phaser.Input.Keyboard.KeyCodes.FIVE,
      Phaser.Input.Keyboard.KeyCodes.SIX
    ];
    jobs.slice(0, 6).forEach((job, index) => {
      this.input.keyboard.addKey(numberKeyCodes[index]).on('down', () => this.director.selectCatalog('job', job.id));
    });
  }

  bindDirectorEffects() {
    this.effectUnsubscribers.push(
      this.director.events.on('combat:attack', payload => this.playAttackEffect(payload)),
      this.director.events.on('combat:skill', payload => this.playSkillEffect(payload)),
      this.director.events.on('combat:damage', payload => this.playFloatingText(payload.target, `-${payload.amount}`, '#ff9a8f')),
      this.director.events.on('combat:heal', payload => this.playFloatingText(payload.target, `+${payload.amount}`, '#9dffb2')),
      this.director.events.on('crystal:damaged', payload => {
        const position = this.director.grid.cellToWorld(GAME_CONFIG.board.crystal);
        this.playFloatingText(position, `水晶 -${payload.amount}`, '#ff817a', 18);
      })
    );
  }

  playAttackEffect({ attacker, target, ranged, critical }) {
    if (!attacker || !target) return;
    if (ranged) {
      const projectile = this.add.circle(attacker.x, attacker.y - 25, critical ? 6 : 4, critical ? 0xffe278 : 0xc8f5da, 1)
        .setDepth(100010);
      this.tweens.add({
        targets: projectile,
        x: target.x,
        y: target.y - 20,
        duration: Math.max(90, Math.min(280, Phaser.Math.Distance.Between(attacker.x, attacker.y, target.x, target.y) * 0.8)),
        ease: 'Linear',
        onComplete: () => projectile.destroy()
      });
      return;
    }

    const slash = this.add.graphics().setDepth(100010);
    slash.lineStyle(critical ? 5 : 3, critical ? 0xffdf69 : 0xe9fff4, 0.92);
    slash.lineBetween(target.x - 20, target.y - 35, target.x + 18, target.y - 6);
    this.tweens.add({
      targets: slash,
      alpha: 0,
      duration: 150,
      onComplete: () => slash.destroy()
    });
  }

  playSkillEffect({ actor, target, skill }) {
    const center = target ?? actor;
    const radius = skill.effect.radius ?? 48;
    const ring = this.add.circle(center.x, center.y - 4, Math.min(radius, 120), 0x8eead8, 0.08)
      .setStrokeStyle(3, 0xcaffef, 0.85)
      .setScale(0.35)
      .setDepth(100005);
    this.tweens.add({
      targets: ring,
      scale: 1,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  playFloatingText(target, text, color, fontSize = 13) {
    if (!target) return;
    const label = this.add.text(target.x, target.y - 58, text, {
      fontFamily: 'ui-monospace, monospace',
      fontSize: `${fontSize}px`,
      color,
      fontStyle: 'bold',
      stroke: '#081013',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(100020);
    this.tweens.add({
      targets: label,
      y: label.y - 26,
      alpha: 0,
      duration: 620,
      ease: 'Quad.easeOut',
      onComplete: () => label.destroy()
    });
  }

  update(time, delta) {
    this.director?.update(time, delta);
    this.drawHover();
    this.drawDebug();
  }

  drawHover() {
    this.hoverGraphics.clear();
    if (!this.hoverCell) return;
    const board = GAME_CONFIG.board;
    const x = board.originX + this.hoverCell.x * board.cell;
    const y = board.originY + this.hoverCell.y * board.cell;
    const existing = this.director.grid.getAt(this.hoverCell);
    const validation = this.director.previewPlacement(this.hoverCell);
    const color = existing ? 0xffdd7c : validation.ok ? 0x8df0c3 : 0xf07a72;
    const alpha = existing || this.director.state.selection ? 0.92 : 0.42;
    this.hoverGraphics.lineStyle(3, color, alpha);
    this.hoverGraphics.strokeRect(x + 3, y + 3, board.cell - 6, board.cell - 6);
  }

  drawDebug() {
    this.debugGraphics.clear();
    if (!this.director?.state.debug) return;

    for (const entity of this.director.state.entities.values()) {
      const color = entity.faction === 'monster' ? 0xff847b : entity.kind === 'building' ? 0x8ac7ff : 0x8ff0bf;
      if (entity.attackRange > 0) {
        this.debugGraphics.lineStyle(1, color, 0.25);
        this.debugGraphics.strokeCircle(entity.x, entity.y, entity.attackRange);
      }
      this.debugGraphics.fillStyle(color, 0.75);
      this.debugGraphics.fillCircle(entity.x, entity.y, 2);

      if (entity.kind === 'monster' && !entity.flying && entity.path?.length > 1) {
        this.debugGraphics.lineStyle(1, 0xffd089, 0.28);
        const points = entity.path.slice(entity.pathIndex).map(cell => this.director.grid.cellToWorld(cell));
        if (points.length) {
          this.debugGraphics.beginPath();
          this.debugGraphics.moveTo(entity.x, entity.y);
          for (const point of points) this.debugGraphics.lineTo(point.x, point.y);
          this.debugGraphics.strokePath();
        }
      }
    }
  }

  shutdown() {
    for (const unsubscribe of this.effectUnsubscribers) unsubscribe();
    this.effectUnsubscribers = [];
    this.hud?.destroy();
    this.director?.destroy();
  }
}
