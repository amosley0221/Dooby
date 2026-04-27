import * as THREE from 'three';

// ---------- World layout ----------
// Bright meadow centered at origin. Dark forest is to the north (-Z),
// gated by an old stone arch around z = -45. Beyond z = -120 sits the
// "escape" portal — a hollowed log lit from inside. The mood transition
// happens organically as the player crosses the arch.

export const WORLD = Object.freeze({
  meadowRadius: 50,
  groveX: 38,
  groveZ: -5,
  archZ: -55,
  ruinsZStart: -75,
  ruinsZEnd: -110,
  hollowZStart: -125,
  hollowZEnd: -175,
  poolZ: -150,
  poolRadius: 6,
  cavernZStart: -190,
  cavernZEnd: -235,
  exitZ: -240,
  forestEndZ: -240,
  groundY: 0,
});

export function buildWorld(scene) {
  const root = new THREE.Group();
  scene.add(root);

  const obstacles = [];

  const ground = buildGround();
  root.add(ground);

  const meadow = buildMeadow();
  root.add(meadow);

  const grove = buildGrove(obstacles);
  root.add(grove);

  const forest = buildForest(obstacles);
  root.add(forest);

  const ruins = buildRuins(obstacles);
  root.add(ruins);

  const hollow = buildHollow(obstacles);
  root.add(hollow);

  const cavern = buildCavern(obstacles);
  root.add(cavern);

  const archway = buildArch();
  root.add(archway);

  const exit = buildExit();
  root.add(exit);

  const seeds = scatterSeeds(meadow, grove);
  const stories = scatterStoryProps(root);
  const pool = hollow.userData.pool;

  return {
    root, ground, meadow, grove, forest, ruins, hollow, cavern,
    archway, exit, seeds, stories, pool, obstacles,
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

// ---------- Dark forest (between arch and ruins) ----------
function buildForest(obstacles) {
  const g = new THREE.Group();
  g.name = 'Forest';

  // Tall bare trees from arch through to the cavern entrance.
  for (let i = 0; i < 160; i++) {
    const z = -25 - Math.random() * 200;
    const xOffset = (Math.random() - 0.5) * 60;
    const x = xOffset + (xOffset > 0 ? 4 : -4);
    if (Math.abs(x) < 3.5) continue;
    const tree = makeBareTree(x, z);
    g.add(tree);
    obstacles.push({ x, z, r: 0.45 });
  }

  // Twisted gnarled rocks scattered the whole way.
  for (let i = 0; i < 28; i++) {
    const z = -30 - Math.random() * 195;
    const x = (Math.random() - 0.5) * 50;
    if (Math.abs(x) < 2.5) continue;
    const rock = makeRock(x, z, 0x35333a);
    g.add(rock);
    obstacles.push({ x, z, r: 0.7 });
  }

  // Thin fog mist throughout the dark stretch.
  const fogMat = new THREE.MeshBasicMaterial({
    color: 0x1a1a26, transparent: true, opacity: 0.0, depthWrite: false,
  });
  fogMat.userData.darkOpacity = 0.55;
  fogMat.userData.brightOpacity = 0.0;
  for (let i = 0; i < 70; i++) {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), fogMat);
    plane.position.set(
      (Math.random() - 0.5) * 70,
      1 + Math.random() * 1.5,
      -20 - Math.random() * 220
    );
    plane.rotation.y = Math.random() * Math.PI;
    plane.userData.isMist = true;
    g.add(plane);
  }

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

function scatterSeeds(meadow, grove) {
  // Seeds (collectibles). 3 in meadow, 2 in grove (one slightly elevated).
  const seeds = [];
  const meadowPositions = [
    { x: 10, z: 8, y: 1 },
    { x: -14, z: 16, y: 1 },
    { x: 4, z: 32, y: 1 },
  ];
  const grovePositions = [
    { x: WORLD.groveX - 4, z: WORLD.groveZ + 6, y: 1 },
    { x: WORLD.groveX + 4, z: WORLD.groveZ - 4, y: 2.2 },
  ];
  for (const p of meadowPositions) seeds.push(makeSeed(p, meadow));
  for (const p of grovePositions) seeds.push(makeSeed(p, grove));
  return seeds;
}

function makeSeed({ x, y, z }, parent) {
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
  seed.position.set(x, y, z);
  seed.userData.baseY = y;
  seed.userData.collected = false;
  seed.userData.isSeed = true;
  parent.add(seed);
  return seed;
}

// ---------- Sunken Grove (bright extension, east of meadow) ----------
function buildGrove(obstacles) {
  const g = new THREE.Group();
  g.name = 'Grove';
  const cx = WORLD.groveX, cz = WORLD.groveZ;

  // Denser flowers
  const flowerColors = [0xff6f91, 0xffd166, 0xef476f, 0xf78c6b, 0xfff5d4, 0xc6f0a8];
  for (let i = 0; i < 50; i++) {
    const x = cx + (Math.random() - 0.5) * 18;
    const z = cz + (Math.random() - 0.5) * 18;
    g.add(makeFlower(x, z, flowerColors[i % flowerColors.length]));
  }

  // Friendly trees ringing the grove
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 9 + Math.random() * 3;
    const x = cx + Math.cos(a) * r;
    const z = cz + Math.sin(a) * r;
    g.add(makeFriendlyTree(x, z));
    obstacles.push({ x, z, r: 0.5 });
  }

  // Stepping rock (so the elevated seed is reachable with one jump)
  const step = makeRock(cx + 4, cz - 4, 0xc4b59a);
  step.scale.set(1.6, 1.6, 1.6);
  step.position.y = 0.6;
  g.add(step);

  // A small wooden bench for atmosphere
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.9 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 0.6), benchMat);
  seat.position.set(cx - 6, 0.55, cz + 4);
  seat.castShadow = true;
  g.add(seat);
  for (const dx of [-0.9, 0.9]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.5), benchMat);
    leg.position.set(cx - 6 + dx, 0.25, cz + 4);
    g.add(leg);
  }

  return g;
}

