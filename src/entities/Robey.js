import Phaser from 'phaser';

// Robey is a Container of body-part Sprites animated via tweens.
// State machine: idle, run, jump, fall, slash. Switching between states
// only changes which animation tween is active; the rig is always present.
//
// Layout (container origin at 0,0 = chest level):
//   head:   y=-66 .. y=4   (origin 0.5, 1, height 70)
//   torso:  y=4   .. y=64  (origin 0.5, 0 trick: y=4, origin 0.5, 0 height 60)
//   legs:   y=58  .. y=118 (slight overlap so there's no visible seam)
//   arms:   y=12  attached at shoulders
//
// The body collision box matches the visible character:
//   width 40, height 200, offset (-20, -82) so body bottom == feet (y=118)
export class Robey extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(40, 200);
    this.body.setOffset(-20, -82);
    this.body.setMaxVelocity(380, 1200);

    // Build rig
    // Legs are positioned with origin (0.5, 0) so y is the TOP of the leg.
    this.legL = scene.add.image(-7, 58, 'robey-leg').setOrigin(0.5, 0).setDepth(1);
    this.legR = scene.add.image(7, 58, 'robey-leg').setOrigin(0.5, 0).setDepth(1);

    // Arm at the back (drawn behind torso)
    this.armBack = scene.add.image(-18, 12, 'robey-arm').setOrigin(0.5, 0.18).setDepth(0).setRotation(0.18);

    // Torso bottom slightly overlaps top of legs to hide any seam.
    this.torso = scene.add.image(0, 4, 'robey-torso').setOrigin(0.5, 0).setDepth(2);

    // Head bottom overlaps top of torso.
    this.head = scene.add.image(0, -66, 'robey-head').setOrigin(0.5, 0).setDepth(3);

    // Front arm in front of torso
    this.armFront = scene.add.image(18, 12, 'robey-arm').setOrigin(0.5, 0.18).setDepth(4).setRotation(-0.18);

    // Held items: machete in front hand, map in back hand.
    // Machete origin (0, 0.5) means the handle is anchored at the hand position.
    this.machete = scene.add.image(28, 56, 'machete').setOrigin(0, 0.5).setDepth(5).setRotation(-0.2);
    // Map origin (1, 0.5) anchors the right edge to the back hand.
    this.map = scene.add.image(-22, 56, 'map-paper').setOrigin(1, 0.5).setDepth(0).setRotation(0.2);

    this.add([this.armBack, this.legL, this.legR, this.torso, this.head, this.armFront, this.machete, this.map]);

    this.facing = 1;
    this.state = 'idle';
    this.slashing = false;
    this.canSlash = true;

    // Subtle breathing/idle bob
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
      onComplete: () => { this.armFront.rotation = -0.18; },
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
        this.armFront.rotation = -0.18 + Math.sin(t * 14) * 0.4;
        this.armBack.rotation = 0.18 - Math.sin(t * 14) * 0.4;
      }
      this.head.y = -66 + Math.abs(Math.sin(t * 14)) * 1.5;
    } else {
      this.setState('idle');
      this.legL.rotation = 0;
      this.legR.rotation = 0;
      if (!this.slashing) {
        this.armFront.rotation = -0.18 + Math.sin(t * 2) * 0.05;
        this.armBack.rotation = 0.18 + Math.sin(t * 2) * 0.05;
      }
    }
  }
}
