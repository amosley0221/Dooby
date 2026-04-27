import Phaser from 'phaser';
import { startAudio, setMoodAudio } from '../audio.js';
import { setTouchControls } from '../main.js';
import { Robey } from '../entities/Robey.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    setTouchControls(false);
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

    const subtitle = this.add.text(cx, height * 0.4, 'The Lost Jungle Temple', {
      fontFamily: 'Bookman Old Style, Georgia, serif',
      fontSize: Math.min(32, width / 26) + 'px',
      fontStyle: 'italic',
      color: '#fff7d6',
      stroke: '#3a2010',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Robey portrait — uses the same rigged character with physics disabled.
    const robey = new Robey(this, cx, height * 0.7);
    if (robey.body) {
      robey.body.setAllowGravity(false);
      robey.body.enable = false;
    }
    const portraitScale = Phaser.Math.Clamp(height / 700, 1.0, 1.6);
    robey.setScale(portraitScale);
    // Gentle hover bob layered on top of the rig's existing idle tween.
    this.tweens.add({
      targets: robey, y: robey.y - 8, duration: 1600, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Begin button — the ONLY interactive element on the home screen.
    const btn = this.add.rectangle(cx, height * 0.88, 240, 70, 0xff7a3a)
      .setStrokeStyle(4, 0x3a2010);
    this.add.text(cx, height * 0.88, 'BEGIN', {
      fontFamily: 'Bookman Old Style, Georgia, serif',
      fontSize: '32px', fontStyle: 'bold',
      color: '#3a2010',
    }).setOrigin(0.5);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setScale(1.04));
    btn.on('pointerout', () => btn.setScale(1));

    let started = false;
    const begin = () => {
      if (started) return;
      started = true;
      btn.disableInteractive();
      Promise.resolve()
        .then(() => startAudio())
        .then(() => setMoodAudio('bright'))
        .catch((err) => console.warn('audio start failed', err));
      this.scene.start('BedroomScene');
    };
    btn.on('pointerdown', begin);
  }
}
