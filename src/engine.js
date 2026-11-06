// A procedural high-bypass turbofan built from named modules, so the page can
// open the cowls, pull the modules apart along the shaft and light each one.
import * as THREE from 'three';
import { M, lathe, smooth, bladeGeometry, bladeRing, polar, tube, spiralTexture } from './kit.js';

function mats(names) {
  const o = {}; for (const n of names) o[n] = M[n](); return o;
}

let LITE = false;
function rotorStage(group, m, { z, rIn, rOut, count, chord, twist = .95, material, thickDisk = .05, bolts = 0 }) {
  const disk = lathe([[.03, z - thickDisk], [rIn * .86, z - thickDisk], [rIn, z - thickDisk * .4], [rIn, z + thickDisk * .4], [rIn * .86, z + thickDisk], [.03, z + thickDisk]], m.dark, 72);
  group.add(disk);
  if (bolts) {
    group.add(lathe([[rIn * .3, z + thickDisk + .012], [rIn * .62, z + thickDisk + .012], [rIn * .66, z + thickDisk]], m.graphite || m.dark, 64));
    const b = new THREE.CylinderGeometry(rIn * .03, rIn * .03, .022, 8);
    group.add(polar(b, m.brass || m.polished || m.titanium, bolts, rIn * .48, z + thickDisk + .018, Math.PI / 2));
  }
  const g = bladeGeometry({ rootR: rIn * .98, tipR: rOut, rootChord: chord, tipChord: chord * .78, twistRoot: twist * .72, twistTip: twist * 1.12, thick: .13, camber: .1, segS: 7, segC: 5, belly: 0 });
  group.add(bladeRing(g, material, LITE ? Math.round(count * .62) : count, z));
}

function statorStage(group, { z, rIn, rOut, count, chord, material, keep }) {
  if (LITE && !keep) return;
  const g = bladeGeometry({ rootR: rIn, tipR: rOut, rootChord: chord, tipChord: chord, twistRoot: -.5, twistTip: -.42, thick: .12, camber: .06, segS: 4, segC: 4, belly: 0 });
  group.add(bladeRing(g, material, count, z, .05));
}

