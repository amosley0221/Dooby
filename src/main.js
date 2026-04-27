import { Game } from './game.js';
import { state, on, Phase } from './state.js';

const canvas = document.getElementById('game-canvas');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const endScreen = document.getElementById('end-screen');
const endTitle = document.getElementById('end-title');
const endText = document.getElementById('end-text');
const restartButton = document.getElementById('restart-button');
const hud = document.getElementById('hud');
const seedCount = document.getElementById('seed-count');
const objective = document.getElementById('objective');

let game = null;

startButton.addEventListener('click', async () => {
  startScreen.classList.add('hidden');
  hud.classList.remove('hidden');
  if (!game) {
    game = new Game(canvas);
    game.onEnd = handleEnd;
  }
  await game.start();
});

restartButton.addEventListener('click', () => {
  endScreen.classList.add('hidden');
  game.resetForRestart();
});

on((event) => {
  if (event.type === 'seed') {
    seedCount.textContent = `${state.seedsCollected} / ${state.seedsTotal}`;
    if (state.seedsCollected >= state.seedsTotal) {
      objective.textContent = 'Get out. NOW.';
    }
  }
  if (event.type === 'phase') {
    if (event.value === Phase.REALIZE || event.value === Phase.FLEE) {
      objective.textContent = 'Reach the hollow log';
    }
    if (event.value === Phase.MENU) {
      objective.textContent = 'Find the glowing seeds';
      seedCount.textContent = `0 / ${state.seedsTotal}`;
    }
  }
});

function handleEnd(kind) {
  setTimeout(() => {
    if (kind === 'escaped') {
      endTitle.textContent = 'You escaped.';
      endText.textContent = 'For now. The forest remembers your scent.';
    } else {
      endTitle.textContent = 'It found you.';
      endText.textContent = 'The seeds scattered into the leaves. The light went out.';
    }
    endScreen.classList.remove('hidden');
  }, 2200);
}
