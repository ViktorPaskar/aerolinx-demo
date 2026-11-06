// Procedural studio models for the catalogue. Rendered once to WebP at build time.
import * as THREE from 'three';
import { M, lathe, smooth, bladeGeometry, polar, tube, rbox } from './kit.js';
import { plate, MODELS2 } from './parts2.js';

const G = (...c) => { const g = new THREE.Group(); c.forEach(x => g.add(x)); return g; };
const cyl = (r, h, mat, seg = 48) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
const at = (m, x, y, z, rx = 0, ry = 0, rz = 0) => { m.position.set(x, y, z); m.rotation.set(rx, ry, rz); return m; };

function wheelTyre() {
  const rub = M.rubber(), al = M.alu(), dk = M.dark(), pol = M.polished();
  // Tyre section with circumferential grooves.
  const prof = [];
  const R = 1, W = .46;
  for (let i = 0; i <= 120; i++) {
    const t = i / 120, a = -Math.PI * .5 + t * Math.PI;
    let r = .66 + .34 * Math.cos(a), z = W * Math.sin(a);
    const flat = Math.abs(Math.sin(a));
    if (flat < .62) { r = R - .008; z = W * (2 * t - 1) * 1.02 * .68 / .68; z = W * Math.sin(a) * 1.08; const g = Math.abs(z); if ([.07, .2, .33].some(c => Math.abs(g - c) < .018)) r -= .022; }
    prof.push([r, z]);
  }
  const tyre = lathe(prof, rub, 180);
  const rim = lathe(smooth([[.66, .34], [.69, .3], [.66, .2], [.64, .03], [.56, -.02], [.3, -.03], [.2, .08], [.2, .22]], 70), al, 128);
  const rimB = lathe(smooth([[.66, -.34], [.69, -.3], [.66, -.2], [.64, -.03]], 30), al, 128);
  const hub = lathe(smooth([[.09, .26], [.2, .26], [.22, .2], [.23, .08]], 24), pol, 72);
  const bolts = polar(new THREE.CylinderGeometry(.016, .016, .05, 10), pol, 14, .29, .0, Math.PI / 2);
  const vents = polar(new THREE.CylinderGeometry(.044, .044, .012, 20), dk, 12, .45, -.02, Math.PI / 2);
  return G(tyre, rim, rimB, hub, bolts, vents);
}

function brake(gold = false) {
  const cb = M.carbon(), pol = M.polished(), dk = M.dark(), acc = gold ? M.brass() : M.alu();
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const z = -.36 + i * .1;
    const mat = cb;
    g.add(lathe([[.5, z - .04], [.92, z - .04], [.92, z + .04], [.5, z + .04], [.5, z - .04]], mat, 128));
    g.add(polar(new THREE.BoxGeometry(.06, .05, .07), dk, 16, i % 2 ? .95 : .48, z));
  }
  g.add(lathe(smooth([[.54, -.42], [.6, -.44], [.62, .34], [.74, .42], [.98, .46], [.98, .58], [.54, .58], [.46, .46]], 90), acc, 128));
  const piston = lathe(smooth([[.0, .72], [.075, .72], [.09, .68], [.09, .56]], 18), pol, 32);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, p = piston.clone(); p.position.set(Math.cos(a) * .78, Math.sin(a) * .78, 0); g.add(p); }
  g.add(lathe([[.44, -.46], [.5, -.46], [.5, .62], [.44, .62]], pol, 96));
  g.add(tube([[.76, .62, .66], [.9, .95, .6], [.6, 1.15, .42], [.2, 1.2, .3]], .018, pol));
  return g;
}

function fanBlade() {
  const ti = M.titanium(); ti.roughness = .32;
  const g = bladeGeometry({ rootR: 0, tipR: 2.1, rootChord: .62, tipChord: .66, twistRoot: .32, twistTip: 1.15, sweep: -.28, lean: -.14, thick: .13, camber: .1, segS: 60, segC: 24, belly: .42 });
  const blade = new THREE.Mesh(g, ti);
  const root = new THREE.Mesh(rbox(.42, .16, .86, .02), ti);
  root.position.set(0, -.08, .03); root.rotation.y = .32;
  const dove = new THREE.Mesh(rbox(.58, .12, .86, .02), ti);
  dove.position.set(0, -.2, .03); dove.rotation.y = .32;
  const out = G(blade, root, dove); out.position.y = -.95; return G(out);
}