export function buildEngine({ lite = false } = {}) {
  LITE = lite;
  const engine = new THREE.Group();
  const modules = {};
  const add = (name, materials) => {
    const g = new THREE.Group(); g.name = name;
    g.userData.mats = materials; modules[name] = g; engine.add(g); return g;
  };

  // ----- Fan -----
  const mF = mats(['titanium', 'dark', 'polished', 'graphite', 'alu']);
  const spinTex = spiralTexture();
  const mSpinner = new THREE.MeshPhysicalMaterial({ map: spinTex, metalness: .1, roughness: .34, clearcoat: 1, clearcoatRoughness: .1, side: THREE.DoubleSide });
  mF.spinner = mSpinner;
  const fan = add('fan', mF);
  const rotor = new THREE.Group(); fan.add(rotor);
  const spinnerProfile = [];
  for (let i = 0; i <= 40; i++) { const k = i / 40; spinnerProfile.push([.31 * Math.pow(Math.sin(k * Math.PI / 2), .78), 1.02 - k * .62]); }
  rotor.add(lathe(spinnerProfile, mSpinner, 96));
  rotor.add(lathe(smooth([[.31, .4], [.335, .32], [.345, .12], [.36, .02], [.4, -.05]]), mF.alu, 96));
  const bladeGeo = bladeGeometry({ rootR: .3, tipR: .995, rootChord: .3, tipChord: .3, twistRoot: .36, twistTip: 1.12, sweep: -.1, lean: -.05, thick: .1, camber: .1, segS: 34, segC: 16, belly: .42 });
  bladeGeo.translate(0, 0, .2);
  const fanBlades = bladeRing(bladeGeo, mF.titanium, 22, 0);
  rotor.add(fanBlades);
  fan.userData.rotor = rotor;
  // Outlet guide vanes and splitter behind the fan.
  statorStage(fan, { z: -.32, rIn: .5, rOut: 1.02, count: 42, chord: .16, material: mF.dark, keep: true });
  fan.add(lathe(smooth([[.47, -.02], [.53, -.16], [.54, -.42], [.5, -.6]]), mF.graphite, 96));
  fan.add(lathe(smooth([[.385, -.05], [.42, -.2], [.43, -.45]]), mF.graphite, 96));
  fan.userData.anchor = new THREE.Vector3(0, 1.08, 0);

  // ----- Booster -----
  const mL = mats(['titanium', 'dark', 'graphite']);
  const lpc = add('lpc', mL);
  [[-.72, 58], [-.88, 62], [-1.04, 66]].forEach(([z, n], i) => {
    rotorStage(lpc, mL, { z, rIn: .34, rOut: .53 - i * .012, count: n, chord: .1, material: mL.titanium, bolts: i ? 0 : 18 });
    statorStage(lpc, { z: z - .08, rIn: .35, rOut: .525 - i * .012, count: n + 8, chord: .055, material: mL.dark });
  });
  lpc.add(lathe(smooth([[.34, -.62], [.345, -.85], [.335, -1.16]]), mL.dark, 72));
  lpc.userData.anchor = new THREE.Vector3(0, .62, -.88);

  // ----- High-pressure compressor -----
  const mH = mats(['titanium', 'dark', 'polished', 'graphite', 'alu']);
  const hpc = add('hpc', mH);
  const hStages = 9;
  for (let i = 0; i < hStages; i++) {
    const k = i / (hStages - 1), z = -1.28 - k * .92;
    const rOut = .4 - k * .085, rIn = .255 + k * .035;
    rotorStage(hpc, mH, { z, rIn, rOut, count: 72 + i * 2, chord: .075 - k * .025, twist: 1, material: i % 2 ? mH.polished : mH.titanium, thickDisk: .03, bolts: i ? 0 : 16 });
    statorStage(hpc, { z: z - .05, rIn: rIn * 1.03, rOut: rOut * .99, count: 80 + i * 2, chord: .03, material: mH.dark });
  }
  hpc.add(lathe(smooth([[.26, -1.2], [.27, -1.7], [.295, -2.28]]), mH.dark, 72));
  hpc.userData.anchor = new THREE.Vector3(0, .5, -1.74);

  // ----- Combustor -----
  const mC = mats(['copper', 'brass', 'dark', 'alu', 'nickel']);
  const combustor = add('combustor', mC);
  combustor.add(lathe(smooth([[.3, -2.34], [.36, -2.38], [.42, -2.5], [.43, -2.68], [.385, -2.86], [.34, -2.94]]), mC.copper, 128));
  combustor.add(lathe(smooth([[.23, -2.36], [.24, -2.6], [.27, -2.92]]), mC.nickel, 72));
  const nozzle = new THREE.CylinderGeometry(.016, .016, .22, 12);
  combustor.add(polar(nozzle, mC.alu, 24, .46, -2.44, Math.PI / 2 - .35));
  const flange = new THREE.CylinderGeometry(.03, .03, .012, 12);
  combustor.add(polar(flange, mC.brass, 24, .47, -2.44));
  for (const z of [-2.54, -2.66, -2.78]) combustor.add(lathe([[.436, z - .006], [.446, z], [.436, z + .006]], mC.brass, 128));
  // Fuel manifold: a hand-routed ring of tube.
  const ring = []; for (let i = 0; i <= 80; i++) { const a = i / 80 * Math.PI * 2; ring.push([Math.cos(a) * .495, Math.sin(a) * .495, -2.5 + Math.sin(a * 12) * .006]); }
  combustor.add(tube(ring, .009, mC.brass, 240, 8));
  combustor.userData.anchor = new THREE.Vector3(0, .56, -2.64);

  // ----- High-pressure turbine -----
  const mT = mats(['nickel', 'dark', 'brass', 'graphite']);
  const hpt = add('hpt', mT);
  [-3.05, -3.2].forEach((z, i) => {
    rotorStage(hpt, mT, { z, rIn: .285, rOut: .385 + i * .02, count: 74, chord: .075, twist: .62, material: mT.nickel, thickDisk: .04, bolts: 16 });
    statorStage(hpt, { z: z + .07, rIn: .3, rOut: .38 + i * .02, count: 40, chord: .05, material: mT.brass });
  });
  hpt.userData.anchor = new THREE.Vector3(0, .5, -3.12);

  // ----- Low-pressure turbine -----
  const mP = mats(['nickel', 'dark', 'graphite', 'titanium']);
  const lpt = add('lpt', mP);
  for (let i = 0; i < 6; i++) {
    const z = -3.42 - i * .14, rOut = .47 + i * .05;
    rotorStage(lpt, mP, { z, rIn: .3, rOut, count: 96 + i * 6, chord: .08, twist: .9, material: mP.nickel, thickDisk: .03, bolts: i ? 0 : 18 });
    statorStage(lpt, { z: z - .07, rIn: .31, rOut: rOut - .01, count: 110 + i * 6, chord: .04, material: mP.dark });
  }
  lpt.userData.anchor = new THREE.Vector3(0, .84, -3.8);

  // ----- Exhaust -----
  const mE = mats(['polished', 'alu', 'dark', 'nickel']);
  const exhaust = add('exhaust', mE);
  exhaust.add(lathe(smooth([[.26, -4.3], [.31, -4.5], [.29, -4.8], [.16, -5.12], [.015, -5.3]]), mE.polished, 96));
  exhaust.add(lathe(smooth([[.76, -4.28], [.74, -4.55], [.66, -4.86]]), mE.alu, 128));
  statorStage(exhaust, { z: -4.36, rIn: .3, rOut: .75, count: 18, chord: .1, material: mE.dark, keep: true });
  exhaust.userData.anchor = new THREE.Vector3(0, .85, -4.6);

  // ----- Shaft, always on the axis -----
  const mS = mats(['polished', 'graphite']);
  const shaft = add('shaft', mS);
  shaft.add(lathe([[.04, .1], [.04, -7.4]], mS.polished, 32));

  // ----- Nacelle: inlet is fixed, the two cowl halves open -----
  const mN = mats(['satin', 'liner', 'polished', 'graphite', 'alu']);
  const inletOuter = smooth([[1.075, .86], [1.125, .84], [1.185, .74], [1.235, .56], [1.265, .36], [1.28, .22]], 60);
  const inletLip = smooth([[1.05, .8], [1.075, .86], [1.125, .84]], 18);
  const inletInner = smooth([[1.05, .8], [1.03, .62], [1.02, .42], [1.02, .24]], 40);
  const nacelleProf = [inletOuter, inletLip, inletInner];
  const cowlOuter = smooth([[1.28, .22], [1.285, -.3], [1.255, -.95], [1.14, -1.65], [1.02, -2.1]], 60);
  const cowlInner = smooth([[1.02, .24], [1.02, -.48], [.92, -1.25], [.82, -2.1]], 40);
  const coreCowl = smooth([[.82, -2.1], [.87, -2.5], [.86, -3.3], [.8, -3.95], [.7, -4.55]], 50);
  const halves = [];
  for (const [i, phi] of [[0, 0], [1, Math.PI]]) {
    const half = new THREE.Group();
    const seg = 96;
    half.add(lathe(nacelleProf[0], mN.satin, seg, phi, Math.PI));
    half.add(lathe(nacelleProf[1], mN.polished, seg, phi, Math.PI));
    half.add(lathe(nacelleProf[2], mN.liner, seg, phi, Math.PI));
    half.add(lathe(cowlOuter, mN.satin, seg, phi, Math.PI));
    half.add(lathe(coreCowl, mN.satin, seg, phi, Math.PI));
    half.add(lathe(cowlInner, mN.liner, seg, phi, Math.PI));
    half.userData.dir = i === 0 ? 1 : -1;
    halves.push(half);
  }
  const nacelle = add('nacelle', mN);
  // The lathe seam sits on the X axis after rotation, so the halves part up and down.
  halves.forEach(h => nacelle.add(h));
  nacelle.userData.halves = halves;

  // Explode offsets along the shaft, in world units at explode = 1.
  const offset = { fan: 1.8, lpc: 1, hpc: .3, combustor: -.4, hpt: -.9, lpt: -1.5, exhaust: -2.4, shaft: 0, nacelle: 0 };

  const sync = (explode, open, focus) => {
    for (const [name, g] of Object.entries(modules)) {
      g.position.z = (offset[name] || 0) * explode;
      const lit = focus[name] ?? 1;
      for (const k in g.userData.mats) g.userData.mats[k].envMapIntensity = lit;
    }
    engine.scale.z = .74 + .26 * Math.min(open, 1);
    modules.shaft.scale.z = .6 + .4 * explode;
    nacelle.visible = open < .995;
    halves.forEach(h => { h.position.y = h.userData.dir * open * 3.6; h.position.z = open * .4; });
  };

  return { engine, modules, rotor, sync, offset };
}

