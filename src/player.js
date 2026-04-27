import * as THREE from 'three';

// A stylized placeholder Dooby: rounded body, big head, big eyes.
// Built as a Group so it can later be swapped for a GLTF-rigged model
// without changing physics/control logic.
export function createDooby() {
  const root = new THREE.Group();
  root.name = 'Dooby';

  const skin = new THREE.MeshStandardMaterial({
    color: 0xffd9a0, roughness: 0.55, metalness: 0.0,
  });
  const belly = new THREE.MeshStandardMaterial({
    color: 0xfff1d6, roughness: 0.6,
  });
  const eyeWhite = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.3,
  });
  const eyePupil = new THREE.MeshStandardMaterial({
    color: 0x141014, roughness: 0.2,
  });

  // Body (slightly squashed sphere)
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), skin);
  body.scale.set(1, 0.95, 1);
  body.position.y = 0.55;
  body.castShadow = true;
  root.add(body);

  // Belly patch
  const bellyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), belly);
  bellyMesh.scale.set(0.85, 0.85, 0.45);
  bellyMesh.position.set(0, 0.5, 0.25);
  root.add(bellyMesh);

  // Head
  const head = new THREE.Group();
  head.position.y = 1.25;
  root.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.45, 24, 18), skin);
  skull.castShadow = true;
  head.add(skull);

  // Ears
  const ear = new THREE.SphereGeometry(0.13, 12, 10);
  const earL = new THREE.Mesh(ear, skin);
  earL.position.set(-0.34, 0.3, -0.05);
  const earR = earL.clone();
  earR.position.x = 0.34;
  head.add(earL, earR);

  // Eyes
  const eyeGeom = new THREE.SphereGeometry(0.13, 14, 12);
  const eyeL = new THREE.Mesh(eyeGeom, eyeWhite);
  eyeL.position.set(-0.16, 0.04, 0.36);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.16;
  head.add(eyeL, eyeR);

  const pupilGeom = new THREE.SphereGeometry(0.06, 12, 10);
  const pupilL = new THREE.Mesh(pupilGeom, eyePupil);
  pupilL.position.set(-0.16, 0.04, 0.46);
  const pupilR = pupilL.clone();
  pupilR.position.x = 0.16;
  head.add(pupilL, pupilR);

  // Nose
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.4 })
  );
  nose.position.set(0, -0.1, 0.46);
  head.add(nose);

  // Legs
  const legGeom = new THREE.CylinderGeometry(0.13, 0.16, 0.35, 12);
  const legL = new THREE.Mesh(legGeom, skin);
  legL.position.set(-0.22, 0.18, 0);
  legL.castShadow = true;
  const legR = legL.clone();
  legR.position.x = 0.22;
  root.add(legL, legR);

  // Animation refs
  root.userData = {
    head, eyeL, eyeR, pupilL, pupilR, legL, legR, body,
  };

  return root;
}

// Simple bobbing/leg swing tied to ground speed; eye dilation tied to mood.
export function animateDooby(dooby, dt, speed, fearLevel = 0) {
  const ud = dooby.userData;
  const t = performance.now() / 1000;

  const stride = Math.min(speed / 4, 1);
  const swing = Math.sin(t * 12) * 0.4 * stride;
  ud.legL.rotation.x = swing;
  ud.legR.rotation.x = -swing;

  ud.body.position.y = 0.55 + Math.abs(Math.sin(t * 12)) * 0.04 * stride;

  // Subtle head turn, more nervous as fear rises.
  const nervous = fearLevel * (Math.sin(t * 6) * 0.4 + Math.sin(t * 9.3) * 0.2);
  ud.head.rotation.y = nervous;
  ud.head.rotation.x = -fearLevel * 0.15;

  // Pupil dilation: shrink in fear (more white showing), dart side to side.
  const pupilScale = 1 - fearLevel * 0.4;
  ud.pupilL.scale.setScalar(pupilScale);
  ud.pupilR.scale.setScalar(pupilScale);
  const dart = Math.sin(t * 4) * fearLevel * 0.04;
  ud.pupilL.position.x = -0.16 + dart;
  ud.pupilR.position.x = 0.16 + dart;
}