function turbineBlade() {
  const ni = M.nickel(); ni.roughness = .24;
  const g = bladeGeometry({ rootR: 0, tipR: 1.15, rootChord: .78, tipChord: .68, twistRoot: .55, twistTip: .95, thick: .32, camber: .34, segS: 30, segC: 24, belly: 0, sweep: -.04 });
  const blade = new THREE.Mesh(g, ni);
  const shroud = new THREE.Mesh(rbox(.86, .05, .86, .012), ni); shroud.position.set(.02, 1.17, 0); shroud.rotation.y = .9;
  const plat = new THREE.Mesh(rbox(.86, .06, .92, .012), ni); plat.position.set(0, -.02, 0); plat.rotation.y = .55;
  const root = new THREE.Group();
  [[.46, -.12], [.34, -.24], [.25, -.36], [.16, -.48]].forEach(([w, y]) => { const b = new THREE.Mesh(rbox(w, .1, .78, .016), ni); b.position.y = y; root.add(b); });
  root.rotation.y = .55;
  const holes = polar(new THREE.CylinderGeometry(.008, .008, .02, 6), M.graphite(), 1, 0);
  const out = G(blade, shroud, plat, root, holes); out.position.y = -.42; return G(out);
}

function displayTexture() {
  const c = document.createElement('canvas'); c.width = 800; c.height = 1000;
  const x = c.getContext('2d');
  x.fillStyle = '#030406'; x.fillRect(0, 0, 800, 1000);
  // Attitude ball
  x.save(); x.beginPath(); x.rect(170, 140, 460, 460); x.clip();
  x.translate(400, 370); x.rotate(-.1);
  const sky = x.createLinearGradient(0, -400, 0, 0); sky.addColorStop(0, '#0f5fd6'); sky.addColorStop(1, '#4d9bff');
  x.fillStyle = sky; x.fillRect(-500, -500, 1000, 500);
  const gr = x.createLinearGradient(0, 0, 0, 400); gr.addColorStop(0, '#a4642f'); gr.addColorStop(1, '#55300f');
  x.fillStyle = gr; x.fillRect(-500, 0, 1000, 500);
  x.strokeStyle = '#fff'; x.lineWidth = 4; x.beginPath(); x.moveTo(-500, 0); x.lineTo(500, 0); x.stroke();
  x.lineWidth = 3; for (let i = -3; i <= 3; i++) { if (!i) continue; const w = i % 2 ? 40 : 80; x.beginPath(); x.moveTo(-w, i * 50); x.lineTo(w, i * 50); x.stroke(); }
  x.restore();
  x.strokeStyle = '#ffd34d'; x.lineWidth = 11; x.beginPath(); x.moveTo(265, 370); x.lineTo(345, 370); x.lineTo(345, 395); x.moveTo(535, 370); x.lineTo(455, 370); x.lineTo(455, 395); x.stroke();
  x.fillStyle = '#ffd34d'; x.fillRect(391, 361, 18, 18);
  // Speed and altitude tapes
  x.fillStyle = '#1b222c'; x.fillRect(40, 140, 110, 460); x.fillRect(650, 140, 110, 460);
  x.font = '600 30px Arial'; x.fillStyle = '#e9eef6'; x.textAlign = 'center';
  [280, 260, 240, 220, 200].forEach((v, i) => x.fillText(v, 95, 200 + i * 90));
  [380, 370, 360, 350, 340].forEach((v, i) => x.fillText(v * 100, 705, 200 + i * 90));
  x.strokeStyle = '#54e38e'; x.lineWidth = 5; x.strokeRect(36, 340, 118, 58); x.strokeRect(646, 340, 118, 58);
  // Compass arc and upper band
  x.strokeStyle = '#d7deea'; x.lineWidth = 4; x.beginPath(); x.arc(400, 980, 300, Math.PI * 1.15, Math.PI * 1.85); x.stroke();
  x.fillStyle = '#54e38e'; x.font = '600 34px Arial'; x.fillText('LNAV', 200, 80); x.fillText('VNAV', 400, 80); x.fillText('CMD', 600, 80);
  x.fillStyle = '#e9eef6'; x.font = '600 40px Arial'; x.fillText('270', 400, 760);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function display() {
  const body = new THREE.Mesh(rbox(1.5, 1.86, .34, .05), M.graphite());
  const tex = displayTexture();
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 1.45), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: .9, roughness: .12, metalness: 0, name: 'screen' }));
  screen.position.z = .192;
  const trim = new THREE.Mesh(rbox(1.2, 1.5, .02, .008), new THREE.MeshStandardMaterial({ color: 0x050506, roughness: .3 }));
  trim.position.z = .172;
  const g = G(body, trim, screen);
  const key = rbox(.075, .05, .03, .008, 2), kMat = M.alu();
  for (let i = 0; i < 6; i++) {
    const y = .62 - i * .25;
    for (const x of [-.665, .665]) g.add(at(new THREE.Mesh(key, kMat), x, y, .17));
  }
  const rear = new THREE.Mesh(rbox(1.2, 1.4, .7, .04), M.dark()); rear.position.z = -.48; g.add(rear);
  for (let i = 0; i < 9; i++) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.22, .02, .6), M.graphite()), 0, -.55 + i * .14, -.5));
  return g;
}

