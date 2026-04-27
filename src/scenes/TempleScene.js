import Phaser from 'phaser';
import { Robey } from '../entities/Robey.js';
import { ShadowVine } from '../entities/ShadowVine.js';
import { setMoodAudio, playSting } from '../audio.js';

// Pages 8-15: inside the temple. Doors slam shut, vines come alive,
// Robey must slash through them to reveal the escape path. Once enough
// vines are dispelled, a sunbeam breaks through and Robey escapes.
export class TempleScene extends Phaser.Scene {
  constructor() { super('TempleScene'); }
  create() {
    const { width, height } = this.scale;
    const worldWidth = 4200;
    const groundY = height - 90;

    this.cameras.main.fadeIn(700, 0, 0, 0);
    this.cameras.main.setBackgroundColor('#0a0a14');
    this.physics.world.setBounds(0, 0, worldWidth, height);
    this.cameras.main.setBounds(0, 0, worldWidth, height);
    setMoodAudio('dark');

    this.bgFar = this.add.tileSprite(0, 0, width, height, 'bg-temple-far')
      .setOrigin(0).setScrollFactor(0);
    this.bgMid = this.add.tileSprite(0, 0, width, height, 'bg-temple-mid')
      .setOrigin(0).setScrollFactor(0).setAlpha(0.85);
    this.bgNear = this.add.tileSprite(0, 0, width, height, 'bg-temple-near')
      .setOrigin(0).setScrollFactor(0);

    // Ground
    this.ground = this.physics.add.staticGroup();
    for (let x = 0; x < worldWidth; x += 80) {
      this.ground.create(x + 40, groundY + 30, 'ground-temple').refreshBody();
    }

    // Some ledges
    this.platforms = this.physics.add.staticGroup();
    const platSpots = [
      [500, groundY - 130], [800, groundY - 200], [1200, groundY - 150],
      [1700, groundY - 180], [2200, groundY - 130], [2700, groundY - 200],
      [3200, groundY - 160], [3700, groundY - 130],
    ];
    for (const [x, y] of platSpots) {
      this.platforms.create(x, y, 'platform-temple').refreshBody();
    }

    // Door slams shut behind Robey
    this.backDoor = this.add.image(80, groundY, 'temple-door').setOrigin(0.5, 1).setDepth(5);
    this.backDoor.setY(groundY - 200);
    this.tweens.add({
      targets: this.backDoor, y: groundY, duration: 600, delay: 800,
      ease: 'Cubic.in',
      onComplete: () => {
        playSting('realize');
        this.cameras.main.shake(300, 0.012);
        this.showSubtitle('The temple doors slam shut. Vines come alive...', 4000);
      },
    });

    // Robey
    this.robey = new Robey(this, 220, groundY - 60);
    this.physics.add.collider(this.robey, this.ground);
    this.physics.add.collider(this.robey, this.platforms);

    // Shadow vines as enemies
    this.vines = this.physics.add.staticGroup();
    const vineSpots = [600, 1000, 1400, 1900, 2400, 2900, 3300, 3800];
    for (const x of vineSpots) {
      const v = new ShadowVine(this, x, groundY);
      this.vines.add(v);
    }
    this.vinesRemaining = vineSpots.length;

    // Damage on contact with vines
    this.physics.add.overlap(this.robey, this.vines, (_r, v) => {
      if (v.dead) return;
      this.takeDamage();
    }, null, this);

    // Slash hitbox
    this.slashHit = this.add.rectangle(0, 0, 110, 80, 0xffffff, 0).setOrigin(0.5);
    this.physics.add.existing(this.slashHit);
    this.slashHit.body.setAllowGravity(false);
    this.slashHit.body.enable = false;
    this.physics.add.overlap(this.slashHit, this.vines, (_s, v) => {
      if (v.dead) return;
      const killed = v.hit();
      if (killed) {
        this.vinesRemaining -= 1;
        const orb = this.add.image(v.x, v.y - 40, 'glow-orb');
        this.tweens.add({ targets: orb, alpha: 0, scale: 2.4, duration: 600, onComplete: () => orb.destroy() });
        if (this.vinesRemaining <= 0) this.triggerEscape();
      }
    }, null, this);

    // HP
    this.hp = 3;
    this.hpText = this.add.text(20, 20, this.hpString(), {
      fontFamily: 'Bookman Old Style, Georgia, serif', fontSize: '22px',
      color: '#ffd54f', stroke: '#3a2010', strokeThickness: 4,
    }).setScrollFactor(0).setDepth(100);
    this.hud = this.add.text(20, 50, '', {
      fontFamily: 'Bookman Old Style, Georgia, serif', fontSize: '18px',
      color: '#fff7d6', stroke: '#3a2010', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(100);
    this.updateHud();

    this.subtitle = this.add.text(width / 2, height - 100, '', {
      fontFamily: 'Bookman Old Style, Georgia, serif', fontSize: '20px',
      fontStyle: 'italic',
      color: '#fff7d6', stroke: '#1a0e08', strokeThickness: 4,
      backgroundColor: 'rgba(0,0,0,0.55)', padding: { x: 14, y: 8 },
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0);

    this.cameras.main.startFollow(this.robey, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(140, 80);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,X,K,J');
    this.bindTouch();

    this.escapeTriggered = false;
    this.exitTriggered = false;
    this.invuln = 0;
  }

  hpString() {
    return 'Heart: ' + '♥'.repeat(this.hp) + '♡'.repeat(Math.max(0, 3 - this.hp));
  }

  updateHud() {
    this.hpText.setText(this.hpString());
    this.hud.setText(`Vines remaining: ${this.vinesRemaining}`);
  }

  showSubtitle(text, ms = 3000) {
    this.subtitle.setText(text);
    this.tweens.add({ targets: this.subtitle, alpha: 1, duration: 300 });
    this.time.delayedCall(ms, () => {
      this.tweens.add({ targets: this.subtitle, alpha: 0, duration: 400 });
    });
  }

  takeDamage() {
    if (this.invuln > 0) return;
    this.hp -= 1;
    this.invuln = 1.0;
    this.cameras.main.shake(180, 0.01);
    this.tweens.add({ targets: this.robey, alpha: { from: 0.3, to: 1 }, duration: 100, repeat: 4 });
    this.updateHud();
    if (this.hp <= 0) this.gameOver();
  }

  gameOver() {
    this.showSubtitle('Caught by the shadows. Try again...', 3000);
    this.time.delayedCall(2500, () => {
      this.cameras.main.fadeOut(700, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
    });
  }

  triggerEscape() {
    if (this.escapeTriggered) return;
    this.escapeTriggered = true;
    setMoodAudio('escape');
    this.showSubtitle('Open the way home!', 3500);
    // Sunbeam breaks through
    const beamX = Math.min(4000, this.robey.x + 700);
    const beam = this.add.rectangle(beamX, 0, 220, this.scale.height, 0xfff088, 0)
      .setOrigin(0.5, 0).setDepth(50);
    this.tweens.add({ targets: beam, alpha: 0.9, duration: 1200 });
    // Exit zone
    this.exitZone = this.add.zone(beamX, this.scale.height - 200, 200, 400).setOrigin(0.5);
    this.physics.add.existing(this.exitZone, true);
    this.physics.add.overlap(this.robey, this.exitZone, () => {
      if (this.exitTriggered) return;
      this.exitTriggered = true;
      playSting('escape');
      this.cameras.main.fadeOut(900, 255, 247, 214);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('EndingScene'));
    });
  }

  bindTouch() {
    const press = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); onDown(); });
      el.addEventListener('pointerup', (e) => { e.preventDefault(); onUp?.(); });
      el.addEventListener('pointercancel', () => onUp?.());
    };
    this.touch = { left: false, right: false };
    press('btn-left', () => this.touch.left = true, () => this.touch.left = false);
    press('btn-right', () => this.touch.right = true, () => this.touch.right = false);
    press('btn-jump', () => this.touch.jumpQueued = true);
    press('btn-slash', () => this.touch.slashQueued = true);
  }