// ---------- Old Ruins ----------
function buildRuins(obstacles) {
  const g = new THREE.Group();
  g.name = 'Ruins';
  const stone = new THREE.MeshStandardMaterial({ color: 0x807a85, roughness: 0.95 });
  stone.userData.brightColor = new THREE.Color(0x807a85);
  stone.userData.darkColor = new THREE.Color(0x2d2a30);

  // Broken columns at varying heights
  for (let i = 0; i < 14; i++) {
    const z = WORLD.ruinsZStart - Math.random() * (WORLD.ruinsZEnd - WORLD.ruinsZStart);
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side * (3.5 + Math.random() * 8);
    const h = 1.5 + Math.random() * 3;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, h, 10), stone);
    col.position.set(x, h / 2, z);
    col.castShadow = true;
    g.add(col);
    obstacles.push({ x, z, r: 0.7 });

    // Broken top piece nearby
    if (Math.random() < 0.5) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), stone);
      cap.position.set(x + (Math.random() - 0.5) * 1.5, 0.2, z + (Math.random() - 0.5) * 1.5);
      cap.rotation.y = Math.random();
      cap.castShadow = true;
      g.add(cap);
    }
  }

  // Half-buried wall segments
  for (let i = 0; i < 6; i++) {
    const z = WORLD.ruinsZStart - Math.random() * 30;
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (5 + Math.random() * 6);
    const w = 2 + Math.random() * 2;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 1.2, 0.4), stone);
    wall.position.set(x, 0.6, z);
    wall.rotation.y = Math.random() * 0.6 - 0.3;
    wall.castShadow = true;
    g.add(wall);
    obstacles.push({ x, z, r: w / 2 });
  }

  return g;
}

