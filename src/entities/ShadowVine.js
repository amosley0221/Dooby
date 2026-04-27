import Phaser from 'phaser';

// Shadow vines erupt from the ground when Robey is near and try to grab him.
// Three hits with the machete dispels one. They sway between cycles.
export class ShadowVine extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'shadow-vine');
    this.setOrigin(0.5, 1);
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body
    this.body.setSize(28, 80);
    this.body.setOffset(-2, 0);
    this.hp = 3;
    this.dead = false;
    this.swayTween = scene.tweens.add({
      targets: this, rotation: { from: -0.12, to: 0.12 },
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  hit() {
    if (this.dead) return false;
    this.hp -= 1;
    this.scene.tweens.add({
      targets: this, alpha: { from: 0.3, to: 1 }, duration: 80, repeat: 2,
    });
    if (this.hp <= 0) {
      this.dead = true;
      this.swayTween.stop();
      this.scene.tweens.add({
        targets: this, alpha: 0, scaleY: 0.1, duration: 250,
        onComplete: () => this.destroy(),
      });
      return true;
    }
    return false;
  }
}
