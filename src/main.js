import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { BedroomScene } from './scenes/BedroomScene.js';
import { JungleScene } from './scenes/JungleScene.js';
import { TempleScene } from './scenes/TempleScene.js';
import { EndingScene } from './scenes/EndingScene.js';

// Touch controls are owned by individual scenes (jungle/temple) and stay
// hidden on menu/bedroom/ending screens. Each scene calls setTouchControls
// from this module on enter to set visibility.
export const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
export function setTouchControls(visible) {
  const el = document.getElementById('touch-controls');
  if (!el) return;
  el.classList.toggle('hidden', !(visible && isTouch));
}
setTouchControls(false);

const config = {
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: '#0a1d12',
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1400 },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, BedroomScene, JungleScene, TempleScene, EndingScene],
};

new Phaser.Game(config);