// ---------- Whispering Hollow (false-safety beat) ----------
function buildHollow(obstacles) {
  const g = new THREE.Group();
  g.name = 'Hollow';

  // Large bioluminescent mushrooms
  const stalkMat = new THREE.MeshStandardMaterial({ color: 0xd9d3c0, roughness: 0.7 });
  stalkMat.userData.brightColor = new THREE.Color(0xd9d3c0);
  stalkMat.userData.darkColor = new THREE.Color(0x6e6a5e);

  const capColors = [0x7ad9ff, 0xa48cff, 0x66f0c0, 0xff9bd8];
  for (let i = 0; i < 18; i++) {
    const z = WORLD.hollowZStart - Math.random() * (WORLD.hollowZStart - WORLD.hollowZEnd);
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side * (4 + Math.random() * 12);
    const h = 1.4 + Math.random() * 1.6;
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, h, 10), stalkMat);
    stalk.position.set(x, h / 2, z);
    g.add(stalk);

    const capColor = capColors[i % capColors.length];
    const capMat = new THREE.MeshStandardMaterial({
      color: capColor, emissive: capColor, emissiveIntensity: 0.9,
    });
    capMat.userData.brightEmissive = 0.4;
    capMat.userData.darkEmissive = 1.4;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
    cap.position.set(x, h, z);
    cap.scale.y = 0.6;
    g.add(cap);

    obstacles.push({ x, z, r: 0.35 });
  }

  // Glowing shelf moss patches on the ground
  for (let i = 0; i < 25; i++) {
    const x = (Math.random() - 0.5) * 28;
    const z = WORLD.hollowZStart - Math.random() * 50;
    const mossMat = new THREE.MeshStandardMaterial({
      color: 0x6effc0, emissive: 0x2acc8a, emissiveIntensity: 0.6, transparent: true, opacity: 0.85,
    });
    mossMat.userData.brightEmissive = 0.2;
    mossMat.userData.darkEmissive = 0.9;
    const moss = new THREE.Mesh(new THREE.CircleGeometry(0.6 + Math.random() * 0.8, 14), mossMat);
    moss.rotation.x = -Math.PI / 2;
    moss.position.set(x, 0.02, z);
    g.add(moss);
  }

  // Moonlight pool — circular reflective pad with strong upward light
  const poolGroup = new THREE.Group();
  const poolMat = new THREE.MeshStandardMaterial({
    color: 0xbfdfff, emissive: 0xa9d6ff, emissiveIntensity: 1.2,
    transparent: true, opacity: 0.85, roughness: 0.2, metalness: 0.1,
  });
  poolMat.userData.brightEmissive = 0.6;
  poolMat.userData.darkEmissive = 1.6;
  const pool = new THREE.Mesh(new THREE.CircleGeometry(WORLD.poolRadius, 32), poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.05, WORLD.poolZ);
  poolGroup.add(pool);

  // Soft pillar of light above the pool
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xeaf6ff, transparent: true, opacity: 0.18, depthWrite: false,
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(WORLD.poolRadius * 0.7, WORLD.poolRadius, 14, 24, 1, true), beamMat);
  beam.position.set(0, 7, WORLD.poolZ);
  poolGroup.add(beam);

  const poolLight = new THREE.PointLight(0xbfdfff, 6, 22);
  poolLight.position.set(0, 4, WORLD.poolZ);
  poolGroup.add(poolLight);

  g.add(poolGroup);
  g.userData.pool = { x: 0, z: WORLD.poolZ, r: WORLD.poolRadius, light: poolLight };

  return g;
}

// ---------- Cavern Approach ----------
function buildCavern(obstacles) {
  const g = new THREE.Group();
  g.name = 'Cavern';
  const stone = new THREE.MeshStandardMaterial({
    color: 0x2a262e, roughness: 1, flatShading: true,
  });
  stone.userData.brightColor = new THREE.Color(0x60585e);
  stone.userData.darkColor = new THREE.Color(0x18161c);

  // Mouth: two large boulder formations forming a gateway at the entrance.
  for (const side of [-1, 1]) {
    const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6, 0), stone);
    boulder.position.set(side * 4, 1.5, WORLD.cavernZStart);
    boulder.castShadow = true;
    g.add(boulder);
    obstacles.push({ x: side * 4, z: WORLD.cavernZStart, r: 1.8 });
  }

  // Tightening corridor walls
  const segments = 14;
  for (let i = 0; i < segments; i++) {
    const t = i / (segments - 1);
    const z = WORLD.cavernZStart - t * (WORLD.cavernZStart - WORLD.cavernZEnd);
    const halfWidth = 6 - t * 3.2;
    for (const side of [-1, 1]) {
      const rockMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 + Math.random() * 0.8, 0), stone);
      const x = side * halfWidth + (Math.random() - 0.5) * 0.5;
      rockMesh.position.set(x, 0.7, z);
      rockMesh.rotation.set(Math.random(), Math.random(), Math.random());
      rockMesh.castShadow = true;
      g.add(rockMesh);
      obstacles.push({ x, z, r: 1.0 });
    }
  }

  // A few dim ember sparks (ground-level point lights to hint at the way out)
  for (let i = 0; i < 5; i++) {
    const z = WORLD.cavernZStart - 6 - i * ((WORLD.cavernZStart - WORLD.cavernZEnd - 12) / 5);
    const ember = new THREE.PointLight(0xff7a3a, 0.6, 5);
    ember.position.set((i % 2 === 0 ? 1 : -1) * 1.2, 0.4, z);
    g.add(ember);
  }

  return g;
}

