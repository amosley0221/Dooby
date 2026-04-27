import * as THREE from 'three';
import { initInput, readInput } from './input.js';
import { createDooby, animateDooby } from './player.js';
import { buildWorld, applyMoodToWorld, WORLD } from './world.js';
import { startAudio, setMoodAudio, playSting } from './audio.js';
import { state, setPhase, setMood, addSeed, on, Phase, Mood, reset } from './state.js';

// One per game session.
export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.running = false;

    // -- Renderer --
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // -- Scene + sky --
    this.scene = new THREE.Scene();
    this.brightSky = new THREE.Color(0xa9d8ff);
    this.darkSky = new THREE.Color(0x07070d);
    this.scene.background = this.brightSky.clone();
    this.scene.fog = new THREE.Fog(this.brightSky.clone(), 60, 180);

    // -- Camera (third-person follow) --
    this.camera = new THREE.PerspectiveCamera(
      62, window.innerWidth / window.innerHeight, 0.1, 500
    );
    this.cameraYaw = 0;
    this.cameraPitch = -0.15;
    this.cameraDistance = 5.5;

    // -- Lights --
    this.ambient = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(this.ambient);

    this.sun = new THREE.DirectionalLight(0xfff1c4, 1.6);
    this.sun.position.set(20, 35, 15);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -50;
    this.sun.shadow.camera.right = 50;
    this.sun.shadow.camera.top = 50;
    this.sun.shadow.camera.bottom = -50;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 120;
    this.scene.add(this.sun);

    // A subtle hemisphere rim for stylization.
    this.hemi = new THREE.HemisphereLight(0xfff1c4, 0x4a5a3c, 0.5);
    this.scene.add(this.hemi);

    // -- World --
    this.world = buildWorld(this.scene);

    // -- Player --
    this.dooby = createDooby();
    this.dooby.position.set(0, 0, 8);
    this.scene.add(this.dooby);
    this.velocity = new THREE.Vector3();
    this.grounded = true;

    // -- Stalker (the unseen thing watching) --
    this.stalker = makeStalker();
    this.stalker.visible = false;
    this.scene.add(this.stalker);

    // -- Mood blend (0 bright → 1 dark) --
    this.moodBlend = 0;
    this.moodBlendTarget = 0;

    // -- Story flags --
    this.realizationTriggered = false;

    // -- Wire input + resize --
    initInput(canvas);
    window.addEventListener('resize', () => this.resize());

    // -- React to state changes --
    on((event) => {
      if (event.type === 'mood') setMoodAudio(event.value);
      if (event.type === 'phase' && event.value === Phase.ESCAPED) playSting('escape');
    });
  }

  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  async start() {
    await startAudio();
    setMood(Mood.BRIGHT);
    setPhase(Phase.EXPLORE);
    state.startedAt = performance.now();
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
  }

  resetForRestart() {
    reset();
    this.realizationTriggered = false;
    this.moodBlend = 0;
    this.moodBlendTarget = 0;
    this.dooby.position.set(0, 0, 8);
    this.velocity.set(0, 0, 0);
    this.cameraYaw = 0;
    this.cameraPitch = -0.15;
    this.stalker.visible = false;
    // Restore seeds
    for (const seed of this.world.seeds) {
      seed.userData.collected = false;
      seed.visible = true;
    }
    setMood(Mood.BRIGHT);
    setPhase(Phase.EXPLORE);
  }

  loop = () => {
    if (!this.running) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.loop);
  };

  update(dt) {
    const input = readInput();

    // ---- Camera yaw/pitch from look ----
    this.cameraYaw -= input.lookX * 0.0025;
    this.cameraPitch -= input.lookY * 0.0025;
    this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch, -0.9, 0.4);

    // ---- Player movement (camera-relative) ----
    const forward = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
    const right = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));
    const moveDir = new THREE.Vector3();
    moveDir.addScaledVector(forward, -input.moveY);
    moveDir.addScaledVector(right, input.moveX);
    if (moveDir.lengthSq() > 0) moveDir.normalize();

    const baseSpeed = state.phase === Phase.FLEE ? 7.5 : 5.5;
    this.velocity.x = moveDir.x * baseSpeed;
    this.velocity.z = moveDir.z * baseSpeed;

    // Jump
    if (input.jump && this.grounded) {
      this.velocity.y = 7;
      this.grounded = false;
    }
    this.velocity.y -= 22 * dt;

    // Apply
    this.dooby.position.addScaledVector(this.velocity, dt);
    if (this.dooby.position.y <= WORLD.groundY) {
      this.dooby.position.y = WORLD.groundY;
      this.velocity.y = 0;
      this.grounded = true;
    }

    // Face movement direction
    if (moveDir.lengthSq() > 0.001) {
      const targetYaw = Math.atan2(moveDir.x, moveDir.z);
      this.dooby.rotation.y = lerpAngle(this.dooby.rotation.y, targetYaw, 1 - Math.exp(-12 * dt));
    }

    // Obstacle avoidance (forest trees / rocks)
    for (const o of this.world.obstacles) {
      const dx = this.dooby.position.x - o.x;
      const dz = this.dooby.position.z - o.z;
      const d = Math.hypot(dx, dz);
      const minD = o.r + 0.4;
      if (d < minD && d > 0.0001) {
        const push = (minD - d);
        this.dooby.position.x += (dx / d) * push;
        this.dooby.position.z += (dz / d) * push;
      }
    }

    // ---- Camera follow ----
    const camOffset = new THREE.Vector3(
      Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
      -Math.sin(this.cameraPitch),
      Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch),
    ).multiplyScalar(this.cameraDistance);
    const camTarget = this.dooby.position.clone().add(new THREE.Vector3(0, 1.6, 0));
    const camPos = camTarget.clone().add(camOffset);
    this.camera.position.lerp(camPos, 1 - Math.exp(-10 * dt));
    this.camera.lookAt(camTarget.x, camTarget.y - 0.4, camTarget.z);

    // ---- Seed collection ----
    if (state.phase === Phase.EXPLORE || state.phase === Phase.REALIZE) {
      for (const seed of this.world.seeds) {
        if (!seed.visible) continue;
        seed.rotation.y += dt * 2;
        seed.position.y = 1 + Math.sin(performance.now() / 600 + seed.position.x) * 0.2;
        const dx = seed.position.x - this.dooby.position.x;
        const dz = seed.position.z - this.dooby.position.z;
        if (Math.hypot(dx, dz) < 1.3 && Math.abs(seed.position.y - this.dooby.position.y - 0.8) < 1.3) {
          seed.visible = false;
          seed.userData.collected = true;
          addSeed();
          playSting('collect');
        }
      }
    }

    // ---- Story progression ----
    this.updateStory(dt);

    // ---- Visual mood blend ----
    this.moodBlend += (this.moodBlendTarget - this.moodBlend) * (1 - Math.exp(-1.5 * dt));
    applyMoodToWorld(this.world, this.moodBlend);
    this.scene.background.copy(this.brightSky).lerp(this.darkSky, this.moodBlend);
    if (this.scene.fog) {
      this.scene.fog.color.copy(this.scene.background);
      this.scene.fog.near = THREE.MathUtils.lerp(60, 12, this.moodBlend);
      this.scene.fog.far = THREE.MathUtils.lerp(180, 55, this.moodBlend);
    }
    this.ambient.intensity = THREE.MathUtils.lerp(0.55, 0.12, this.moodBlend);
    this.sun.intensity = THREE.MathUtils.lerp(1.6, 0.25, this.moodBlend);
    this.sun.color.setHex(this.moodBlend > 0.5 ? 0x6877a8 : 0xfff1c4);

    // Vignette CSS
    const v = document.getElementById('vignette');
    if (v) v.classList.toggle('dark', this.moodBlend > 0.5);

    // ---- Stalker behavior ----
    if (this.stalker.visible) {
      this.updateStalker(dt);
    }

    // ---- Animate Dooby ----
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    const fear = THREE.MathUtils.clamp(this.moodBlend, 0, 1);
    animateDooby(this.dooby, dt, speed, fear);
  }

  updateStory(dt) {
    const z = this.dooby.position.z;
    const seedsAll = state.seedsCollected >= state.seedsTotal;

    // Beat 1: All seeds collected → uneasy, sky dims
    if (seedsAll && state.mood === Mood.BRIGHT && !this.realizationTriggered) {
      setMood(Mood.UNEASY);
      this.moodBlendTarget = 0.35;
      showSubtitle('Something is watching from the trees...', 4500);
    }

    // Beat 2: Cross the arch → realization
    if (z < WORLD.archZ + 2 && !this.realizationTriggered) {
      this.realizationTriggered = true;
      setPhase(Phase.REALIZE);
      setMood(Mood.DARK);
      this.moodBlendTarget = 1.0;
      this.stalker.visible = true;
      this.stalker.position.set(this.dooby.position.x, 0, this.dooby.position.z - 30);
      playSting('realize');
      showSubtitle('Run, Dooby. Run.', 5000);
      // Flip to flee phase after a beat.
      setTimeout(() => {
        setPhase(Phase.FLEE);
        setMood(Mood.ESCAPE);
      }, 2000);
    }

    // Beat 3: Reach the exit
    if (state.phase !== Phase.ESCAPED && z < WORLD.exitZ + 2.5 && this.realizationTriggered) {
      setPhase(Phase.ESCAPED);
      showSubtitle('A flicker of warmth. You crawl through.', 5000);
      this.onEnd?.('escaped');
    }

    // Beat 4: Caught (stalker close enough)
    if (state.phase === Phase.FLEE) {
      const dx = this.stalker.position.x - this.dooby.position.x;
      const dz = this.stalker.position.z - this.dooby.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 1.4) {
        setPhase(Phase.CAUGHT);
        showSubtitle('It found you.', 4000);
        this.onEnd?.('caught');
      }
    }
  }

  updateStalker(dt) {
    // Stalker drifts toward Dooby; slower than Dooby's flee speed but
    // accelerates as the chase progresses.
    const target = this.dooby.position;
    const dir = new THREE.Vector3(target.x - this.stalker.position.x, 0, target.z - this.stalker.position.z);
    const dist = dir.length();
    if (dist > 0.001) dir.normalize();
    const elapsed = (performance.now() - state.startedAt) / 1000;
    const speed = 4 + Math.min(2.5, elapsed / 60);
    this.stalker.position.x += dir.x * speed * dt;
    this.stalker.position.z += dir.z * speed * dt;
    // Hover bob
    this.stalker.position.y = 0.6 + Math.sin(performance.now() / 300) * 0.15;
    // Face the player
    this.stalker.rotation.y = Math.atan2(dir.x, dir.z);
  }
}

// ---- Helpers ----
function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

function makeStalker() {
  // A tall, indistinct figure: dark elongated form with two pinpoint eyes.
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.7, 3.2, 12),
    new THREE.MeshStandardMaterial({ color: 0x07070b, roughness: 1 })
  );
  body.position.y = 1.6;
  g.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0x07070b, roughness: 1 })
  );
  head.position.y = 3.1;
  g.add(head);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
  const eyeGeom = new THREE.SphereGeometry(0.06, 10, 8);
  const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
  eyeL.position.set(-0.12, 3.15, 0.32);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.12;
  g.add(eyeL, eyeR);
  return g;
}

function showSubtitle(text, ms = 3000) {
  const el = document.getElementById('subtitle');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('hidden');
  el.classList.add('visible');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('visible'), ms);
}
