import Phaser from 'phaser';
import { Robey } from '../entities/Robey.js';
import { setMoodAudio } from '../audio.js';

// Pages 16-18: THUMP back to bedroom, resolution.
export class EndingScene extends Phaser.Scene {
  constructor() { super('EndingScene'); }
  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const groundY = height - 80;
    setMoodAudio('bright');

    this.add.image(cx, height / 2, 'bg-bedroom').setDisplaySize(width, height);

    const floorRect = this.add.rectangle(cx, groundY + 40, width * 2, 80, 0, 0);
    this.physics.add.existing(floorRect, true);
    this.floor = floorRect;

    this.robey = new Robey(this, cx, groundY - 220);
    this.physics.add.collider(this.robey, this.floor, () => {
      if (!this.thumped) {
        this.thumped = true;
        this.cameras.main.shake(160, 0.008);
        this.add.text(this.robey.x + 60, this.robey.y - 60, 'THUMP!', {
          fontFamily: 'Bookman Old Style, Georgia, serif',
          fontSize: '36px', fontStyle: 'bold',
          color: '#ffd54f', stroke: '#3a2010', strokeThickness: 6,
        }).setOrigin(0.5);
        this.time.delayedCall(900, () => this.showResolution());
      }
    });

    this.subtitle = this.add.text(width / 2, height * 0.18, '', {
      fontFamily: 'Bookman Old Style, Georgia, serif', fontSize: '22px',
      color: '#3a2010', align: 'center',
      backgroundColor: '#fff7d6', padding: { x: 14, y: 8 },
      stroke: '#fff7d6', strokeThickness: 1,
    }).setOrigin(0.5).setAlpha(0);
  }

  showResolution() {
    const lines = [
      'That was the scariest and greatest jungle adventure ever!',
      'The bravest adventurers...',
      '...are the ones who can find their way out of trouble.',
    ];
    let i = 0;
    const showNext = () => {
      if (i >= lines.length) return this.showRestart();
      this.subtitle.setText(lines[i]);
      this.tweens.add({ targets: this.subtitle, alpha: 1, duration: 400 });
      this.time.delayedCall(3200, () => {
        this.tweens.add({
          targets: this.subtitle, alpha: 0, duration: 400,
          onComplete: () => { i++; showNext(); },
        });
      });
    };
    showNext();
  }

  showRestart() {
    const { width, height } = this.scale;
    const btn = this.add.rectangle(width / 2, height * 0.66, 260, 64, 0xff7a3a)
      .setStrokeStyle(4, 0x3a2010).setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height * 0.66, 'PLAY AGAIN', {
      fontFamily: 'Bookman Old Style, Georgia, serif',
      fontSize: '26px', fontStyle: 'bold', color: '#3a2010',
    }).setOrigin(0.5);
    btn.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  update() {
    if (this.robey?.body) this.robey.updateAnim(0, this.robey.body.blocked.down || this.robey.body.touching.down);
  }
}