// Camera choreography, in keyframes along the pinned scroll.
export const FOV = 22;
export const CAM = [
  { p: 0,    pos: [0, 1.05, 5.75],    tgt: [0, 1.68, .6],   explode: 0, open: 0 },
  { p: .12,  pos: [0, 0, 9],          tgt: [0, 0, 0],       explode: 0, open: 0 },
  { p: .26,  pos: [6.4, 1.6, 6.6],    tgt: [0, 0, -.5],     explode: 0, open: 0, sh: 1.42, my: 1 },
  { p: .38,  pos: [12.5, 1.5, 1],     tgt: [0, 0, -1.7],    explode: 0, open: 1 },
  { p: .5,   pos: [18, 2.8, 0],       tgt: [0, -.55, -2.42], explode: 1, open: 1 },
  { p: .58,  pos: [6.4, 1.7, 7.6],    tgt: [0, .25, 2.05],  explode: 1, open: 1, focus: 'fan', sh: 1.55, my: -1 },
  { p: .68,  pos: [4.9, 1.6, 1.4],    tgt: [0, .25, -1.44], explode: 1, open: 1, focus: 'hpc', sh: 1, my: -1 },
  { p: .78,  pos: [4.1, 1.3, -1.5],   tgt: [0, .22, -3.04], explode: 1, open: 1, focus: 'combustor', sh: 1, my: -1 },
  { p: .88,  pos: [5.4, 1.6, -3],     tgt: [0, .25, -4.9],  explode: 1, open: 1, focus: 'lpt', sh: 1.15, my: -1 },
  { p: .925, pos: [5.4, 1.6, -3],     tgt: [0, .25, -4.9],  explode: 1, open: 1, focus: 'lpt', sh: 1.15, my: -1 },
  { p: 1,    pos: [20, 2.8, 2],       tgt: [0, 0, -2.4],    explode: 1, open: 1 },
];
const FOCUS_SET = { fan: ['fan', 'lpc'], hpc: ['hpc'], combustor: ['combustor'], lpt: ['hpt', 'lpt'] };

const ease = t => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;

export function sampleCam(p) {
  let i = 0;
  while (i < CAM.length - 2 && p > CAM[i + 1].p) i++;
  const a = CAM[i], b = CAM[i + 1];
  const t = ease(Math.min(Math.max((p - a.p) / (b.p - a.p), 0), 1));
  const focus = {};
  const names = ['fan', 'lpc', 'hpc', 'combustor', 'hpt', 'lpt', 'exhaust', 'shaft', 'nacelle'];
  const litFor = (k, n) => !k.focus ? 1 : FOCUS_SET[k.focus].includes(n) ? 1.25 : .13;
  for (const n of names) focus[n] = mix(litFor(a, n), litFor(b, n), t);
  return {
    pos: a.pos.map((v, j) => mix(v, b.pos[j], t)),
    tgt: a.tgt.map((v, j) => mix(v, b.tgt[j], t)),
    explode: mix(a.explode, b.explode, t), open: mix(a.open, b.open, t), focus,
    sh: mix(a.sh || 0, b.sh || 0, t), my: mix(a.my || 0, b.my || 0, t),
  };
}