// ---------- Story props (environmental storytelling) ----------
function scatterStoryProps(root) {
  const stories = [];

  // Torn cloth on a branch (just past the arch)
  stories.push(makeTornCloth(-2.5, -60, 'A scrap of cloth. Still warm.'));

  // Scattered bones in the ruins
  stories.push(makeBones(3, -90, 'Old bones. Picked clean. Not by anything kind.'));

  // Dead campfire in the ruins
  stories.push(makeDeadCampfire(-4, -100, 'A fire pit, long cold. Whoever lit it never came back.'));

  // Claw marks on a tree (between ruins and hollow)
  stories.push(makeClawMarks(2.5, -118, 'Five long gouges. Higher than your head.'));

  // A second torn cloth at the cavern mouth
  stories.push(makeTornCloth(2, -188, 'Another scrap. You\'re on a path.'));

  for (const s of stories) root.add(s);
  return stories;
}

function makeTornCloth(x, z, line) {
  const g = new THREE.Group();
  const cloth = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.7),
    new THREE.MeshStandardMaterial({
      color: 0xc25a3a, side: THREE.DoubleSide, transparent: true, opacity: 0.9,
    })
  );
  cloth.position.y = 1.6;
  cloth.rotation.y = Math.random() * Math.PI;
  g.add(cloth);
  const branch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6),
    new THREE.MeshStandardMaterial({ color: 0x1a1518 })
  );
  branch.rotation.z = Math.PI / 2;
  branch.position.set(0, 1.7, 0);
  g.add(branch);
  g.position.set(x, 0, z);
  g.userData.story = { line, seen: false, radius: 3 };
  return g;
}

function makeBones(x, z, line) {
  const g = new THREE.Group();
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xe8e0c8, roughness: 0.9 });
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5 + Math.random() * 0.4, 6), boneMat);
    b.position.set((Math.random() - 0.5) * 0.8, 0.1, (Math.random() - 0.5) * 0.8);
    b.rotation.set(Math.random(), Math.random(), Math.random());
    g.add(b);
  }
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), boneMat);
  skull.position.set(0, 0.18, 0);
  g.add(skull);
  g.position.set(x, 0, z);
  g.userData.story = { line, seen: false, radius: 3 };
  return g;
}

function makeDeadCampfire(x, z, line) {
  const g = new THREE.Group();
  const ashMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 1 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.12, 8, 18), ashMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  g.add(ring);
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x1a1010 })
    );
    log.position.y = 0.1;
    log.rotation.z = Math.PI / 2;
    log.rotation.y = (i / 3) * Math.PI * 2;
    g.add(log);
  }
  g.position.set(x, 0, z);
  g.userData.story = { line, seen: false, radius: 3 };
  return g;
}

function makeClawMarks(x, z, line) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.5, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x1a1518 })
  );
  trunk.position.y = 2;
  g.add(trunk);
  const scarMat = new THREE.MeshBasicMaterial({ color: 0xff2020 });
  for (let i = 0; i < 5; i++) {
    const scar = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 1.4), scarMat);
    scar.position.set(0.41, 2.1, -0.25 + i * 0.12);
    scar.rotation.y = Math.PI / 2;
    g.add(scar);
  }
  g.position.set(x, 0, z);
  g.userData.story = { line, seen: false, radius: 3 };
  return g;
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
