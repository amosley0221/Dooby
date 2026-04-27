import * as Tone from 'tone';
import { Mood } from './state.js';

// Two parallel ensembles play at the same time. Their volumes crossfade as
// mood drifts from BRIGHT → UNEASY → DARK → ESCAPE.
//
// BRIGHT  : C major, marimba arpeggios, light pad, soft kick.
// DARK    : A minor drone, dissonant cello, rising rumble, heartbeat.
// ESCAPE  : adds fast pulsing bass + percussive kit on top of the dark layer.
//
// The system is one-shot to start (web audio policy requires a user gesture)
// and then runs in the background.

const state = {
  started: false,
  bright: null,
  dark: null,
  escape: null,
  master: null,
  reverb: null,
};

export async function startAudio() {
  if (state.started) return;
  await Tone.start();
  state.started = true;

  state.master = new Tone.Volume(-6).toDestination();
  state.reverb = new Tone.Reverb({ decay: 5, wet: 0.35 }).connect(state.master);

  buildBright();
  buildDark();
  buildEscape();

  Tone.Transport.bpm.value = 92;
  Tone.Transport.start();
}

// --- Bright ensemble ---
function buildBright() {
  const out = new Tone.Volume(-2).connect(state.reverb);
  state.bright = { volume: out, parts: [] };

  // Marimba-ish arpeggio
  const marimba = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.4, sustain: 0.0, release: 0.2 },
  }).connect(out);
  marimba.volume.value = -8;

  const cMajor = ['C5', 'E5', 'G5', 'B5', 'A5', 'G5', 'E5', 'D5'];
  const arp = new Tone.Loop((time) => {
    const note = cMajor[Math.floor(Math.random() * cMajor.length)];
    marimba.triggerAttackRelease(note, '8n', time);
  }, '8n').start(0);
  state.bright.parts.push(arp);

  // Soft pad
  const pad = new Tone.PolySynth(Tone.AMSynth, {
    harmonicity: 1.2,
    envelope: { attack: 1.2, decay: 0.5, sustain: 0.6, release: 1.5 },
  }).connect(out);
  pad.volume.value = -16;

  const padChords = [['C3', 'E3', 'G3'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'], ['F3', 'A3', 'C4']];
  let chordIdx = 0;
  const padLoop = new Tone.Loop((time) => {
    pad.triggerAttackRelease(padChords[chordIdx % padChords.length], '2m', time);
    chordIdx++;
  }, '2m').start(0);
  state.bright.parts.push(padLoop);

  // Tiny twinkle
  const twinkle = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
  }).connect(out);
  twinkle.volume.value = -14;
  const twinkleLoop = new Tone.Loop((time) => {
    if (Math.random() < 0.4) {
      const notes = ['C6', 'E6', 'G6', 'A6'];
      twinkle.triggerAttackRelease(notes[Math.floor(Math.random() * notes.length)], '16n', time);
    }
  }, '4n').start(0);
  state.bright.parts.push(twinkleLoop);

  out.volume.value = 0; // start audible
}

// --- Dark ensemble ---
function buildDark() {
  const out = new Tone.Volume(-60).connect(state.reverb);
  state.dark = { volume: out, parts: [] };

  // Low drone (A minor)
  const drone = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 0.5,
    modulationIndex: 12,
    envelope: { attack: 4, decay: 0.5, sustain: 0.9, release: 6 },
  }).connect(out);
  drone.volume.value = -8;
  drone.triggerAttack(['A1', 'E2', 'C3']);

  // Slow, dissonant cello-ish swells
  const cello = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    filter: { Q: 2, type: 'lowpass', frequency: 600 },
    envelope: { attack: 2, decay: 0.5, sustain: 0.7, release: 4 },
  }).connect(out);
  cello.volume.value = -10;

  const celloNotes = ['A2', 'F2', 'B2', 'E2'];
  let celloIdx = 0;
  const celloLoop = new Tone.Loop((time) => {
    cello.triggerAttackRelease(celloNotes[celloIdx % celloNotes.length], '2m', time);
    celloIdx++;
  }, '2m').start(0);
  state.dark.parts.push(celloLoop);

  // Heartbeat
  const heart = new Tone.MembraneSynth({
    pitchDecay: 0.04, octaves: 2,
    envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.2 },
  }).connect(out);
  heart.volume.value = -6;
  const heartLoop = new Tone.Loop((time) => {
    heart.triggerAttackRelease('C2', '8n', time);
    heart.triggerAttackRelease('C2', '8n', time + 0.18);
  }, '2n').start(0);
  state.dark.parts.push(heartLoop);

  // Whispers (random clipped noise bursts)
  const noise = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.4, decay: 0.6, sustain: 0, release: 0.3 },
  }).connect(out);
  noise.volume.value = -20;
  const whisper = new Tone.Loop((time) => {
    if (Math.random() < 0.3) noise.triggerAttackRelease('2n', time);
  }, '1m').start(0);
  state.dark.parts.push(whisper);
}

