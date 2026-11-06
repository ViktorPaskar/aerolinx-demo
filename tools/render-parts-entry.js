import * as THREE from 'three';
import { makeStudioEnv } from '../src/kit.js';
import { MODELS } from '../src/parts.js';
import { buildEngine, sampleCam, FOV } from '../src/engine.js';

const S = 1000;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
renderer.setSize(S, S); renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setClearColor(0x000000, 0);
const env = makeStudioEnv(renderer, { warm: 13, cool: 9, top: 6 });

window.__names = Object.keys(MODELS);
window.__render = name => {
  const scene = new THREE.Scene(); scene.environment = env;
  const { make, rot } = MODELS[name];
  const obj = make(); obj.rotation.set(...rot);
  const holder = new THREE.Group(); holder.add(obj); scene.add(holder);
  holder.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(holder);
  const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  holder.position.sub(c);
  const cam = new THREE.PerspectiveCamera(18, 1, .1, 60);
  const fit = Math.max(size.x, size.y) * 1.12;
  cam.position.set(0, 0, fit / 2 / Math.tan(9 * Math.PI / 180) + size.z / 2);
  cam.lookAt(0, 0, 0);
  renderer.render(scene, cam);
  return canvas.toDataURL('image/webp', .86);
};
// Hero poster for browsers without WebGL.
window.__poster = (w, h) => {
  renderer.setSize(w, h);
  const scene = new THREE.Scene(); scene.environment = makeStudioEnv(renderer);
  const { engine, sync, rotor } = buildEngine();
  scene.add(engine);
  const s = sampleCam(0);
  sync(s.explode, s.open, s.focus); rotor.rotation.z = .25;
  const cam = new THREE.PerspectiveCamera(FOV, w / h, .05, 60);
  cam.position.set(...s.pos); cam.lookAt(...s.tgt);
  renderer.render(scene, cam);
  return canvas.toDataURL('image/webp', .8);
};
window.__ready = true;
