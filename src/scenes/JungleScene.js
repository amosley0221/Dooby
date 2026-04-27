import Phaser from 'phaser';
import { Robey } from '../entities/Robey.js';
import { setMoodAudio } from '../audio.js';
import { setTouchControls } from '../main.js';

// Pages 2-7 condensed: vibrant jungle expedition that gradually grows
// taller and dimmer as Robey approaches the temple. Side-scrolling.
export class JungleScene extends Phaser.Scene {
  constructor() { super('JungleScene'); }
  create() {
    setTouchControls(true);
    const { width, height } = this.scale;
    const worldWidth = 5400;
    const groundY = height - 90;

    this.cameras.main.setBackgroundColor('#ffe9a8');
    this.physics.world.setBounds(0, 0, worldWidth, height);
    this.cameras.main.setBounds(0, 0, worldWidth, height);

    // Parallax layers (TileSprites scroll with the camera)
    this.bgFar = this.add.tileSprite(0, 0, width, height, 'bg-jungle-far')
      .setOrigin(0).setScrollFactor(0);
    this.bgMid = this.add.tileSprite(0, 0, width, height, 'bg-jungle-mid')
      .setOrigin(0).setScrollFactor(0);
    this.bgNear = this.add.tileSprite(0, 0, width, height, 'bg-jungle-near')
      .setOrigin(0).setScrollFactor(0).setAlpha(0.85);

    // Mood overlay (gets darker toward the end of the level)
    this.mood = this.add.rectangle(0, 0, worldWidth, height, 0x0a0a14, 0)
      .setOrigin(0).setScrollFactor(0).setDepth(40);

    // Build ground
    this.ground = this.physics.add.staticGroup();
    for (let x = 0; x < worldWidth; x += 80) {
      const tile = this.ground.create(x + 40, groundY + 30, 'ground-jungle');
      tile.refreshBody();
    }

    // Floating platforms scattered along the path
    this.platforms = this.physics.add.staticGroup();
    const platSpots = [
      [600, groundY - 110], [820, groundY - 180], [1100, groundY - 130],
      [1500, groundY - 160], [1780, groundY - 220], [2100, groundY - 140],
      [2700, groundY - 180], [3200, groundY - 130], [3700, groundY - 200],
    ];
    for (const [x, y] of platSpots) {
      const p = this.platforms.create(x, y, 'platform-jungle');
      p.refreshBody();
    }

    // Sparkling stream (decorative, no collision)
    for (let x = 1350; x < 1650; x += 200) {
      this.add.image(x, groundY + 8, 'stream').setOrigin(0, 0.5).setDepth(5);
    }

    // Vines hanging from above (decorative)
    for (let i = 0; i < 18; i++) {
      const v = this.add.image(200 + i * 280, 0, 'vine').setOrigin(0.5, 0).setDepth(3);
      this.tweens.add({
        targets: v, rotation: { from: -0.06, to: 0.06 },
        duration: 1800 + i * 60, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    // Fireflies (collectibles)
    this.fireflies = this.physics.add.group();
    this.fireflyTotal = 12;
    const fireflyXs = [];
    for (let i = 0; i < this.fireflyTotal; i++) {
      const x = 400 + i * 380 + Phaser.Math.Between(-40, 40);
      fireflyXs.push(x);
      const y = groundY - Phaser.Math.Between(60, 220);
      const f = this.fireflies.create(x, y, 'firefly').setScale(2);
      f.body.setAllowGravity(false);
      this.tweens.add({
        targets: f, y: y - 20, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      this.tweens.add({
        targets: f, alpha: { from: 0.5, to: 1 }, duration: 700, yoyo: true, repeat: -1,
      });
    }

    // Waterfall pillar mid-level (page 4-5)
    const waterfallX = 2400;
    this.add.rectangle(waterfallX, groundY - 220, 120, 440, 0x6ad0f0, 0.6)
      .setOrigin(0.5, 0).setDepth(2);
    for (let i = 0; i < 14; i++) {
      const drop = this.add.image(waterfallX + Phaser.Math.Between(-50, 50),
        groundY - 200 + Phaser.Math.Between(0, 220), 'firefly').setTint(0xa9d8ff).setScale(1.4).setDepth(3);
      this.tweens.add({
        targets: drop, y: drop.y + 200, duration: 1000, repeat: -1,
      });
    }

    // Stone steps near the end (page 5)
    for (let i = 0; i < 8; i++) {
      this.add.image(3800 + i * 110, groundY - i * 30 - 20, 'stone-slab')
        .setOrigin(0.5, 1).setDepth(1);
      const step = this.platforms.create(3800 + i * 110, groundY - i * 30, 'stone-slab');
      step.setVisible(false).refreshBody();
    }

    // Temple gate at the end (transitions to TempleScene)
    const gateX = 5100;
    this.gate = this.add.image(gateX, groundY, 'temple-door').setOrigin(0.5, 1).setDepth(4);
    this.add.rectangle(gateX, groundY - 200, 200, 30, 0x4a3a44).setStrokeStyle(2, 0x1a0e08);

    // Robey
    this.robey = new Robey(this, 100, groundY - 60);
    this.physics.add.collider(this.robey, this.ground);
    this.physics.add.collider(this.robey, this.platforms);
    this.physics.add.overlap(this.robey, this.fireflies, this.collectFirefly, null, this);

    // Camera follow
    this.cameras.main.startFollow(this.robey, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(140, 80);

    // HUD
    this.collected = 0;
    this.hud = this.add.text(20, 20, this.hudText(), {
      fontFamily: 'Bookman Old Style, Georgia, serif', fontSize: '20px',
      color: '#fff7d6', stroke: '#3a2010', strokeThickness: 4,
    }).setScrollFactor(0).setDepth(100);

    this.subtitle = this.add.text(width / 2, height - 100, '', {
      fontFamily: 'Bookman Old Style, Georgia, serif', fontSize: '20px',
      fontStyle: 'italic',
      color: '#fff7d6', stroke: '#1a0e08', strokeThickness: 4,
      backgroundColor: 'rgba(0,0,0,0.45)', padding: { x: 14, y: 8 },
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);

    this.showSubtitle('This is the best adventure ever!', 3500);
    this.time.delayedCall(7000, () => this.showSubtitle('Follow the map deeper into the jungle...', 4000));

    // Inputs
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,X,K,J');
    this.bindTouch();

    this.moodTarget = 0;
    this.transitionStarted = false;
  }

  hudText() {
    return `Fireflies: ${this.collected ?? 0} / ${this.fireflyTotal}`;
  }

  showSubtitle(text, ms = 3000) {
    this.subtitle.setText(text);
    this.tweens.add({ targets: this.subtitle, alpha: 1, duration: 300 });
    this.time.delayedCall(ms, () => {
      this.tweens.add({ targets: this.subtitle, alpha: 0, duration: 400 });
    });
  }

  collectFirefly(_robey, firefly) {
    firefly.disableBody(true, true);
    this.collected += 1;
    this.hud.setText(this.hudText());
  }

  bindTouch() {
    const press = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); onDown(); });
      el.addEventListener('pointerup', (e) => { e.preventDefault(); onUp?.(); });
      el.addEventListener('pointercancel', () => onUp?.());
    };
    this.touch = { left: false, right: false, jump: false, slash: false };
    press('btn-left', () => this.touch.left = true, () => this.touch.left = false);
    press('btn-right', () => this.touch.right = true, () => this.touch.right = false);
    press('btn-jump', () => this.touch.jumpQueued = true);
    press('btn-slash', () => this.touch.slashQueued = true);
  }

  update() {
    if (!this.robey) return;
    const r = this.robey;
    const onGround = r.body.blocked.down || r.body.touching.down;

    // Movement
    let mx = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown || this.touch?.left) mx -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown || this.touch?.right) mx += 1;
    const speed = 260;
    r.body.setVelocityX(mx * speed);
    if (mx !== 0) r.setFacing(mx);

    // Jump
    const jumpDown = this.cursors.up.isDown || this.cursors.space.isDown ||
      this.keys.W.isDown || this.keys.SPACE.isDown || this.touch?.jumpQueued;
    if (jumpDown && onGround) {
      r.body.setVelocityY(-620);
    }
    if (this.touch) this.touch.jumpQueued = false;

    // Slash
    if ((this.keys.X.isDown || this.keys.K.isDown || this.keys.J.isDown || this.touch?.slashQueued) && r.canSlash) {
      r.slash();
    }
    if (this.touch) this.touch.slashQueued = false;

    r.updateAnim(r.body.velocity.x, onGround);

    // Parallax scroll
    const cam = this.cameras.main;
    this.bgFar.tilePositionX = cam.scrollX * 0.15;
    this.bgMid.tilePositionX = cam.scrollX * 0.4;
    this.bgNear.tilePositionX = cam.scrollX * 0.7;

    // Mood blend - starts dimming after waterfall
    const t = Phaser.Math.Clamp((cam.scrollX - 2800) / 2000, 0, 0.55);
    this.mood.fillAlpha = t;

    // Trigger temple transition
    if (!this.transitionStarted && r.x > 5050) {
      this.transitionStarted = true;
      setMoodAudio('uneasy');
      this.showSubtitle('A real lost temple! ...the jungle has gone quiet.', 3500);
      this.time.delayedCall(2400, () => {
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('TempleScene');
        });
      });
    }
  }
}