function pump(accent = 'alu', fuel = false) {
  const body = M[accent](), al = M.alu(), pol = M.polished(), dk = M.dark();
  const g = new THREE.Group();
  g.add(lathe(smooth([[.0, 1.2], [.1, 1.2], [.13, 1.1], [.13, .86]], 16), pol, 32));
  g.add(lathe([[.13, .9], [.52, .9], [.56, .86], [.56, .78], [.3, .76]], al, 96));
  g.add(lathe(smooth([[.3, .78], [.42, .7], [.48, .44], [.52, .08], [.52, -.5], [.46, -.74], [.3, -.86], [0, -.88]], 80), body, 96));
  g.add(polar(new THREE.CylinderGeometry(.03, .03, .04, 12), pol, 10, .47, .885, Math.PI / 2));
  for (let i = 0; i < (fuel ? 4 : 6); i++) g.add(lathe([[.52, .02 - i * .09], [.545, .02 - i * .09 - .02], [.545, -.02 - i * .09], [.52, -.04 - i * .09]], fuel ? dk : al, 96));
  const port = (x, y, z, ry, r = .16) => {
    const p = G(cyl(r, .34, al), at(cyl(r * 1.45, .05, pol), 0, .17, 0));
    p.position.set(x, y, z); p.rotation.set(0, ry, Math.PI / 2 * -1); return p;
  };
  g.add(port(.62, .3, 0, 0)); g.add(port(-.6, -.28, 0, Math.PI, .12));
  const conn = cyl(.12, .3, M.brass()); conn.position.set(.1, -.3, .56); conn.rotation.x = Math.PI / 2; g.add(conn);
  g.add(tube([[.62, .3, .16], [.72, .5, .4], [.4, .68, .5], [.2, .74, .46]], .022, pol));
  const pl = plate(fuel ? ['FUEL BOOST PUMP', 'P/N FP-6120', 'S/N 77341'] : ['HYDRAULIC PUMP', 'P/N HP-30772', 'S/N 40918']);
  pl.rotation.x = Math.PI / 2 * -1; pl.position.set(0, .532, -.3); pl.rotation.order = 'YXZ'; g.add(pl);
  return g;
}

function valve() {
  const al = M.alu(), pol = M.polished(), dk = M.dark(), br = M.brass();
  const g = new THREE.Group();
  const prof = [[.62, -.34], [.84, -.34], [.84, -.27], [.68, -.25], [.68, .25], [.84, .27], [.84, .34], [.62, .34], [.62, -.34]];
  g.add(lathe(prof, al, 128));
  g.add(polar(new THREE.CylinderGeometry(.034, .034, .72, 10), pol, 14, .77, 0, Math.PI / 2));
  const disc = lathe([[0, .022], [.61, .012], [.61, -.012], [0, -.022]], M.nickel(), 96);
  disc.rotation.y = .62; g.add(disc);
  g.add(at(cyl(.035, 1.3, pol), 0, 0, 0));
  g.add(at(cyl(.12, .3, al), 0, .84, 0));
  const act = new THREE.Mesh(rbox(.86, .56, .62, .05), dk); act.position.set(.2, 1.26, 0); g.add(act);
  g.add(at(cyl(.2, .34, M.alu()), -.42, 1.26, 0, 0, 0, Math.PI / 2));
  g.add(at(cyl(.09, .22, br), .42, 1.6, 0));
  g.add(tube([[.56, 1.06, .2], [.92, .78, .3], [.95, .3, .36], [.86, .02, .28]], .02, pol));
  const pl = plate(['BLEED AIR VALVE', 'P/N BV-3290', 'S/N 11872'], .42, .22); pl.position.set(.24, 1.26, .316); g.add(pl);
  g.position.y = -.42;
  return G(g);
}

