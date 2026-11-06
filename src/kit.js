// Shared 3D toolkit: studio lighting, materials, and geometry helpers.
import * as THREE from 'three';

export function makeStudioEnv(renderer, opts = {}) {
  const warm = opts.warm ?? 16, cool = opts.cool ?? 10, top = opts.top ?? 5;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020203);
  const panel = (color, power, w, h, pos) => {
    const c = new THREE.Color(color).multiplyScalar(power);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); scene.add(m);
  };
  panel(0xfff3e6, top, 18, 8, [0, 14, 2]);        // big overhead softbox
  panel(0xffa864, warm, 2.2, 22, [14, 2, 5]);     // warm strip, right
  panel(0xdbe5ff, cool, 1.6, 22, [-14, 1, 6]);    // cool strip, left
  panel(0xffffff, 3.2, 26, .9, [0, 3.5, 16]);     // thin frontal line for the blade edge glint
  panel(0xffc48a, 2.2, 22, 3, [0, -12, 4]);       // low warm bounce
  panel(0xffffff, 4, 6, 12, [6, 4, -14]);         // rear rim
  panel(0xcfdcff, 3, 6, 12, [-8, 3, -14]);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(scene, opts.blur ?? .012).texture;
  pm.dispose();
  return tex;
}

export const M = {
  titanium: () => new THREE.MeshStandardMaterial({ color: 0xc8ccd2, metalness: 1, roughness: .26, side: THREE.DoubleSide }),
  alu: () => new THREE.MeshStandardMaterial({ color: 0xd9dbde, metalness: 1, roughness: .34, side: THREE.DoubleSide }),
  polished: () => new THREE.MeshStandardMaterial({ color: 0xf0f1f3, metalness: 1, roughness: .1, side: THREE.DoubleSide }),
  dark: () => new THREE.MeshStandardMaterial({ color: 0x4a4d53, metalness: 1, roughness: .44, side: THREE.DoubleSide }),
  graphite: () => new THREE.MeshStandardMaterial({ color: 0x1d1f23, metalness: .85, roughness: .42, side: THREE.DoubleSide }),
  nickel: () => new THREE.MeshStandardMaterial({ color: 0xcaa878, metalness: 1, roughness: .3, side: THREE.DoubleSide }),
  copper: () => new THREE.MeshStandardMaterial({ color: 0xc27f4e, metalness: 1, roughness: .36, side: THREE.DoubleSide }),
  brass: () => new THREE.MeshStandardMaterial({ color: 0xd9b26a, metalness: 1, roughness: .28, side: THREE.DoubleSide }),
  satin: () => new THREE.MeshPhysicalMaterial({ color: 0x24262b, metalness: .92, roughness: .36, clearcoat: .6, clearcoatRoughness: .22, side: THREE.DoubleSide }),
  paint: () => new THREE.MeshPhysicalMaterial({ color: 0xe6e7ea, metalness: 0, roughness: .36, clearcoat: 1, clearcoatRoughness: .12, side: THREE.DoubleSide }),
  liner: () => new THREE.MeshStandardMaterial({ color: 0x17191c, metalness: .5, roughness: .62, side: THREE.DoubleSide }),
  rubber: () => new THREE.MeshStandardMaterial({ color: 0x17181b, metalness: 0, roughness: .62, side: THREE.DoubleSide }),
  carbon: () => new THREE.MeshStandardMaterial({ color: 0x25272b, metalness: .55, roughness: .5, side: THREE.DoubleSide }),
  anod: (c = 0x23304e) => new THREE.MeshPhysicalMaterial({ color: c, metalness: .9, roughness: .34, clearcoat: .5, clearcoatRoughness: .25, side: THREE.DoubleSide }),
};

// Revolve a [radius, z] profile around the Z axis.
export function lathe(profile, material, segments = 128, phiStart = 0, phiLength = Math.PI * 2) {
  const pts = profile.map(([r, z]) => new THREE.Vector2(Math.max(r, 1e-4), z));
  const g = new THREE.LatheGeometry(pts, segments, phiStart, phiLength);
  g.rotateX(Math.PI / 2);
  // rotateX sends y to z; the lathe's height axis keeps its sign.
  return new THREE.Mesh(g, material);
}

// Smooth a sparse profile through Catmull-Rom so curved surfaces read as machined.
export function smooth(profile, n = 60) {
  const c = new THREE.CatmullRomCurve3(profile.map(([r, z]) => new THREE.Vector3(r, z, 0)), false, 'centripetal');
  return c.getPoints(n).map(p => [p.x, p.y]);
}

