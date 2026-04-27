import * as THREE from 'three';

// ---------- World layout ----------
// Bright meadow centered at origin. Dark forest is to the north (-Z),
// gated by an old stone arch around z = -45. Beyond z = -120 sits the
// "escape" portal — a hollowed log lit from inside. The mood transition
// happens organically as the player crosses the arch.

export const WORLD = Object.freeze({
  meadowRadius: 50,
  archZ: -45,
  forestEndZ: -130,
  exitZ: -125,
  groundY: 0,
});

export function buildWorld(scene) {
  const root = new THREE.Group();
  scene.add(root);

  const ground = buildGround();
  root.add(ground);

  const meadow = buildMeadow();
  root.add(meadow);

  const forest = buildForest();
  root.add(forest);

  const archway = buildArch();
  root.add(archway);

  const exit = buildExit();
  root.add(exit);

  const seeds = scatterSeeds(meadow);

  return {
    root, ground, meadow, forest, archway, exit, seeds,
    obstacles: collectObstacles(forest),
  };
}

// ---------- Ground ----------
function buildGround() {
  const g = new THREE.Group();
  const geom = new THREE.PlaneGeometry(400, 400, 80, 80);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // Gentle rolling hills. Flatter near origin so the player has room.
    const distFactor = Math.min(1, Math.hypot(x, y) / 60);
    const h = (Math.sin(x * 0.05) + Math.cos(y * 0.07)) * 0.6 * distFactor;
    pos.setZ(i, h);
  }
  geom.computeVertexNormals();
  geom.rotateX(-Math.PI / 2);

  const mat = new THREE.MeshStandardMaterial({
    color: 0x6ec27a, roughness: 0.95, metalness: 0,
  });
  mat.userData.brightColor = new THREE.Color(0x6ec27a);
  mat.userData.darkColor = new THREE.Color(0x1d2a22);

  const mesh = new THREE.Mesh(geom, mat);
  mesh.receiveShadow = true;
  mesh.name = 'Ground';
  g.add(mesh);
  return g;
}

// ---------- Bright meadow ----------
function buildMeadow() {
  const g = new THREE.Group();
  g.name = 'Meadow';

  // Flowers
  const flowerColors = [0xff6f91, 0xffd166, 0xef476f, 0xf78c6b, 0xfff5d4];
  for (let i = 0; i < 110; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 4 + Math.random() * 38;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (z < -10) continue; // keep meadow on the southern side
    g.add(makeFlower(x, z, flowerColors[i % flowerColors.length]));
  }

  // Cheerful little trees
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 12 + Math.random() * 30;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (z < -12) continue;
    g.add(makeFriendlyTree(x, z));
  }

  // Sun-warm rocks (for visual variety)
  for (let i = 0; i < 8; i++) {
    const x = (Math.random() - 0.5) * 70;
    const z = 5 + Math.random() * 35;
    g.add(makeRock(x, z, 0xb6a48a));
  }

  return g;
}

function makeFlower(x, z, color) {
  const flower = new THREE.Group();
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x55833a })
  );
  stem.position.y = 0.25;
  flower.add(stem);

  const petalMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.15 });
  petalMat.userData.brightEmissive = 0.15;
  petalMat.userData.darkEmissive = 0.0;

  const petal = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), petalMat);
  petal.position.y = 0.55;
  flower.add(petal);

  flower.position.set(x, 0, z);
  flower.rotation.y = Math.random() * Math.PI * 2;
  return flower;
}

function makeFriendlyTree(x, z) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.35, 1.6, 10),
    new THREE.MeshStandardMaterial({ color: 0x6b4327 })
  );
  trunk.position.y = 0.8;
  trunk.castShadow = true;
  tree.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x4fb96a });
  leafMat.userData.brightColor = new THREE.Color(0x4fb96a);
  leafMat.userData.darkColor = new THREE.Color(0x1d3a26);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 12), leafMat);
  canopy.position.y = 2.0;
  canopy.scale.set(1.2, 1.0, 1.2);
  canopy.castShadow = true;
  tree.add(canopy);

  tree.position.set(x, 0, z);
  return tree;
}

function makeRock(x, z, color) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.5, 0),
    new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 1 })
  );
  rock.position.set(x, 0.3, z);
  rock.rotation.set(Math.random(), Math.random(), Math.random());
  rock.castShadow = true;
  return rock;
}