function starter() {
  const al = M.alu(), pol = M.polished(), dk = M.dark();
  const g = new THREE.Group();
  g.add(lathe(smooth([[.0, -1.05], [.28, -1.05], [.4, -.95], [.46, -.7], [.46, .24]], 40), dk, 96));
  for (let i = 0; i < 14; i++) { const z = -.68 + i * .06; g.add(lathe([[.46, z], [.51, z + .012], [.51, z + .03], [.46, z + .042]], M.graphite(), 96)); }
  g.add(lathe(smooth([[.46, .24], [.52, .3], [.46, .48], [.28, .68], [.24, .9]], 40), al, 96));
  g.add(lathe([[.52, .28], [.66, .3], [.66, .36], [.46, .4]], al, 96));
  g.add(polar(new THREE.CylinderGeometry(.024, .024, .05, 10), pol, 12, .6, .37, Math.PI / 2));
  g.add(lathe([[.1, .9], [.1, 1.34]], pol, 48));
  for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; g.add(at(new THREE.Mesh(new THREE.BoxGeometry(.014, .03, .36), pol), Math.cos(a) * .102, Math.sin(a) * .102, 1.16, 0, 0, a)); }
  const box = new THREE.Mesh(rbox(.42, .22, .56, .03), M.alu()); box.position.set(0, .54, -.22); g.add(box);
  g.add(at(cyl(.09, .18, M.brass()), .12, .72, -.32));
  g.add(at(cyl(.09, .18, M.brass()), -.12, .72, -.1));
  const pl = plate(['APU STARTER MOTOR', 'P/N SM-9014', '28 V DC'], .3, .18); pl.position.set(.215, .54, -.22); pl.rotation.y = Math.PI / 2; g.add(pl);
  g.rotation.y = Math.PI / 2; g.scale.setScalar(.92);
  return G(g);
}

function actuator() {
  const al = M.alu(), pol = M.polished(), dk = M.dark();
  const g = new THREE.Group();
  g.add(lathe(smooth([[.0, -1.34], [.2, -1.34], [.25, -1.24], [.25, .24], [.2, .3]], 30), dk, 72));
  for (const z of [-1.12, -.1, .12]) g.add(lathe([[.25, z], [.285, z + .01], [.285, z + .06], [.25, z + .07]], al, 72));
  g.add(lathe([[.1, .3], [.1, 1.14]], pol, 48));
  g.add(lathe([[.2, .28], [.2, .36], [.1, .4]], al, 48));
  const eye = (z, mat) => {
    const e = new THREE.Mesh(new THREE.TorusGeometry(.12, .065, 20, 56), mat); e.position.z = z; e.rotation.y = Math.PI / 2; return e;
  };
  g.add(eye(1.28, al)); g.add(eye(-1.5, al));
  g.add(at(cyl(.07, .15, pol), 0, 0, 1.28, 0, 0, Math.PI / 2)); g.add(at(cyl(.07, .15, pol), 0, 0, -1.5, 0, 0, Math.PI / 2));
  const man = new THREE.Mesh(rbox(.34, .2, .62, .03), al); man.position.set(0, .3, -.5); g.add(man);
  g.add(at(cyl(.06, .18, M.brass()), .06, .46, -.68)); g.add(at(cyl(.06, .18, M.brass()), .06, .46, -.32));
  g.add(tube([[.06, .55, -.32], [.32, .5, 0], [.32, .3, .3], [.2, .15, .2]], .018, pol));
  const pl = plate(['FLAP ACTUATOR', 'P/N AC-5561-3', 'S/N 6620'], .26, .14); pl.position.set(0, .402, -.5); pl.rotation.set(-Math.PI / 2, 0, Math.PI / 2); g.add(pl);
  g.rotation.y = Math.PI / 2;
  return G(g);
}

