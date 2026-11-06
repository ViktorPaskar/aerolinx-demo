// More catalogue models, plus the data plate shared by every part.
import * as THREE from 'three';
import { M, lathe, smooth, polar, tube, rbox } from './kit.js';

const G = (...c) => { const g = new THREE.Group(); c.forEach(x => g.add(x)); return g; };
const cyl = (r, h, mat, seg = 48) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
const at = (m, x, y, z, rx = 0, ry = 0, rz = 0) => { m.position.set(x, y, z); m.rotation.set(rx, ry, rz); return m; };
const box = (w, h, d, mat, r = .02) => new THREE.Mesh(rbox(w, h, d, r), mat);

// Engraved metal identification plate, the detail that makes a part read as real.
export function plate(lines, w = .34, h = .2, tint = '#c9ccce') {
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w);
  const x = c.getContext('2d');
  x.fillStyle = tint; x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = '#2a2c30'; x.lineWidth = 5; x.strokeRect(10, 10, c.width - 20, c.height - 20);
  x.fillStyle = '#17181b'; x.textBaseline = 'middle';
  const lh = (c.height - 40) / lines.length;
  lines.forEach((l, i) => { x.font = `${i ? 500 : 700} ${Math.min(lh * .66, 44)}px Arial`; x.fillText(l, 28, 20 + lh * (i + .5)); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({ map: t, metalness: .55, roughness: .45 }); mat.name = 'plate';
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  return m;
}

function generator() {
  const al = M.alu(), body = M.primer(), dk = M.dark(), pol = M.polished();
  const g = new THREE.Group();
  g.add(lathe(smooth([[0, -1.02], [.34, -1.02], [.52, -.92], [.6, -.66], [.62, .3]], 40), body, 96));
  for (let i = 0; i < 9; i++) { const z = -.56 + i * .09; g.add(lathe([[.62, z], [.665, z + .012], [.665, z + .03], [.62, z + .042]], body, 96)); }
  g.add(lathe(smooth([[.62, .3], [.68, .34], [.68, .46], [.48, .56], [.42, .78]], 30), al, 96));
  g.add(lathe([[.68, .38], [.82, .4], [.82, .47], [.6, .5]], al, 96));
  g.add(polar(new THREE.CylinderGeometry(.03, .03, .05, 10), pol, 14, .75, .485, Math.PI / 2));
  g.add(lathe([[.14, .78], [.14, 1.08], [.1, 1.14]], pol, 48));
  for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; g.add(at(new THREE.Mesh(new THREE.BoxGeometry(.018, .028, .24), pol), Math.cos(a) * .142, Math.sin(a) * .142, .95, 0, 0, a)); }
  const box1 = box(.5, .24, .62, al, .03); box1.position.set(0, .68, -.32); g.add(box1);
  g.add(at(cyl(.09, .2, M.brass()), .13, .86, -.44)); g.add(at(cyl(.08, .2, M.brass()), -.13, .86, -.2));
  g.add(at(cyl(.12, .1, dk), .68, 0, -.4, 0, 0, Math.PI / 2));
  g.add(tube([[.72, 0, -.4], [.9, .2, -.2], [.8, .5, .14], [.72, .5, .32]], .026, pol));
  const pl = plate(['INTEGRATED DRIVE GENERATOR', 'P/N GN-77120-4', 'S/N 20418']); pl.position.set(.25, .61, .1); pl.rotation.set(-Math.PI / 2 + .35, 0, 0); pl.rotation.order = 'YXZ'; g.add(pl);
  g.rotation.y = Math.PI / 2;
  return G(g);
}

function lru() {
  const paint = M.wrinkle(), al = M.alu(), pol = M.polished();
  const g = new THREE.Group();
  g.add(box(.82, .72, 1.5, paint, .02));
  const face = box(.86, .76, .05, M.graphite(), .01); face.position.z = .76; g.add(face);
  for (let i = 0; i < 12; i++) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(.012, .3, .9), M.graphite()), -.27 + i * .05, .37, -.1));
  // Handle
  g.add(tube([[-.3, .29, .79], [-.3, .29, .92], [-.24, .29, .97], [.24, .29, .97], [.3, .29, .92], [.3, .29, .79]], .02, pol));
  // Front connector, test jack and status light
  g.add(at(cyl(.1, .07, al), -.22, -.12, .81, Math.PI / 2));
  g.add(at(cyl(.07, .02, M.graphite()), -.22, -.12, .85, Math.PI / 2));
  g.add(at(cyl(.05, .05, M.brass()), .08, -.12, .8, Math.PI / 2));
  g.add(at(cyl(.022, .02, M.red(), 16), .26, -.12, .79, Math.PI / 2));
  // Thumbscrews
  for (const [x, y] of [[-.37, .31], [.37, .31], [-.37, -.31], [.37, -.31]]) g.add(at(cyl(.024, .05, pol, 16), x, y, .8, Math.PI / 2));
  const p = plate(['COMMUNICATIONS TRANSCEIVER', 'P/N RT-4410-22', 'MOD 7   S/N 118204', 'CAGE 0SR21'], .46, .2); p.position.set(0, .09, .786); p.scale.setScalar(.84); g.add(p);
  // Rear rack pins
  const rear = box(.5, .24, .05, M.brass(), .01); rear.position.set(0, -.2, -.77); g.add(rear);
  for (const x of [-.34, .34]) g.add(at(cyl(.024, .09, pol, 16), x, .22, -.79, Math.PI / 2));
  return g;
}