// ---------- Dark forest ----------
function buildForest() {
  const g = new THREE.Group();
  g.name = 'Forest';
  const obstacles = [];

  // Tall, sparse, bare trees lining a corridor going north (-Z).
  for (let i = 0; i < 90; i++) {
    const z = -20 - Math.random() * 110;
    const xOffset = (Math.random() - 0.5) * 50;
    // Keep a corridor of width ~10 around x=0 mostly clear
    const x = xOffset + (xOffset > 0 ? 4 : -4);
    if (Math.abs(x) < 3.5) continue;
    const tree = makeBareTree(x, z);
    g.add(tree);
    obstacles.push({ x, z, r: 0.45 });
  }

  // Twisted, gnarled rocks
  for (let i = 0; i < 16; i++) {
    const z = -25 - Math.random() * 100;
    const x = (Math.random() - 0.5) * 40;
    if (Math.abs(x) < 2.5) continue;
    const rock = makeRock(x, z, 0x35333a);
    g.add(rock);
    obstacles.push({ x, z, r: 0.7 });
  }

  // Thin fog mist particles (cheap: low-poly translucent planes)
  const fogMat = new THREE.MeshBasicMaterial({
    color: 0x1a1a26, transparent: true, opacity: 0.0, depthWrite: false,
  });
  fogMat.userData.darkOpacity = 0.55;
  fogMat.userData.brightOpacity = 0.0;
  for (let i = 0; i < 40; i++) {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), fogMat);
    plane.position.set(
      (Math.random() - 0.5) * 60,
      1 + Math.random() * 1.5,
      -20 - Math.random() * 110
    );
    plane.rotation.y = Math.random() * Math.PI;
    plane.userData.isMist = true;
    g.add(plane);
  }

  g.userData.obstacles = obstacles;
  return g;
}

function makeBareTree(x, z) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.5, 5 + Math.random() * 3, 8),
    new THREE.MeshStandardMaterial({ color: 0x1f1a20, roughness: 0.95 })
  );
  trunk.position.y = trunk.geometry.parameters.height / 2;
  trunk.castShadow = true;
  tree.add(trunk);

  // A few twisted branches
  for (let i = 0; i < 3; i++) {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.1, 1.5 + Math.random(), 6),
      new THREE.MeshStandardMaterial({ color: 0x1a1518 })
    );
    branch.position.y = 2 + Math.random() * 2;
    branch.rotation.z = (Math.random() - 0.5) * 1.5;
    branch.rotation.y = Math.random() * Math.PI;
    tree.add(branch);
  }

  tree.position.set(x, 0, z);
  return tree;
}

function buildArch() {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6a6770, roughness: 0.95 });

  const left = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4, 0.8), stoneMat);
  left.position.set(-3, 2, WORLD.archZ);
  left.castShadow = true;
  const right = left.clone();
  right.position.x = 3;
  const top = new THREE.Mesh(new THREE.BoxGeometry(7, 0.8, 0.8), stoneMat);
  top.position.set(0, 4, WORLD.archZ);
  top.castShadow = true;

  g.add(left, right, top);
  g.name = 'Arch';
  return g;
}

function buildExit() {
  const g = new THREE.Group();
  // Hollow log with a glowing inside.
  const log = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 5, 18, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x4a3a2c, side: THREE.DoubleSide, roughness: 0.9,
    })
  );
  log.rotation.z = Math.PI / 2;
  log.position.set(0, 2, WORLD.exitZ);
  g.add(log);

  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 24),
    new THREE.MeshBasicMaterial({ color: 0xffd57a })
  );
  glow.position.set(0, 2, WORLD.exitZ - 0.1);
  glow.userData.isExitGlow = true;
  g.add(glow);

  const light = new THREE.PointLight(0xffd57a, 4, 14);
  light.position.set(0, 2, WORLD.exitZ - 0.5);
  g.add(light);
  g.userData.exitLight = light;

  g.name = 'Exit';
  return g;
}

function scatterSeeds(meadow) {
  // Seeds (collectibles) — small glowing spheres that float and spin.
  const seeds = [];
  const positions = [
    [10, 8], [-12, 14], [18, 22], [-22, 6], [4, 32],
  ];
  for (const [x, z] of positions) {
    const seed = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.25, 0),
      new THREE.MeshStandardMaterial({
        color: 0xfff1a8, emissive: 0xffaa44, emissiveIntensity: 1.4,
      })
    );
    seed.add(core);
    const halo = new THREE.PointLight(0xffd577, 2, 4);
    seed.add(halo);
    seed.position.set(x, 1, z);
    seed.userData.collected = false;
    seed.userData.isSeed = true;
    seeds.push(seed);
    meadow.add(seed);
  }
  return seeds;
}

function collectObstacles(forest) {
  return forest.userData.obstacles ?? [];
}

// ---------- Mood transitions ----------
// Smoothly drives material color/emissive/opacity toward dark or bright targets.
export function applyMoodToWorld(world, t) {
  // t = 0 → bright, 1 → dark
  world.root.traverse((obj) => {
    const mat = obj.material;
    if (!mat) return;
    if (mat.userData?.brightColor && mat.userData?.darkColor) {
      mat.color.copy(mat.userData.brightColor).lerp(mat.userData.darkColor, t);
    }
    if (mat.userData?.brightEmissive !== undefined && mat.userData?.darkEmissive !== undefined) {
      mat.emissiveIntensity = THREE.MathUtils.lerp(
        mat.userData.brightEmissive, mat.userData.darkEmissive, t
      );
    }
    if (mat.userData?.brightOpacity !== undefined && mat.userData?.darkOpacity !== undefined) {
      mat.opacity = THREE.MathUtils.lerp(
        mat.userData.brightOpacity, mat.userData.darkOpacity, t
      );
    }
  });
}
