import Phaser from 'phaser';

// Robey is a Container of body-part Sprites animated via tweens.
// State machine: idle, run, jump, fall, slash. Switching between states
// only changes which animation tween is active; the rig is always present.
export class Robey extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(46, 110);
    this.body.setOffset(-23, -55);
    this.body.setMaxVelocity(380, 1200);

    // Build rig (origin: feet at y=0, head goes up)
    this.legL = scene.add.image(-10, -10, 'robey-leg').setOrigin(0.5, 0).setDepth(1);
    this.legR = scene.add.image(10, -10, 'robey-leg').setOrigin(0.5, 0).setDepth(1);
    this.armBack = scene.add.image(-22, -90, 'robey-arm').setOrigin(0.5, 0.18).setDepth(0).setRotation(0.2);
    this.torso = scene.add.image(0, -76, 'robey-torso').setOrigin(0.5, 1).setDepth(2);
    this.head = scene.add.image(0, -78, 'robey-head').setOrigin(0.5, 1).setDepth(3);
    this.armFront = scene.add.image(20, -90, 'robey-arm').setOrigin(0.5, 0.18).setDepth(4).setRotation(-0.2);

    // Held items: machete in front hand, map in back hand
    this.machete = scene.add.image(36, -68, 'machete').setOrigin(0, 0.5).setDepth(5).setRotation(-0.2);
    this.map = scene.add.image(-30, -70, 'map-paper').setOrigin(1, 0.5).setDepth(0).setRotation(0.15);

    this.add([this.armBack, this.legL, this.legR, this.torso, this.head, this.armFront, this.machete, this.map]);

    this.facing = 1;
    this.state = 'idle';
    this.slashing = false;
    this.canSlash = true;

    this.idleTween = scene.tweens.add({
      targets: [this.head, this.torso],
      y: '-=2', duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  setFacing(dir) {
    if (dir === this.facing || dir === 0) return;
    this.facing = dir;
    this.scaleX = dir;
  }

  setState(next) {
    if (this.state === next) return;
    this.state = next;
  }

  slash() {
    if (!this.canSlash || this.slashing) return false;
    this.slashing = true;
    this.canSlash = false;
    const startRot = this.machete.rotation;
    this.scene.tweens.add({
      targets: this.machete,
      rotation: startRot - 1.6,
      duration: 90,
      yoyo: true,
      onComplete: () => {
        this.slashing = false;
        this.machete.rotation = -0.2;
      },
    });
    this.scene.tweens.add({
      targets: this.armFront,
      rotation: -1.2,
      duration: 90,
      yoyo: true,
      onComplete: () => { this.armFront.rotation = -0.2; },
    });
    this.scene.time.delayedCall(280, () => { this.canSlash = true; });
    return true;
  }

  // Manual per-frame animation since we're not using sprite sheets.
  updateAnim(speedX, onGround) {
    const t = this.scene.time.now / 1000;
    if (!onGround) {
      this.setState(this.body.velocity.y < 0 ? 'jump' : 'fall');
      this.legL.rotation = -0.4;
      this.legR.rotation = 0.4;
    } else if (Math.abs(speedX) > 30) {
      this.setState('run');
      const swing = Math.sin(t * 14) * 0.7;
      this.legL.rotation = swing;
      this.legR.rotation = -swing;
      if (!this.slashing) {
        this.armFront.rotation = -0.2 + Math.sin(t * 14) * 0.4;
        this.armBack.rotation = 0.2 - Math.sin(t * 14) * 0.4;
      }
      this.head.y = -78 + Math.abs(Math.sin(t * 14)) * 1.5;
    } else {
      this.setState('idle');
      this.legL.rotation = 0;
      this.legR.rotation = 0;
      if (!this.slashing) {
        this.armFront.rotation = -0.2 + Math.sin(t * 2) * 0.05;
        this.armBack.rotation = 0.2 + Math.sin(t * 2) * 0.05;
      }
    }
  }
}
