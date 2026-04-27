import * as Tone from 'tone';

// Three parallel mini-ensembles. Their volumes crossfade as the game's
// mood shifts. Music is generated live so transitions are seamless.
//
// BRIGHT  - jaunty pizzicato + woodblock + ukulele chords (jungle adventure)
// UNEASY  - same key but slows, adds soft drone underneath
// DARK    - low brass + heartbeat + dissonant strings
// ESCAPE  - galloping bass + drums on top of dark layer

const state = {
  started: false, master: null, reverb: null,
  bright: null, dark: null, escape: null,
};

export async function startAudio() {
  if (state.started) return;
  await Tone.start();
  state.started = true;

  state.master = new Tone.Volume(-6).toDestination();
  state.reverb = new Tone.Reverb({ decay: 4, wet: 0.3 }).connect(state.master);

  buildBright();
  buildDark();
  buildEscape();

  Tone.Transport.bpm.value = 110;
  Tone.Transport.start();
}

function buildBright() {
  const out = new Tone.Volume(-2).connect(state.reverb);
  state.bright = { volume: out };

  // Pizzicato lead
  const pizz = new Tone.PluckSynth({
    attackNoise: 0.4, dampening: 4000, resonance: 0.85,
  }).connect(out);
  pizz.volume.value = -4;
  const melody = ['C5','E5','G5','C6','B5','G5','E5','D5','C5','E5','A5','G5','F5','D5','E5','C5'];
  let mi = 0;
  new Tone.Loop((time) => {
    pizz.triggerAttackRelease(melody[mi % melody.length], '8n', time);
    mi++;
  }, '8n').start(0);

  // Ukulele chords on the offbeats
  const uke = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.18, sustain: 0.0, release: 0.2 },
  }).connect(out);
  uke.volume.value = -10;
  const chords = [['C4','E4','G4'],['F4','A4','C5'],['G4','B4','D5'],['F4','A4','C5']];
  let ci = 0;
  new Tone.Loop((time) => {
    uke.triggerAttackRelease(chords[ci % chords.length], '8n', time);
    ci++;
  }, '2n').start(0);

  // Woodblock for percussion
  const wood = new Tone.MembraneSynth({
    pitchDecay: 0.005, octaves: 2,
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
  }).connect(out);
  wood.volume.value = -16;
  new Tone.Loop((time) => {
    wood.triggerAttackRelease('C5', '16n', time);
  }, '4n').start(0);
}

function buildDark() {
  const out = new Tone.Volume(-60).connect(state.reverb);
  state.dark = { volume: out };

  const drone = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 0.5, modulationIndex: 12,
    envelope: { attack: 4, decay: 0.5, sustain: 0.9, release: 6 },
  }).connect(out);
  drone.volume.value = -8;
  drone.triggerAttack(['A1', 'E2', 'C3']);

  const cello = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    filter: { Q: 2, type: 'lowpass', frequency: 600 },
    envelope: { attack: 2, decay: 0.5, sustain: 0.7, release: 4 },
  }).connect(out);
  cello.volume.value = -10;
  const celloNotes = ['A2', 'F2', 'B2', 'E2'];
  let ci = 0;
  new Tone.Loop((time) => {
    cello.triggerAttackRelease(celloNotes[ci % celloNotes.length], '2m', time);
    ci++;
  }, '2m').start(0);

  const heart = new Tone.MembraneSynth({
    pitchDecay: 0.04, octaves: 2,
    envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.2 },
  }).connect(out);
  heart.volume.value = -6;
  new Tone.Loop((time) => {
    heart.triggerAttackRelease('C2', '8n', time);
    heart.triggerAttackRelease('C2', '8n', time + 0.18);
  }, '2n').start(0);
}

function buildEscape() {
  const out = new Tone.Volume(-60).connect(state.reverb);
  state.escape = { volume: out };

  const bass = new Tone.MonoSynth({
    oscillator: { type: 'square' },
    filter: { type: 'lowpass', frequency: 400, Q: 4 },
    envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
  }).connect(out);
  bass.volume.value = -6;
  const bassNotes = ['A1','A1','G1','A1','A1','F1','G1','A1'];
  let bi = 0;
  new Tone.Loop((time) => {
    bass.triggerAttackRelease(bassNotes[bi % bassNotes.length], '16n', time);
    bi++;
  }, '16n').start(0);

  const kick = new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 4 }).connect(out);
  kick.volume.value = -2;
  const hat = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
  }).connect(out);
  hat.volume.value = -18;
  new Tone.Sequence((time, step) => {
    if (step % 4 === 0) kick.triggerAttackRelease('C2', '8n', time);
    hat.triggerAttackRelease('16n', time);
  }, [0,1,2,3,4,5,6,7], '8n').start(0);
}

export function setMoodAudio(mood) {
  if (!state.started) return;
  const targets = {
    bright: { bright: 0,   dark: -60, escape: -60, bpm: 110 },
    uneasy: { bright: -8,  dark: -10, escape: -60, bpm: 100 },
    dark:   { bright: -60, dark: 0,   escape: -60, bpm: 84 },
    escape: { bright: -60, dark: -2,  escape: 0,   bpm: 138 },
  };
  const t = targets[mood];
  if (!t) return;
  state.bright.volume.volume.rampTo(t.bright, 3);
  state.dark.volume.volume.rampTo(t.dark, 3);
  state.escape.volume.volume.rampTo(t.escape, 2);
  Tone.Transport.bpm.rampTo(t.bpm, 2.5);
}

export function playSting(kind) {
  if (!state.started) return;
  const synth = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.5, release: 0.2 },
    harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5,
  }).connect(state.reverb);
  synth.volume.value = -8;
  if (kind === 'realize') synth.triggerAttackRelease('C3', '4n');
  else if (kind === 'escape') synth.triggerAttackRelease('G2', '2n');
  setTimeout(() => synth.dispose(), 1500);
}
