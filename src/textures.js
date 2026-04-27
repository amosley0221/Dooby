// Procedural textures generated into Phaser at boot time.
// Each generator draws into a Graphics object and bakes it as a texture key
// so scenes can reference sprites by name without needing image files.

export function generateAllTextures(scene) {
  generateRobeyParts(scene);
  generateMachete(scene);
  generateMap(scene);
  generateFirefly(scene);
  generateBedroomBG(scene);
  generateJungleBG(scene);
  generateTempleBG(scene);
  generateGroundTile(scene);
  generatePlatform(scene);
  generateVine(scene);
  generateShadowVine(scene);
  generateStoneSlab(scene);
  generateStreamTile(scene);
  generateTreasureMap(scene);
  generateSlash(scene);
  generateGlowOrb(scene);
  generateTempleDoor(scene);
}

// --- Helpers ---
function bake(scene, key, w, h, drawFn) {
  const g = scene.add.graphics({ x: 0, y: 0, add: false });
  drawFn(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

// --- Robey parts (drawn separately so we can rig them) ---
function generateRobeyParts(scene) {
  // Head: round face, BIG eyes, rosy cheeks, open smile, multi-spike hair.
  // Designed to read like the reference at small/medium screen sizes.
  bake(scene, 'robey-head', 80, 80, (g) => {
    // Face skin (drawn first as base)
    g.fillStyle(0xf6caa0, 1);
    g.fillCircle(40, 44, 26);
    // Hair back
    g.fillStyle(0x3a2418, 1);
    g.fillEllipse(40, 22, 56, 28);
    // Spiky hair tufts on top
    const spikes = [
      [14, 20], [22, 10], [30, 4], [40, 0], [50, 4], [58, 10], [66, 20],
    ];
    g.fillStyle(0x3a2418, 1);
    for (let i = 0; i < spikes.length - 1; i++) {
      const [x1, y1] = spikes[i];
      const [x2, y2] = spikes[i + 1];
      g.fillTriangle(x1, 26, x2, 26, (x1 + x2) / 2, Math.min(y1, y2) - 2);
    }
    // Side hair flicks
    g.fillTriangle(12, 30, 20, 22, 16, 36);
    g.fillTriangle(68, 30, 60, 22, 64, 36);
    // Cheeks (rosy)
    g.fillStyle(0xff8a8a, 0.7);
    g.fillCircle(20, 50, 7);
    g.fillCircle(60, 50, 7);
    // Eye whites - large, expressive
    g.fillStyle(0xffffff, 1);
    g.fillCircle(28, 42, 9);
    g.fillCircle(52, 42, 9);
    // Eye outlines
    g.lineStyle(2, 0x1a0e08, 1);
    g.strokeCircle(28, 42, 9);
    g.strokeCircle(52, 42, 9);
    // Pupils
    g.fillStyle(0x3a2418, 1);
    g.fillCircle(29, 43, 4);
    g.fillCircle(53, 43, 4);
    // Eye shines
    g.fillStyle(0xffffff, 1);
    g.fillCircle(30, 41, 1.6);
    g.fillCircle(54, 41, 1.6);
    // Eyebrows
    g.lineStyle(2.2, 0x1a0e08, 1);
    g.lineBetween(22, 32, 34, 30);
    g.lineBetween(46, 30, 58, 32);
    // Nose
    g.fillStyle(0xff7a59, 1);
    g.fillCircle(40, 52, 3.2);
    // Open smiling mouth with teeth
    g.fillStyle(0x1a0e08, 1);
    g.fillEllipse(40, 62, 18, 10);
    g.fillStyle(0xffffff, 1);
    g.fillRect(33, 58, 14, 4);
    g.lineStyle(1, 0xc05050, 1);
    g.lineBetween(34, 62, 46, 62);
    // Face outline
    g.lineStyle(2.2, 0x1a0e08, 1);
    g.strokeCircle(40, 44, 26);
  });

  // Torso: lighter green explorer shirt with dinosaur silhouettes + leaves
  bake(scene, 'robey-torso', 60, 64, (g) => {
    // Shirt body
    g.fillStyle(0x4ec06a, 1);
    g.fillRoundedRect(4, 4, 52, 58, 8);
    // Lighter shoulder caps
    g.fillStyle(0x6dd97a, 1);
    g.fillCircle(10, 10, 6);
    g.fillCircle(50, 10, 6);
    // V-collar with white tee underneath
    g.fillStyle(0xfff7d6, 1);
    g.fillTriangle(24, 4, 36, 4, 30, 16);
    g.lineStyle(1.6, 0x205c34, 1);
    g.strokeTriangle(24, 4, 36, 4, 30, 16);
    // Dinosaur silhouettes (tiny T-rex shapes - body + tail + tiny head)
    const dinos = [[14, 24], [38, 18], [22, 44], [42, 50]];
    g.fillStyle(0x205c34, 1);
    for (const [dx, dy] of dinos) {
      g.fillEllipse(dx, dy, 7, 4);
      g.fillTriangle(dx + 2, dy - 2, dx + 6, dy - 5, dx + 4, dy - 1);
      g.fillRect(dx - 5, dy - 1, 1.5, 3);
      g.fillRect(dx + 3, dy - 1, 1.5, 3);
    }
    // Leaf accents
    g.fillStyle(0x97e6a0, 1);
    g.fillEllipse(48, 30, 5, 3);
    g.fillEllipse(12, 36, 5, 3);
    g.fillEllipse(34, 38, 4, 2.6);
    // Chest pocket
    g.lineStyle(1.4, 0x205c34, 1);
    g.strokeRoundedRect(38, 28, 14, 12, 2);
    g.fillStyle(0xff7a3a, 1);
    g.fillCircle(45, 34, 1.8);
    // Outline
    g.lineStyle(2.4, 0x1a0e08, 1);
    g.strokeRoundedRect(4, 4, 52, 58, 8);
  });

  // Arm: short sleeve at top, skin tube below, hand bulb at bottom
  bake(scene, 'robey-arm', 18, 50, (g) => {
    g.fillStyle(0x4ec06a, 1);
    g.fillRoundedRect(2, 0, 14, 16, 4);
    g.fillStyle(0xf6caa0, 1);
    g.fillRoundedRect(3, 14, 12, 30, 5);
    g.fillCircle(9, 44, 6);
    g.lineStyle(1.6, 0x1a0e08, 1);
    g.strokeRoundedRect(2, 0, 14, 16, 4);
    g.strokeRoundedRect(3, 14, 12, 30, 5);
    g.strokeCircle(9, 44, 6);
  });

  // Leg: khaki cargo shorts + skin + sock + brown boot with laces
  bake(scene, 'robey-leg', 22, 60, (g) => {
    // Shorts
    g.fillStyle(0xc4a874, 1);
    g.fillRoundedRect(1, 0, 20, 24, 4);
    // Cargo pocket
    g.fillStyle(0xb89a64, 1);
    g.fillRoundedRect(13, 8, 7, 10, 1.5);
    g.lineStyle(1, 0x6b4a1a, 1);
    g.strokeRoundedRect(13, 8, 7, 10, 1.5);
    // Skin
    g.fillStyle(0xf6caa0, 1);
    g.fillRect(3, 22, 16, 14);
    // Sock band
    g.fillStyle(0xfff7d6, 1);
    g.fillRect(2, 36, 18, 4);
    // Boot
    g.fillStyle(0x6b3a1a, 1);
    g.fillRoundedRect(1, 39, 20, 18, 3);
    g.fillStyle(0x3a2010, 1);
    g.fillRect(1, 54, 20, 4);
    // Laces
    g.fillStyle(0xfff7d6, 1);
    for (let i = 0; i < 3; i++) g.fillRect(7, 43 + i * 3, 8, 1.4);
    // Outlines
    g.lineStyle(1.6, 0x1a0e08, 1);
    g.strokeRoundedRect(1, 0, 20, 24, 4);
    g.strokeRoundedRect(1, 39, 20, 18, 3);
  });
}

function generateMachete(scene) {
  bake(scene, 'machete', 60, 26, (g) => {
    // Wooden handle
    g.fillStyle(0x6b3a1a, 1);
    g.fillRoundedRect(0, 8, 22, 10, 3);
    // Pommel ring
    g.lineStyle(2, 0x3a2010, 1);
    g.strokeCircle(4, 13, 4);
    // Blade (toy wooden)
    g.fillStyle(0xc99056, 1);
    g.fillTriangle(22, 4, 58, 13, 22, 22);
    // Leaf decals
    g.fillStyle(0x3aa55a, 1);
    g.fillEllipse(34, 11, 8, 5);
    g.fillEllipse(46, 14, 6, 4);
    // Outlines
    g.lineStyle(2, 0x1a0e08, 1);
    g.strokeRoundedRect(0, 8, 22, 10, 3);
    g.strokeTriangle(22, 4, 58, 13, 22, 22);
  });
}

function generateMap(scene) {
  bake(scene, 'map-paper', 38, 30, (g) => {
    g.fillStyle(0xf2dba0, 1);
    g.fillRoundedRect(0, 0, 38, 30, 2);
    g.lineStyle(1.6, 0x6b4a1a, 1);
    g.strokeRoundedRect(0, 0, 38, 30, 2);
    // Dotted path
    g.fillStyle(0x3a2010, 1);
    for (let i = 0; i < 6; i++) g.fillCircle(6 + i * 5, 8 + (i % 2) * 6, 1);
    // X mark
    g.lineStyle(1.8, 0xc12020, 1);
    g.lineBetween(28, 18, 34, 24);
    g.lineBetween(34, 18, 28, 24);
  });
}

function generateFirefly(scene) {
  bake(scene, 'firefly', 14, 14, (g) => {
    g.fillStyle(0xfff7a8, 0.4);
    g.fillCircle(7, 7, 7);
    g.fillStyle(0xfff1a8, 0.8);
    g.fillCircle(7, 7, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(7, 7, 1.6);
  });
}

function generateBedroomBG(scene) {
  bake(scene, 'bg-bedroom', 800, 600, (g) => {
    // Wall
    g.fillStyle(0xf2c884, 1);
    g.fillRect(0, 0, 800, 460);
    // Floor
    g.fillStyle(0x8a5a36, 1);
    g.fillRect(0, 460, 800, 140);
    // Floorboard lines
    g.lineStyle(1, 0x4a3018, 0.8);
    for (let y = 480; y < 600; y += 20) g.lineBetween(0, y, 800, y);
    // Window
    g.fillStyle(0xa9d8ff, 1);
    g.fillRect(80, 90, 200, 160);
    g.lineStyle(6, 0xfff7d6, 1);
    g.strokeRect(80, 90, 200, 160);
    g.lineBetween(180, 90, 180, 250);
    g.lineBetween(80, 170, 280, 170);
    // Sun
    g.fillStyle(0xfff088, 1);
    g.fillCircle(220, 130, 22);
    // Bed
    g.fillStyle(0xc25a5a, 1);
    g.fillRect(420, 320, 320, 140);
    g.fillStyle(0xffd57a, 1);
    g.fillRect(420, 300, 320, 24);
    g.fillStyle(0xfff7d6, 1);
    g.fillRect(440, 280, 80, 50);
    // Toy chest
    g.fillStyle(0x6b3a1a, 1);
    g.fillRect(40, 360, 120, 100);
    g.lineStyle(3, 0x3a2010, 1);
    g.strokeRect(40, 360, 120, 100);
    g.lineBetween(40, 400, 160, 400);
    // Poster
    g.fillStyle(0xfff7d6, 1);
    g.fillRect(560, 80, 120, 140);
    g.fillStyle(0x3aa55a, 1);
    g.fillTriangle(580, 200, 660, 200, 620, 110);
    g.fillStyle(0xffd57a, 1);
    g.fillCircle(620, 120, 8);
  });
}

function generateJungleBG(scene) {
  // Three parallax layers
  bake(scene, 'bg-jungle-far', 800, 600, (g) => {
    // Sky gradient (golden)
    g.fillGradientStyle(0xffd57a, 0xffd57a, 0xffe9a8, 0xffe9a8, 1);
    g.fillRect(0, 0, 800, 380);
    // Distant tree silhouettes
    g.fillStyle(0x3a7a3a, 0.6);
    for (let i = 0; i < 8; i++) {
      const x = i * 110 + 30;
      g.fillTriangle(x, 380, x + 60, 380, x + 30, 230 + (i % 3) * 30);
    }
    g.fillRect(0, 380, 800, 40);
  });

  bake(scene, 'bg-jungle-mid', 800, 600, (g) => {
    // Mid trees, lusher
    g.fillStyle(0x1d6b3a, 0.85);
    for (let i = 0; i < 6; i++) {
      const x = i * 140 + 20;
      g.fillCircle(x, 320, 60);
      g.fillCircle(x + 30, 290, 50);
      g.fillCircle(x - 20, 300, 45);
      g.fillRect(x - 6, 320, 12, 80);
    }
  });

  bake(scene, 'bg-jungle-near', 800, 600, (g) => {
    // Foreground foliage drop-down vines
    g.fillStyle(0x205c34, 1);
    for (let i = 0; i < 5; i++) {
      const x = i * 180 + 60;
      g.fillEllipse(x, 30, 100, 50);
      g.fillEllipse(x + 70, 50, 80, 40);
    }
    // Hanging vines
    g.fillStyle(0x3aa55a, 1);
    for (let i = 0; i < 12; i++) {
      const x = 30 + i * 70;
      g.fillRect(x, 0, 4, 80 + (i % 3) * 30);
    }
  });
}

function generateTempleBG(scene) {
  bake(scene, 'bg-temple-far', 800, 600, (g) => {
    g.fillGradientStyle(0x1a1426, 0x1a1426, 0x0a0a14, 0x0a0a14, 1);
    g.fillRect(0, 0, 800, 600);
    // Distant pillars
    g.fillStyle(0x2d2530, 0.8);
    for (let i = 0; i < 5; i++) {
      const x = 80 + i * 160;
      g.fillRect(x, 200, 40, 280);
      g.fillRect(x - 8, 200, 56, 14);
    }
  });

  bake(scene, 'bg-temple-mid', 800, 600, (g) => {
    // Wall with carvings
    g.fillStyle(0x3a2c30, 0.9);
    g.fillRect(0, 0, 800, 600);
    // Stone block lines
    g.lineStyle(2, 0x1a1018, 0.6);
    for (let y = 40; y < 600; y += 60) g.lineBetween(0, y, 800, y);
    for (let y = 40; y < 600; y += 60) {
      const offset = (y / 60) % 2 === 0 ? 0 : 80;
      for (let x = offset; x < 800; x += 160) g.lineBetween(x, y, x, y + 60);
    }
    // Glowing eye carvings
    g.fillStyle(0xff5a3a, 0.9);
    for (let i = 0; i < 6; i++) {
      const x = 80 + i * 130;
      const y = 180 + (i % 2) * 80;
      g.fillEllipse(x, y, 14, 7);
      g.fillEllipse(x + 24, y, 14, 7);
      g.fillStyle(0x1a0e08, 1);
      g.fillCircle(x, y, 2.5);
      g.fillCircle(x + 24, y, 2.5);
      g.fillStyle(0xff5a3a, 0.9);
    }
  });

  bake(scene, 'bg-temple-near', 800, 600, (g) => {
    // Foreground broken stones
    g.fillStyle(0x141018, 1);
    g.fillRect(0, 540, 800, 60);
    for (let i = 0; i < 6; i++) {
      const x = i * 140 + 20;
      g.fillRect(x, 510, 80, 30);
    }
  });
}

function generateGroundTile(scene) {
  bake(scene, 'ground-jungle', 80, 60, (g) => {
    g.fillStyle(0x2a4a1a, 1);
    g.fillRect(0, 0, 80, 60);
    g.fillStyle(0x3aa55a, 1);
    g.fillRect(0, 0, 80, 14);
    g.fillStyle(0x6acc7a, 1);
    for (let i = 0; i < 4; i++) g.fillTriangle(i * 20, 14, i * 20 + 8, 0, i * 20 + 16, 14);
    g.lineStyle(1.5, 0x1a3010, 1);
    g.strokeRect(0, 0, 80, 60);
  });
  bake(scene, 'ground-temple', 80, 60, (g) => {
    g.fillStyle(0x2a242c, 1);
    g.fillRect(0, 0, 80, 60);
    g.fillStyle(0x4a3a44, 1);
    g.fillRect(0, 0, 80, 12);
    g.lineStyle(1.5, 0x0a0810, 1);
    g.strokeRect(0, 0, 80, 60);
    g.lineBetween(40, 0, 40, 60);
  });
}

function generatePlatform(scene) {
  bake(scene, 'platform-jungle', 160, 24, (g) => {
    g.fillStyle(0x6b4327, 1);
    g.fillRoundedRect(0, 6, 160, 18, 4);
    g.fillStyle(0x3aa55a, 1);
    g.fillRoundedRect(0, 0, 160, 10, 4);
    g.lineStyle(2, 0x1a0e08, 1);
    g.strokeRoundedRect(0, 0, 160, 24, 4);
  });
  bake(scene, 'platform-temple', 160, 24, (g) => {
    g.fillStyle(0x4a3a44, 1);
    g.fillRoundedRect(0, 0, 160, 24, 3);
    g.lineStyle(2, 0x0a0810, 1);
    g.strokeRoundedRect(0, 0, 160, 24, 3);
    g.lineBetween(80, 0, 80, 24);
  });
}

function generateVine(scene) {
  bake(scene, 'vine', 12, 200, (g) => {
    g.fillStyle(0x3aa55a, 1);
    g.fillRect(4, 0, 4, 200);
    g.fillStyle(0x6acc7a, 1);
    for (let i = 0; i < 8; i++) g.fillEllipse(i % 2 === 0 ? 2 : 10, 30 + i * 22, 6, 4);
  });
}

function generateShadowVine(scene) {
  bake(scene, 'shadow-vine', 24, 90, (g) => {
    g.fillStyle(0x0a0a14, 1);
    g.fillRect(8, 0, 8, 90);
    // Sharp leaves like fangs
    g.fillStyle(0x3a0a14, 1);
    for (let i = 0; i < 5; i++) {
      g.fillTriangle(0, 16 + i * 16, 12, 12 + i * 16, 12, 24 + i * 16);
      g.fillTriangle(24, 16 + i * 16, 12, 12 + i * 16, 12, 24 + i * 16);
    }
    // Glowing red eye at top
    g.fillStyle(0xff2020, 1);
    g.fillCircle(12, 6, 4);
    g.fillStyle(0xfff088, 1);
    g.fillCircle(12, 6, 1.4);
  });
}

function generateStoneSlab(scene) {
  bake(scene, 'stone-slab', 100, 30, (g) => {
    g.fillStyle(0x9a8a72, 1);
    g.fillRect(0, 0, 100, 30);
    g.fillStyle(0x6acc7a, 0.5);
    for (let i = 0; i < 4; i++) g.fillCircle(15 + i * 24, 6, 3);
    g.lineStyle(1.5, 0x4a3a2a, 1);
    g.strokeRect(0, 0, 100, 30);
  });
}

function generateStreamTile(scene) {
  bake(scene, 'stream', 200, 20, (g) => {
    g.fillStyle(0x6ad0f0, 1);
    g.fillRect(0, 0, 200, 20);
    g.fillStyle(0xffffff, 0.5);
    for (let i = 0; i < 6; i++) g.fillEllipse(20 + i * 32, 6, 14, 3);
  });
}

function generateTreasureMap(scene) {
  bake(scene, 'big-map', 220, 160, (g) => {
    g.fillStyle(0xf2dba0, 1);
    g.fillRoundedRect(0, 0, 220, 160, 6);
    g.lineStyle(3, 0x6b4a1a, 1);
    g.strokeRoundedRect(0, 0, 220, 160, 6);
    // Path
    g.lineStyle(3, 0x3a2010, 1);
    for (let i = 0; i < 12; i++) g.fillRect(20 + i * 14, 30 + Math.sin(i * 0.6) * 18, 4, 4);
    // X
    g.lineStyle(4, 0xc12020, 1);
    g.lineBetween(180, 110, 200, 130);
    g.lineBetween(200, 110, 180, 130);
    // Mountain
    g.fillStyle(0x4a7a3a, 1);
    g.fillTriangle(40, 130, 80, 130, 60, 90);
    // Tree
    g.fillStyle(0x3aa55a, 1);
    g.fillCircle(120, 90, 14);
  });
}

function generateSlash(scene) {
  bake(scene, 'slash', 90, 60, (g) => {
    g.fillStyle(0xffffff, 0.8);
    g.beginPath();
    g.arc(20, 30, 60, -0.7, 0.7, false);
    g.fillPath();
    g.lineStyle(3, 0xffffff, 1);
    g.strokePath();
  });
}

function generateGlowOrb(scene) {
  bake(scene, 'glow-orb', 40, 40, (g) => {
    g.fillStyle(0xfff088, 0.3);
    g.fillCircle(20, 20, 20);
    g.fillStyle(0xfff088, 0.7);
    g.fillCircle(20, 20, 12);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(20, 20, 5);
  });
}

function generateTempleDoor(scene) {
  bake(scene, 'temple-door', 80, 160, (g) => {
    g.fillStyle(0x2a1a14, 1);
    g.fillRoundedRect(0, 0, 80, 160, 6);
    g.fillStyle(0x4a2a1a, 1);
    g.fillRoundedRect(6, 6, 68, 148, 4);
    g.fillStyle(0xffd57a, 1);
    g.fillCircle(60, 80, 4);
    g.lineStyle(2, 0x0a0810, 1);
    g.strokeRoundedRect(0, 0, 80, 160, 6);
  });
}