function landingLight() {
  const pol = M.polished(), al = M.dark();
  const g = new THREE.Group();
  g.add(lathe(smooth([[.95, .2], [.98, .1], [.96, -.26], [.7, -.5], [.3, -.58], [0, -.6]], 50), al, 128));
  g.add(lathe(smooth([[.92, .16], [.75, -.02], [.4, -.26], [.14, -.34]], 40), pol, 128));
  g.add(lathe([[.92, .24], [1, .22], [1, .14], [.93, .12]], M.alu(), 128));
  const led = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2dc, emissiveIntensity: 1.05 });
  const die = new THREE.CylinderGeometry(.044, .056, .03, 24);
  const rings = [[.16, 6, -.26], [.38, 12, -.13], [.6, 18, -.0]];
  for (const [r, n, z] of rings) { g.add(polar(die, led, n, r, z, Math.PI / 2)); g.add(polar(new THREE.CylinderGeometry(.1, .1, .012, 24), M.graphite(), n, r, z - .018, Math.PI / 2)); }
  g.add(at(cyl(.06, .03, led), 0, 0, -.31, Math.PI / 2));
  led.name = 'led';
  const glass = lathe(smooth([[.96, .2], [.7, .32], [.3, .38], [0, .4]], 30), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: .02, transparent: true, opacity: .1, clearcoat: 1, side: THREE.DoubleSide, name: 'glass' }), 96);
  g.add(glass);
  g.add(polar(new THREE.CylinderGeometry(.024, .024, .05, 10), M.polished(), 12, .96, .2, Math.PI / 2));
  return g;
}

function pitot() {
  const pol = M.polished(); pol.roughness = .13;
  const g = new THREE.Group();
  const base = lathe(smooth([[.0, .06], [.6, .06], [.68, .02], [.68, -.04], [0, -.04]], 24), M.alu(), 96);
  base.rotation.x = Math.PI / 2; g.add(base);
  const bolts = polar(new THREE.CylinderGeometry(.03, .03, .03, 10), M.dark(), 8, .56, .07, Math.PI / 2);
  bolts.rotation.x = Math.PI / 2; g.add(bolts);
  // Mast: an aerofoil-section strut swept forward, then the head along +X.
  const curve = new THREE.CatmullRomCurve3([[0, .04, 0], [.06, .34, 0], [.26, .72, 0], [.62, .96, 0], [1, 1.02, 0]].map(p => new THREE.Vector3(...p)));
  const mast = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, .1, 24), pol); mast.scale.z = .68; g.add(mast);
  const head = lathe(smooth([[.0, 1.72], [.045, 1.7], [.085, 1.56], [.105, 1.2], [.11, .7], [.1, .4]], 50), pol, 64);
  head.rotation.y = Math.PI / 2; head.position.set(0, 1.02, 0); head.scale.set(1, 1, 1); g.add(head);
  const heater = lathe([[.113, .92], [.113, 1.08]], M.brass(), 64); heater.rotation.y = Math.PI / 2; heater.position.set(0, 1.02, 0); g.add(heater);
  const hole = cyl(.016, .23, M.graphite(), 12); hole.position.set(.9, 1.02, 0); g.add(hole);
  const hole2 = cyl(.016, .23, M.graphite(), 12); hole2.position.set(1.05, 1.02, 0); g.add(hole2);
  g.position.set(-.5, -.58, 0);
  return G(g);
}

// Per-part view: rotation of the model in the frame.
export const MODELS = {
  ...MODELS2,
  'wheel':    { make: wheelTyre,       rot: [-.14, -.62, 0] },
  'brake':    { make: () => brake(true), rot: [-.1, -.7, 0] },
  'blade':    { make: fanBlade,        rot: [.1, .42, -.38] },
  'tblade':   { make: turbineBlade,    rot: [.2, 1.02, -.14] },
  'display':  { make: display,         rot: [-.08, -.42, 0] },
  'pump':     { make: () => pump('alu'), rot: [-.16, 1.05, -.34] },
  'fuel':     { make: () => pump('anod', true), rot: [-.12, -1.25, .36] },
  'valve':    { make: valve,           rot: [.16, -.7, 0] },
  'starter':  { make: starter,         rot: [.18, -.34, .22] },
  'actuator': { make: actuator,        rot: [.22, -.34, 0] },
  'light':    { make: landingLight,    rot: [-.12, -.5, 0] },
  'pitot':    { make: pitot,           rot: [.08, -.5, 0] },
};