  update(_t, dt) {
    if (!this.robey) return;
    if (this.invuln > 0) this.invuln = Math.max(0, this.invuln - dt / 1000);
    const r = this.robey;
    const onGround = r.body.blocked.down || r.body.touching.down;

    let mx = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown || this.touch?.left) mx -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown || this.touch?.right) mx += 1;
    r.body.setVelocityX(mx * 240);
    if (mx !== 0) r.setFacing(mx);

    const jumpDown = this.cursors.up.isDown || this.cursors.space.isDown ||
      this.keys.W.isDown || this.keys.SPACE.isDown || this.touch?.jumpQueued;
    if (jumpDown && onGround) r.body.setVelocityY(-620);
    if (this.touch) this.touch.jumpQueued = false;

    if ((this.keys.X.isDown || this.keys.K.isDown || this.keys.J.isDown || this.touch?.slashQueued) && r.canSlash) {
      if (r.slash()) {
        this.slashHit.setPosition(r.x + r.facing * 60, r.y - 40);
        this.slashHit.body.enable = true;
        const flash = this.add.image(r.x + r.facing * 50, r.y - 40, 'slash')
          .setScale(r.facing, 1).setAlpha(0.9).setDepth(20);
        this.tweens.add({ targets: flash, alpha: 0, duration: 180, onComplete: () => flash.destroy() });
        this.time.delayedCall(140, () => { this.slashHit.body.enable = false; });
      }
    }
    if (this.touch) this.touch.slashQueued = false;

    r.updateAnim(r.body.velocity.x, onGround);

    const cam = this.cameras.main;
    this.bgFar.tilePositionX = cam.scrollX * 0.15;
    this.bgMid.tilePositionX = cam.scrollX * 0.4;
    this.bgNear.tilePositionX = cam.scrollX * 0.7;
  }
}
