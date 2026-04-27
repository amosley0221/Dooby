import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { BedroomScene } from './scenes/BedroomScene.js';
import { JungleScene } from './scenes/JungleScene.js';
import { TempleScene } from './scenes/TempleScene.js';
import { EndingScene } from './scenes/EndingScene.js';

const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (isTouch) {
  document.getElementById('touch-controls')?.classList.remove('hidden');
}

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
