// Central game state. Kept tiny and explicit so other modules can subscribe.

export const Mood = Object.freeze({
  BRIGHT: 'bright',
  UNEASY: 'uneasy',
  DARK: 'dark',
  ESCAPE: 'escape',
});

export const Phase = Object.freeze({
  MENU: 'menu',
  EXPLORE: 'explore',
  REALIZE: 'realize',
  FLEE: 'flee',
  ESCAPED: 'escaped',
  CAUGHT: 'caught',
});

const listeners = new Set();

export const state = {
  phase: Phase.MENU,
  mood: Mood.BRIGHT,
  seedsCollected: 0,
  seedsTotal: 5,
  hasMet: false,
  startedAt: 0,
};

export function setPhase(next) {
  if (state.phase === next) return;
  state.phase = next;
  emit({ type: 'phase', value: next });
}

export function setMood(next) {
  if (state.mood === next) return;
  state.mood = next;
  emit({ type: 'mood', value: next });
}

export function addSeed() {
  state.seedsCollected = Math.min(state.seedsCollected + 1, state.seedsTotal);
  emit({ type: 'seed', value: state.seedsCollected });
  return state.seedsCollected;
}

export function reset() {
  state.phase = Phase.MENU;
  state.mood = Mood.BRIGHT;
  state.seedsCollected = 0;
  state.hasMet = false;
  state.startedAt = 0;
  emit({ type: 'reset' });
}

export function on(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(event) {
  for (const fn of listeners) fn(event);
}