function controlPanel() {
  const paint = M.wrinkle(), pol = M.polished();
  const g = new THREE.Group();
  g.add(box(1.5, .6, .1, paint, .012));
  const rear = box(1.32, .5, .62, M.dark(), .02); rear.position.z = -.36; g.add(rear);
  const c = document.createElement('canvas'); c.width = 620; c.height = 150; const x = c.getContext('2d');
  x.fillStyle = '#060807'; x.fillRect(0, 0, 620, 150); x.fillStyle = '#ffae3d'; x.font = '700 70px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('118.725', 160, 78); x.fillText('121.500', 462, 78);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sm = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 1, roughness: .2 }); sm.name = 'screen';
  g.add(at(new THREE.Mesh(new THREE.PlaneGeometry(.96, .22), sm), .0, .1, .056));
  for (const [kx, r] of [[-.56, .07], [.56, .07]]) { g.add(at(cyl(r, .07, M.graphite(), 32), kx, .1, .09, Math.PI / 2)); g.add(at(cyl(r * .55, .03, pol, 24), kx, .1, .13, Math.PI / 2)); }
  for (let i = 0; i < 7; i++) g.add(at(box(.13, .07, .03, M.white(), .008), -.54 + i * .18, -.15, .06));
  for (const [sx, sy] of [[-.72, .26], [.72, .26], [-.72, -.26], [.72, -.26]]) g.add(at(cyl(.014, .02, pol, 12), sx, sy, .056, Math.PI / 2));
  return g;
}

function hydFilter() {
  const al = M.alu(), pol = M.polished();
  const g = new THREE.Group();
  g.add(lathe(smooth([[0, -.92], [.2, -.92], [.32, -.84], [.34, -.7], [.34, .34]], 30), M.anod(0x6d5a2a), 72));
  g.add(lathe([[.34, .3], [.42, .32], [.42, .68], [.2, .72], [0, .72]], al, 72));
  g.add(at(cyl(.1, .36, al), .54, 0, .5, 0, 0, Math.PI / 2));
  g.add(at(cyl(.1, .36, al), -.54, 0, .5, 0, 0, Math.PI / 2));
  g.add(at(cyl(.14, .05, pol), .73, 0, .5, 0, 0, Math.PI / 2));
  g.add(at(cyl(.14, .05, pol), -.73, 0, .5, 0, 0, Math.PI / 2));
  g.add(at(cyl(.06, .06, M.red(), 20), 0, 0, .75, Math.PI / 2));
  g.add(polar(new THREE.CylinderGeometry(.022, .022, .04, 8), pol, 6, .36, .71, Math.PI / 2));
  const lb = plate(['HYDRAULIC FILTER', 'P/N FE-2204-3', '3 MICRON'], .4, .2, '#e5e3da'); lb.position.set(0, -.2, .348); g.add(lb); lb.position.set(0, .001, 0); lb.rotation.set(0, 0, 0);
  const lbw = G(lb); lbw.position.set(0, .345, -.28); lbw.rotation.x = -Math.PI / 2; g.add(lbw);
  g.rotation.x = -Math.PI / 2;
  return G(g);
}

function igniter() {
  const pol = M.polished(), ni = M.nickel();
  const g = new THREE.Group();
  g.add(lathe(smooth([[0, -1.3], [.05, -1.3], [.075, -1.24], [.078, -.5]], 12), ni, 32));
  g.add(lathe([[.078, -.5], [.14, -.48], [.14, -.36], [.1, -.34]], pol, 6));
  g.add(lathe([[.1, -.34], [.1, .24], [.13, .28], [.13, .52], [.1, .56], [.1, 1.06], [.13, 1.1], [.13, 1.3], [0, 1.3]], M.white(), 40));
  g.add(lathe([[.15, .72], [.15, .84]], M.brass(), 24));
  g.rotation.set(Math.PI / 2 - .46, 0, 0);
  return G(g);
}