// An aerofoil blade. Radial along +Y, axis along Z, tangential along X.
export function bladeGeometry({ rootR, tipR, rootChord, tipChord, twistRoot, twistTip, sweep = 0, lean = 0, thick = .06, camber = .08, segS = 26, segC = 14, belly = .35 }) {
  const pos = [], idx = [];
  const cols = segC * 2;
  for (let i = 0; i <= segS; i++) {
    const s = i / segS, r = rootR + (tipR - rootR) * s;
    const chord = (rootChord + (tipChord - rootChord) * s) * (1 + belly * Math.sin(Math.PI * Math.min(s * 1.05, 1)) * .55);
    const tw = twistRoot + (twistTip - twistRoot) * Math.pow(s, .85);
    const sw = sweep * s * s, ln = lean * s * s;
    const th = thick * (1 - .72 * s);
    for (let j = 0; j < cols; j++) {
      const up = j < segC, t = up ? j / segC : 1 - (j - segC) / segC;
      const naca = Math.sqrt(Math.max(t, 0)) * 1.48 - t * .63 - t * t * 1.76 + t * t * t * 1.42 - t * t * t * t * .51;
      const n = chord * (camber * Math.sin(Math.PI * t) + (up ? 1 : -1) * th * Math.max(naca, 0) * .5);
      const u = (t - .42) * chord;
      const x = u * Math.sin(tw) + n * Math.cos(tw) + ln;
      const z = u * Math.cos(tw) - n * Math.sin(tw) + sw;
      pos.push(x, r, z);
    }
  }
  for (let i = 0; i < segS; i++) for (let j = 0; j < cols; j++) {
    const a = i * cols + j, b = i * cols + (j + 1) % cols, c = (i + 1) * cols + j, d = (i + 1) * cols + (j + 1) % cols;
    idx.push(a, b, d, a, d, c);
  }
  // Close the tip and root.
  for (const ring of [segS, 0]) {
    const base = ring * cols;
    for (let j = 1; j < segC; j++) {
      const a = base + j, b = base + cols - j, c = base + j + 1, d = base + cols - j - 1;
      ring ? idx.push(a, b, c, c, b, d) : idx.push(a, c, b, c, d, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// A ring of instanced blades around Z at axial position z.
export function bladeRing(geo, material, count, z = 0, phase = 0) {
  const inst = new THREE.InstancedMesh(geo, material, count);
  const o = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    o.rotation.set(0, 0, (i / count) * Math.PI * 2 + phase);
    o.position.set(0, 0, z);
    o.updateMatrix(); inst.setMatrixAt(i, o.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  inst.frustumCulled = false;
  return inst;
}

// Instance any mesh geometry around a circle facing outward (bolts, nozzles, fins).
export function polar(geo, material, count, r, z = 0, tilt = null) {
  const inst = new THREE.InstancedMesh(geo, material, count);
  const o = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    o.position.set(Math.cos(a) * r, Math.sin(a) * r, z);
    o.rotation.set(0, 0, a - Math.PI / 2);
    if (tilt) o.rotateX(tilt);
    o.updateMatrix(); inst.setMatrixAt(i, o.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  inst.frustumCulled = false;
  return inst;
}

export function tube(points, radius, material, seg = 80, radial = 10) {
  const c = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return new THREE.Mesh(new THREE.TubeGeometry(c, seg, radius, radial, false), material);
}

export function rbox(w, h, d, r = .02, s = 4) {
  const shape = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  shape.moveTo(x + r, y); shape.lineTo(x + w - r, y); shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r); shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h); shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(shape, { depth: d - r * 2, bevelEnabled: true, bevelSize: r * .6, bevelThickness: r, bevelSegments: s, curveSegments: s * 2 });
  g.translate(0, 0, -(d - r * 2) / 2);
  return g;
}

export function spiralTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#16181c'; x.fillRect(0, 0, 1024, 512);
  x.strokeStyle = '#f4f4f2'; x.lineWidth = 34; x.lineCap = 'butt';
  // In lathe UVs, u wraps the circumference and v runs along the profile.
  for (let off = -1024; off <= 1024; off += 1024) {
    x.beginPath();
    for (let v = 0; v <= 512; v += 6) {
      const px = off + (v / 512) * 1024 * 1.05, py = v;
      v ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}
