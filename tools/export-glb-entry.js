// Runs in a browser page: builds each model, bakes it to one mesh per material, exports GLB.
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MODELS } from '../src/parts.js';

function prepare(g) {
  let out = g.index ? g.toNonIndexed() : g.clone();
  if (!out.attributes.normal) out.computeVertexNormals();
  if (!out.attributes.uv) out.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(out.attributes.position.count * 2), 2));
  for (const n of Object.keys(out.attributes)) if (!['position', 'normal', 'uv'].includes(n)) out.deleteAttribute(n);
  return out;
}

function flatten(root) {
  root.updateMatrixWorld(true);
  const buckets = new Map();
  const put = (mat, geo) => {
    const key = mat.map ? mat.uuid : mat.name;
    if (!buckets.has(key)) buckets.set(key, { mat, list: [] });
    buckets.get(key).list.push(geo);
  };
  const tmp = new THREE.Matrix4();
  root.traverse(o => {
    if (o.isInstancedMesh) {
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, tmp);
        const m = new THREE.Matrix4().multiplyMatrices(o.matrixWorld, tmp);
        put(o.material, prepare(o.geometry).applyMatrix4(m));
      }
    } else if (o.isMesh) {
      put(o.material, prepare(o.geometry).applyMatrix4(o.matrixWorld));
    }
  });
  const scene = new THREE.Scene();
  for (const { mat, list } of buckets.values()) {
    const m = mat.clone(); m.name = mat.name;
    const merged = mergeGeometries(list, false);
    scene.add(new THREE.Mesh(merged, m));
  }
  return scene;
}

const UPRIGHT = new Set(['lru', 'panel', 'battery', 'elt', 'generator', 'filter', 'nosewheel', 'wheel', 'brake', 'valve', 'display', 'light', 'starter', 'actuator', 'pump', 'fuel', 'oxygen', 'nozzle', 'pitot']);
window.__names = Object.keys(MODELS);
window.__export = async name => {
  const { make, rot } = MODELS[name];
  const obj = make();
  // Things that sit on a bench rest flat: yaw only.
  obj.rotation.set(...(UPRIGHT.has(name) ? [0, rot[1], 0] : rot));
  const holder = new THREE.Group(); holder.add(obj);
  const scene = flatten(holder);
  const buf = await new GLTFExporter().parseAsync(scene, { binary: true });
  let bin = ''; const u8 = new Uint8Array(buf);
  for (let i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
  return btoa(bin);
};
window.__ready = true;