function fuelNozzle() {
  const ni = M.nickel(), pol = M.polished(), al = M.alu();
  const g = new THREE.Group();
  const stem = tube([[0, .68, 0], [0, .2, 0], [.04, -.24, .03], [.24, -.54, .1], [.54, -.66, .1]], .085, ni, 80, 18); g.add(stem);
  g.add(lathe(smooth([[.0, .9], [.13, .86], [.2, .7], [.22, .48], [.15, .3], [.08, .24]], 28), ni, 48).rotateZ(0));
  g.children[1].rotation.y = Math.PI / 2; g.children[1].position.set(.25, -.66, .1);
  const fl = box(.72, .08, .48, al, .012); fl.position.set(0, .72, 0); g.add(fl);
  for (const [x, z] of [[-.27, -.15], [.27, -.15], [-.27, .15], [.27, .15]]) g.add(at(cyl(.034, .03, pol, 12), x, .77, z));
  g.add(at(cyl(.09, .28, al), 0, .9, 0)); g.add(at(cyl(.12, .06, pol, 6), 0, 1.03, 0));
  g.add(tube([[.18, .75, .1], [.5, .9, .1], [.6, 1.1, .05]], .03, pol));
  g.add(at(cyl(.06, .1, M.brass()), .62, 1.14, .05));
  return g;
}

function oxygen() {
  const g = new THREE.Group(), pol = M.polished();
  g.add(lathe(smooth([[0, -1.05], [.2, -1.03], [.36, -.92], [.42, -.7], [.42, .5], [.36, .72], [.2, .84], [.09, .88]], 40), M.oxygreen(), 72));
  g.add(lathe([[.42, -.32], [.425, -.3], [.425, -.2], [.42, -.18]], M.white(), 72));
  g.add(lathe([[.09, .88], [.09, 1.02], [.15, 1.04], [.15, 1.2], [.1, 1.24], [0, 1.24]], M.brass(), 40));
  g.add(at(cyl(.1, .06, M.brass(), 6), .2, 0, 1.12, 0, 0, Math.PI / 2));
  const gauge = lathe([[0, .055], [.16, .05], [.17, 0], [.16, -.06], [0, -.06]], pol, 40); gauge.position.set(.0, -.26, 1.12); gauge.rotation.x = Math.PI / 2; g.add(gauge);
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#f2f1ea'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#111'; x.lineWidth = 6; x.beginPath(); x.arc(128, 128, 112, Math.PI * .75, Math.PI * 2.25); x.stroke(); x.lineWidth = 8; x.beginPath(); x.moveTo(128, 128); x.lineTo(196, 72); x.stroke(); x.font = '700 36px Arial'; x.textAlign = 'center'; x.fillStyle = '#111'; x.fillText('PSI', 128, 200);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const fm = new THREE.MeshStandardMaterial({ map: t, roughness: .2 }); fm.name = 'plate';
  g.add(at(new THREE.Mesh(new THREE.CircleGeometry(.14, 40), fm), 0, -.26, 1.18 + .002, 0, 0, 0));
  g.children[g.children.length - 1].position.set(0, -.2, 1.12); g.children[g.children.length - 1].rotation.set(-Math.PI / 2, 0, 0);
  g.rotation.x = -Math.PI / 2 + .0;
  const out = G(g); out.rotation.z = 0;
  return out;
}

function battery() {
  const body = M.dark(), pol = M.polished();
  const g = new THREE.Group();
  g.add(box(1.5, .84, .92, M.anod(0x25303a), .03));
  const lid = box(1.54, .14, .96, M.wrinkle(), .02); lid.position.y = .46; g.add(lid);
  for (const x of [-.8, .8]) g.add(tube([[x, .1, -.26], [x * 1.08, .12, -.2], [x * 1.08, .12, .2], [x, .1, .26]], .026, pol));
  for (let i = 0; i < 4; i++) g.add(at(cyl(.022, .04, pol, 12), -.62 + i * .41, .54, .38));
  g.add(at(cyl(.12, .1, M.graphite()), -.4, .1, .48, Math.PI / 2));
  g.add(at(cyl(.08, .05, M.brass()), -.4, .1, .54, Math.PI / 2));
  for (const z of [.2, 0, -.2]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(.9, .02, .02), body), .28, .54, z));
  const p = plate(['NICKEL-CADMIUM BATTERY', 'P/N BA-4078-1', '24 V  44 AH'], .56, .3, '#e5e3da'); p.position.set(.32, .03, .462); g.add(p);
  return g;
}

