import Phaser from 'phaser';
import { startAudio, setMoodAudio } from '../audio.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    // Parallax title background
    const far = this.add.image(cx, height / 2, 'bg-jungle-far')
      .setDisplaySize(width, height);
    const mid = this.add.image(cx, height / 2, 'bg-jungle-mid')
      .setDisplaySize(width, height).setAlpha(0.85);
    const near = this.add.image(cx, height / 2, 'bg-jungle-near')
      .setDisplaySize(width, height).setAlpha(0.9);

    // Floating fireflies
    for (let i = 0; i < 14; i++) {
      const f = this.add.image(Phaser.Math.Between(40, width - 40),
        Phaser.Math.Between(80, height - 200), 'firefly');
      this.tweens.add({
        targets: f,
        x: f.x + Phaser.Math.Between(-60, 60),
        y: f.y + Phaser.Math.Between(-60, 60),
        alpha: { from: 0.4, to: 1 },
        duration: Phaser.Math.Between(1400, 2800),
        yoyo: true, repeat: -1,
      });
    }

    // Title text — bouncy yellow with brown outline (Cuphead-ish)
    const title = this.add.text(cx, height * 0.28, "ROBEY'S\nWILD ADVENTURES", {
      fontFamily: 'Bookman Old Style, Georgia, serif',
      fontSize: Math.min(64, width / 14) + 'px',
      fontStyle: 'bold',
      color: '#ffd54f',
      stroke: '#3a2010',
      strokeThickness: 8,
      align: 'center',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: title, y: title.y - 6, duration: 1400, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const subtitle = this.add.text(cx, height * 0.46, 'The Lost Jungle Temple', {
      fontFamily: 'Bookman Old Style, Georgia, serif',
      fontSize: Math.min(32, width / 26) + 'px',
      fontStyle: 'italic',
      color: '#fff7d6',
      stroke: '#3a2010',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Begin button
    const btn = this.add.rectangle(cx, height * 0.66, 240, 70, 0xff7a3a)
      .setStrokeStyle(4, 0x3a2010);
    const btnText = this.add.text(cx, height * 0.66, 'BEGIN', {
      fontFamily: 'Bookman Old Style, Georgia, serif',
      fontSize: '32px', fontStyle: 'bold',
      color: '#3a2010',
    }).setOrigin(0.5);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setScale(1.04));
    btn.on('pointerout', () => btn.setScale(1));

    this.add.text(cx, height - 40, 'Tap or click anywhere to begin', {
      fontFamily: 'Bookman Old Style, Georgia, serif',
      fontSize: '16px', color: '#fff7d6',
    }).setOrigin(0.5).setAlpha(0.7);

    // One click handler at the scene level handles both the button and
    // anywhere-else taps. Scene transition is independent of audio start
    // so a stalled AudioContext can never block the game.
    let started = false;
    const begin = () => {
      if (started) return;
      started = true;
      btn.disableInteractive();
      // Fire-and-forget — audio is best-effort, never blocks the scene.
      Promise.resolve()
        .then(() => startAudio())
        .then(() => setMoodAudio('bright'))
        .catch((err) => console.warn('audio start failed', err));
      this.scene.start('BedroomScene');
    };
    this.input.on('pointerdown', begin);
  }
}