// --- Escape ensemble (chase intensity) ---
function buildEscape() {
  const out = new Tone.Volume(-60).connect(state.reverb);
  state.escape = { volume: out, parts: [] };

  // Pulsing low bass on 16ths
  const bass = new Tone.MonoSynth({
    oscillator: { type: 'square' },
    filter: { type: 'lowpass', frequency: 400, Q: 4 },
    envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
  }).connect(out);
  bass.volume.value = -8;
  const bassNotes = ['A1', 'A1', 'G1', 'A1', 'A1', 'F1', 'G1', 'A1'];
  let bIdx = 0;
  const bassLoop = new Tone.Loop((time) => {
    bass.triggerAttackRelease(bassNotes[bIdx % bassNotes.length], '16n', time);
    bIdx++;
  }, '16n').start(0);
  state.escape.parts.push(bassLoop);

  // Drum kit
  const kick = new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 4 }).connect(out);
  kick.volume.value = -2;
  const hat = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
  }).connect(out);
  hat.volume.value = -18;
  const drumLoop = new Tone.Sequence((time, step) => {
    if (step % 4 === 0) kick.triggerAttackRelease('C2', '8n', time);
    hat.triggerAttackRelease('16n', time);
  }, [0, 1, 2, 3, 4, 5, 6, 7], '8n').start(0);
  state.escape.parts.push(drumLoop);
}

// Public: drive volumes from mood. Smooth ramps.
export function setMoodAudio(mood) {
  if (!state.started) return;

  // Targets in dB.
  const targets = {
    [Mood.BRIGHT]:  { bright: 0,   dark: -60, escape: -60, bpm: 92 },
    [Mood.UNEASY]:  { bright: -8,  dark: -8,  escape: -60, bpm: 96 },
    [Mood.DARK]:    { bright: -60, dark: 0,   escape: -60, bpm: 88 },
    [Mood.ESCAPE]:  { bright: -60, dark: -2,  escape: 0,   bpm: 132 },
    [Mood.HOPE]:    { bright: -10, dark: -8,  escape: -60, bpm: 70 },
  };
  const t = targets[mood];
  if (!t) return;

  state.bright.volume.volume.rampTo(t.bright, 4);
  state.dark.volume.volume.rampTo(t.dark, 4);
  state.escape.volume.volume.rampTo(t.escape, 2);
  Tone.Transport.bpm.rampTo(t.bpm, 3);
}

// One-shots for stings/cues
export function playSting(kind) {
  if (!state.started) return;
  const synth = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.5, release: 0.2 },
    harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5,
  }).connect(state.reverb);
  synth.volume.value = -8;
  if (kind === 'realize') synth.triggerAttackRelease('C3', '4n');
  else if (kind === 'collect') {
    const s = new Tone.Synth({ envelope: { attack: 0.001, decay: 0.3, release: 0.2 } })
      .connect(state.reverb);
    s.volume.value = -6;
    s.triggerAttackRelease('E6', '16n');
    s.triggerAttackRelease('B6', '16n', '+0.08');
  } else if (kind === 'escape') {
    synth.triggerAttackRelease('G2', '2n');
  }
  setTimeout(() => synth.dispose(), 1500);
}