function hose() {
  const g = new THREE.Group(), pol = M.polished();
  const pts = [[-1, -.3, 0], [-.7, -.1, .1], [-.3, .3, .1], [.2, .4, -.1], [.6, .1, -.14], [.86, -.28, -.02]];
  g.add(tube(pts, .06, M.braid(), 180, 16));
  for (const [p, d] of [[pts[0], [-.86, -.57, -.1]], [pts[5], [.46, -.88, .1]]]) {
    const fit = new THREE.Group();
    fit.add(cyl(.075, .24, pol)); fit.add(at(cyl(.095, .1, M.brass(), 6), 0, .12, 0)); fit.add(at(cyl(.05, .1, pol), 0, .22, 0));
    fit.position.set(...p); fit.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...d).normalize());
    g.add(fit);
  }
  const tag = at(box(.2, .08, .012, M.white(), .004), -.1, .24, .22); g.add(tag);
  return g;
}

function wiper() {
  const g = new THREE.Group(), blk = M.wrinkle(), pol = M.polished();
  g.add(at(box(.08, 1.3, .05, blk, .012), 0, .25, 0, 0, 0, .12));
  g.add(at(cyl(.06, .12, M.alu()), .08, -.44, 0, Math.PI / 2));
  g.add(at(cyl(.03, .16, pol, 16), .08, -.44, -.04, Math.PI / 2));
  g.add(at(box(.14, 1.34, .05, M.alu(), .012), -.1, .95, .07, 0, 0, -.14));
  g.add(at(box(.05, 1.26, .07, M.rubber(), .01), -.13, .95, .1, 0, 0, -.14));
  g.add(at(cyl(.022, .1, pol, 12), -.06, .9, .05, Math.PI / 2));
  g.position.y = -.45;
  return G(g);
}

function nozeWheel() {
  const rub = M.rubber(), al = M.alu(), pol = M.polished();
  const g = new THREE.Group();
  const prof = [];
  for (let i = 0; i <= 90; i++) { const a = -Math.PI * .5 + i / 90 * Math.PI; let r = .6 + .4 * Math.cos(a), z = .34 * Math.sin(a); if ([.06, .17].some(c => Math.abs(Math.abs(z) - c) < .016) && Math.abs(Math.sin(a)) < .7) r -= .02; prof.push([r, z]); }
  g.add(lathe(prof, rub, 160));
  g.add(lathe(smooth([[.62, .28], [.64, .24], [.6, .16], [.58, .02], [.34, -.02], [.2, .06], [.2, .2]], 50), al, 96));
  g.add(lathe(smooth([[.62, -.28], [.64, -.24], [.6, -.16], [.58, -.02]], 20), al, 96));
  g.add(lathe(smooth([[.08, .26], [.2, .26], [.22, .2]], 16), pol, 48));
  g.add(polar(new THREE.CylinderGeometry(.018, .018, .05, 10), pol, 10, .3, .02, Math.PI / 2));
  const valve = at(cyl(.012, .1, pol, 10), .48, 0, .1, Math.PI / 2 - .4); g.add(valve);
  return g;
}

function elt() {
  const g = new THREE.Group();
  g.add(box(1.1, .56, .76, M.orange(), .05));
  const p = plate(['EMERGENCY LOCATOR TRANSMITTER', 'P/N EL-406-AF', '406 MHz'], .62, .24, '#e5e3da'); p.position.set(-.06, -.02, .382); p.scale.setScalar(.8); g.add(p);
  g.add(at(cyl(.02, .9, M.wrinkle(), 16), .44, .7, -.2));
  g.add(at(cyl(.05, .08, M.alu()), .44, .3, -.2));
  g.add(at(cyl(.07, .03, M.red(), 20), .38, .06, .39, Math.PI / 2));
  g.add(at(box(.2, .1, .03, M.white(), .008), .38, -.14, .385));
  const strap = M.wrinkle();
  g.add(at(box(.08, .6, .82, strap, .008), -.44, 0, 0));
  g.add(at(box(.08, .6, .82, strap, .008), .26, 0, 0));
  return g;
}

export const MODELS2 = {
  generator: { make: generator, rot: [.26, -.56, 0], name: 'generator' },
  lru: { make: lru, rot: [.14, -.6, 0] },
  panel: { make: controlPanel, rot: [-.05, -.42, 0] },
  filter: { make: hydFilter, rot: [.12, -.5, 0] },
  igniter: { make: igniter, rot: [0, -.4, 0] },
  nozzle: { make: fuelNozzle, rot: [.04, -.6, 0] },
  oxygen: { make: oxygen, rot: [.14, -.5, -.16] },
  battery: { make: battery, rot: [.14, -.56, 0] },
  hose: { make: hose, rot: [-1.5, 0, .2] },
  wiper: { make: wiper, rot: [-1.5, 0, -.9] },
  nosewheel: { make: nozeWheel, rot: [-.1, -.68, 0] },
  elt: { make: elt, rot: [.14, -.56, 0] },
};
