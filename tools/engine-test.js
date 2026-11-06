// Test page entry: renders the engine at a scroll value given by window.__p.
import * as THREE from 'three';
import { makeStudioEnv } from '../src/kit.js';
import { buildEngine, sampleCam, FOV } from '../src/engine.js';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
const scene = new THREE.Scene();
scene.environment = makeStudioEnv(renderer);
const { engine, rotor, sync } = buildEngine();
scene.add(engine);
const cam = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, .05, 60);
window.__draw = p => {
  const s = sampleCam(p);
  cam.position.set(...s.pos); cam.lookAt(...s.tgt);
  sync(s.explode, s.open, s.focus);
  rotor.rotation.z = p * 3;
  renderer.render(scene, cam);
  return renderer.info.render.triangles;
};
window.__ready = true;
