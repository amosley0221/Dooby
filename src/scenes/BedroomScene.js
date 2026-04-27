import Phaser from 'phaser';
import { Robey } from '../entities/Robey.js';
import { setTouchControls } from '../main.js';

// Page 1 of the book — Robey in his bedroom, declares the adventure,
// the walls melt away, scene transitions to the jungle.
export class BedroomScene extends Phaser.Scene {
  constructor() { super('BedroomScene'); }
  create() {
    setTouchControls(false);
    const { width, height } = this.scale;
    const cx = width / 2;
    const groundY = height - 80;

    this.bg = this.add.image(cx, height / 2, 'bg-bedroom').setDisplaySize(width, height);

    // Floor as a static body (invisible rectangle with a static body attached)
    const floorRect = this.add.rectangle(cx, groundY + 40, width * 2, 80, 0, 0);
    this.physics.add.existing(floorRect, true);
    this.floor = floorRect;

    this.robey = new Robey(this, cx - 80, groundY);
    this.physics.add.collider(this.robey, this.floor);

    // Speech bubble
    const bubble = this.add.graphics().setDepth(20);
    bubble.fillStyle(0xfff7d6, 0.95);
    bubble.fillRoundedRect(cx - 220, height * 0.18, 440, 90, 12);
    bubble.lineStyle(3, 0x3a2010, 1);
    bubble.strokeRoundedRect(cx - 220, height * 0.18, 440, 90, 12);
    const speech = this.add.text(cx, height * 0.18 + 45,
      "Today I'm exploring the deepest\njungle in the world!", {
        fontFamily: 'Bookman Old Style, Georgia, serif',
        fontSize: '20px', color: '#3a2010', align: 'center',
      }).setOrigin(0.5).setDepth(21);

    // Countdown after a beat
    this.time.delayedCall(2200, () => {
      bubble.destroy(); speech.destroy();
      this.startCountdown();
    });
  }

  startCountdown() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const counts = ['3...', '2...', '1...', 'JUNGLE EXPEDITION GO!'];
    let i = 0;
    const showNext = () => {
      if (i >= counts.length) return this.transitionToJungle();
      const txt = this.add.text(cx, height * 0.4, counts[i], {
        fontFamily: 'Bookman Old Style, Georgia, serif',
        fontSize: i === 3 ? '48px' : '80px',
        fontStyle: 'bold',
        color: '#ffd54f', stroke: '#3a2010', strokeThickness: 8,
      }).setOrigin(0.5).setDepth(30);
      this.tweens.add({
        targets: txt, scale: { from: 0.4, to: 1.2 }, alpha: { from: 1, to: 0 },
        duration: 800, ease: 'Cubic.out',
        onComplete: () => { txt.destroy(); i++; showNext(); },
      });
    };
    showNext();
  }

  transitionToJungle() {
    const { width, height } = this.scale;
    // Walls melt away - flash and fade to jungle scene
    const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff)
      .setAlpha(0).setDepth(50);
    this.tweens.add({
      targets: flash, alpha: 1, duration: 500,
      onComplete: () => this.scene.start('JungleScene'),
    });
  }

  update() {
    if (this.robey?.body) this.robey.updateAnim(0, this.robey.body.blocked.down || this.robey.body.touching.down);
  }
}
