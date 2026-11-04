import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const RADIO = 3.2;

const COLORES = [
  0xff6b6b, 0x4ecdc4, 0xffd93d, 0x6c5ce7, 0x00b894, 0xfd79a8,
  0x0984e3, 0xe17055, 0xa29bfe, 0x74b9ff,
];

const canvas = document.querySelector('#scene');
const labelsEl = document.querySelector('#labels');

export const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

function texturaRadial(paradas) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  paradas.forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const texFuego = texturaRadial([
  [0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,200,90,0.9)'],
  [0.6, 'rgba(255,90,10,0.35)'], [1, 'rgba(255,60,0,0)'],
]);
const texHumo = texturaRadial([[0, 'rgba(110,110,125,0.6)'], [1, 'rgba(110,110,125,0)']]);

function texturaSuelo() {
  const T = 1024;
  const c = document.createElement('canvas');
  c.width = T;
  c.height = T;
  const g = c.getContext('2d');
  const m = T / 2;
  const u = m / (RADIO + 1.2);
  const base = g.createRadialGradient(m, m, 0, m, m, m);
  base.addColorStop(0, '#2a2233');
  base.addColorStop(0.35, '#18202f');
  base.addColorStop(1, '#0d1320');
  g.fillStyle = base;
  g.fillRect(0, 0, T, T);
  for (let i = 0; i < 2600; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * m * 0.98;
    g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.14)';
    g.fillRect(m + Math.cos(a) * r, m + Math.sin(a) * r, 2 + Math.random() * 4, 2 + Math.random() * 4);
  }
  const anillo = (r, ancho, color, dash = []) => {
    g.setLineDash(dash);
    g.lineWidth = ancho;
    g.strokeStyle = color;
    g.beginPath();
    g.arc(m, m, r * u, 0, Math.PI * 2);
    g.stroke();
  };
  anillo(RADIO, 5, '#3d4d68');
  anillo(RADIO + 0.28, 2, '#26334a');
  anillo(RADIO - 0.28, 2, '#26334a');
  anillo(2.1, 2, '#33405a', [10, 14]);
  anillo(1.05, 5, '#4a3322');
  g.setLineDash([]);
  for (let i = 0; i < 48; i += 1) {
    const a = (i / 48) * Math.PI * 2;
    const r0 = (RADIO + 0.34) * u;
    const r1 = r0 + (i % 4 === 0 ? 18 : 9);
    g.strokeStyle = '#3d4d68';
    g.lineWidth = i % 4 === 0 ? 4 : 2;
    g.beginPath();
    g.moveTo(m + Math.cos(a) * r0, m + Math.sin(a) * r0);
    g.lineTo(m + Math.cos(a) * r1, m + Math.sin(a) * r1);
    g.stroke();
  }
  const calor = g.createRadialGradient(m, m, 0, m, m, 2.6 * u);
  calor.addColorStop(0, 'rgba(255,140,50,0.45)');
  calor.addColorStop(0.5, 'rgba(255,100,30,0.14)');
  calor.addColorStop(1, 'rgba(255,100,30,0)');
  g.fillStyle = calor;
  g.fillRect(0, 0, T, T);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function geometriaPapa() {
  const geo = new THREE.SphereGeometry(0.17, 28, 20);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = 1 + 0.09 * Math.sin(x * 37 + y * 23) * Math.cos(z * 31) + 0.05 * Math.sin(y * 51 + z * 17);
    pos.setXYZ(i, x * r * 1.22, y * r * 0.92, z * r);
  }
  geo.computeVertexNormals();
  return geo;
}

export const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x141c38, 0.03);
{
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#03060f');
  gr.addColorStop(0.55, '#0b1630');
  gr.addColorStop(1, '#141c38');
  g.fillStyle = gr;
  g.fillRect(0, 0, 4, 256);
  const fondo = new THREE.CanvasTexture(c);
  fondo.colorSpace = THREE.SRGBColorSpace;
  scene.background = fondo;
}

export const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 7.6, 9.8);

const objetivoRender = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
  type: THREE.HalfFloatType,
  samples: 4,
});
export const composer = new EffectComposer(renderer, objetivoRender);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(
  new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.7, 0.75, 0.82),
);
composer.addPass(new OutputPass());

export const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.85, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.085;
controls.enablePan = false;
controls.minDistance = 5.4;
controls.maxDistance = 16;
controls.minPolarAngle = 0.18;
controls.maxPolarAngle = Math.PI / 2 - 0.04;
controls.rotateSpeed = 0.62;
controls.zoomSpeed = 0.8;
controls.update();

export const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
labelsEl.appendChild(labelRenderer.domElement);

scene.add(new THREE.HemisphereLight(0x8fa8ff, 0x1a1f2e, 0.95));

const luz = new THREE.DirectionalLight(0xb8c8ff, 1.35);
luz.position.set(-5, 9, 5);
luz.castShadow = true;
luz.shadow.mapSize.set(1536, 1536);
luz.shadow.camera.near = 1;
luz.shadow.camera.far = 30;
luz.shadow.camera.left = -8;
luz.shadow.camera.right = 8;
luz.shadow.camera.top = 8;
luz.shadow.camera.bottom = -8;
luz.shadow.bias = -0.0004;
luz.shadow.normalBias = 0.03;
luz.shadow.radius = 3;
scene.add(luz);

const luzBorde = new THREE.DirectionalLight(0x6c8cff, 0.6);
luzBorde.position.set(6, 4, -7);
scene.add(luzBorde);

const suelo = new THREE.Mesh(
  new THREE.CylinderGeometry(RADIO + 1.2, RADIO + 1.2, 0.16, 64),
  [
    new THREE.MeshStandardMaterial({ color: 0x0b1120, roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ map: texturaSuelo(), roughness: 0.92, metalness: 0.05 }),
    new THREE.MeshStandardMaterial({ color: 0x0b1120, roughness: 0.95 }),
  ],
);
suelo.position.y = -0.08;
suelo.receiveShadow = true;
scene.add(suelo);

const anillo = new THREE.Mesh(
  new THREE.TorusGeometry(RADIO, 0.02, 6, 120),
  new THREE.MeshBasicMaterial({ color: 0x334155 }),
);
anillo.rotation.x = Math.PI / 2;
anillo.position.y = 0.02;
scene.add(anillo);

const anilloInterior = new THREE.Mesh(
  new THREE.TorusGeometry(1.05, 0.012, 6, 96),
  new THREE.MeshBasicMaterial({ color: 0x3b2a1c, transparent: true, opacity: 0.75 }),
);
anilloInterior.rotation.x = Math.PI / 2;
anilloInterior.position.y = 0.025;
scene.add(anilloInterior);

export const aroActual = new THREE.Mesh(
  new THREE.TorusGeometry(0.46, 0.035, 8, 48),
  new THREE.MeshBasicMaterial({ color: 0xffb347 }),
);
aroActual.rotation.x = Math.PI / 2;
aroActual.position.y = 0.04;
aroActual.visible = false;
scene.add(aroActual);

const terreno = new THREE.Mesh(
  new THREE.CircleGeometry(70, 48),
  new THREE.MeshStandardMaterial({ color: 0x0e1829, roughness: 1 }),
);
terreno.rotation.x = -Math.PI / 2;
terreno.position.y = -0.17;
scene.add(terreno);

(() => {
  const n = 46;
  const matHoja = new THREE.MeshStandardMaterial({ color: 0x0f2b26, roughness: 1 });
  const matTronco = new THREE.MeshStandardMaterial({ color: 0x2a1b12, roughness: 1 });
  const conoA = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 2.6, 7), matHoja, n);
  const conoB = new THREE.InstancedMesh(new THREE.ConeGeometry(0.75, 2.1, 7), matHoja, n);
  const tronco = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.16, 1, 6), matTronco, n);
  const o = new THREE.Object3D();
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.12;
    const r = 17 + Math.random() * 16;
    const k = 0.9 + Math.random() * 0.9;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    o.rotation.set(0, Math.random() * 6.28, 0);
    o.scale.setScalar(k);
    o.position.set(x, -0.17 + 0.5 * k, z);
    o.updateMatrix();
    tronco.setMatrixAt(i, o.matrix);
    o.position.set(x, -0.17 + 2.3 * k, z);
    o.updateMatrix();
    conoA.setMatrixAt(i, o.matrix);
    o.position.set(x, -0.17 + 3.05 * k, z);
    o.updateMatrix();
    conoB.setMatrixAt(i, o.matrix);
  }
  scene.add(tronco, conoA, conoB);
})();

const estrellas = (() => {
  const n = 450;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i += 1) {
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(0.15 + Math.random() * 0.85);
    pos[i * 3] = 48 * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = 48 * Math.cos(ph);
    pos[i * 3 + 2] = 48 * Math.sin(ph) * Math.sin(th);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xcfd9ff, size: 0.22, transparent: true, opacity: 0.85, depthWrite: false, fog: false,
    }),
  );
  scene.add(pts);
  return pts;
})();

const luciernagas = (() => {
  const n = 36;
  const base = [];
  for (let i = 0; i < n; i += 1) {
    base.push({
      r: 4.6 + Math.random() * 5,
      a: Math.random() * Math.PI * 2,
      y: 0.5 + Math.random() * 2,
      v: 0.08 + Math.random() * 0.15,
      f: Math.random() * 6.28,
    });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xc8ff8a, size: 0.12, map: texFuego, transparent: true, opacity: 0.9,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }),
  );
  pts.userData.base = base;
  pts.frustumCulled = false;
  scene.add(pts);
  return pts;
})();

function actualizarLuciernagas(t) {
  const attr = luciernagas.geometry.getAttribute('position');
  const b = luciernagas.userData.base;
  for (let i = 0; i < b.length; i += 1) {
    const o = b[i];
    const a = o.a + t * o.v;
    attr.setXYZ(
      i,
      Math.cos(a) * o.r + Math.sin(t * 0.9 + o.f) * 0.4,
      o.y + Math.sin(t * 1.3 + o.f) * 0.35,
      Math.sin(a) * o.r + Math.cos(t * 0.7 + o.f) * 0.4,
    );
  }
  attr.needsUpdate = true;
}

export const potato = new THREE.Group();
const papa = new THREE.Mesh(
  geometriaPapa(),
  new THREE.MeshStandardMaterial({
    color: 0xffb347,
    emissive: 0xff6a00,
    emissiveIntensity: 1.4,
    roughness: 0.45,
  }),
);
papa.castShadow = true;
potato.add(papa);
const auraPapa = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: texFuego, color: 0xff8a2a, transparent: true, opacity: 0.85,
    depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  }),
);
auraPapa.scale.setScalar(1.1);
potato.add(auraPapa);
for (const [x, y, z] of [[0.1, 0.06, 0.13], [-0.08, -0.05, 0.14], [0.02, 0.09, -0.15]]) {
  const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshBasicMaterial({ color: 0x5a2a08 }));
  ojo.position.set(x, y, z);
  potato.add(ojo);
}
const luzPapa = new THREE.PointLight(0xff8a00, 2.5, 4, 2);
potato.add(luzPapa);
potato.position.set(0, 1, 0);
potato.visible = false;
potato.userData.moviendo = false;
potato.userData.baseY = 1;
scene.add(potato);

/* ------------------------------------------------------------------ */
/* Fogata central                                                      */
/* ------------------------------------------------------------------ */

export const fogata = new THREE.Group();
fogata.position.set(0, 0, 0);
scene.add(fogata);

const llamas = [];
const particulasFuego = [];
const humo = [];
let charcoLuz;
let luzFogata;
let brasas;

function reiniciarLlama(s) {
  const d = s.userData;
  d.vida = 0;
  d.max = 0.6 + Math.random() * 0.5;
  const a = Math.random() * Math.PI * 2;
  const r = Math.random() * 0.2;
  d.x = Math.cos(a) * r;
  d.z = Math.sin(a) * r;
}

function crearFogata() {
  const piedraMat = new THREE.MeshStandardMaterial({
    color: 0x4a4f5c,
    roughness: 0.92,
    metalness: 0.04,
  });

  for (let i = 0; i < 9; i += 1) {
    const angulo = (i / 9) * Math.PI * 2;
    const radio = 0.82 + (i % 2) * 0.05;
    const piedra = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.17 + (i % 3) * 0.02, 0),
      piedraMat,
    );
    piedra.position.set(
      Math.cos(angulo) * radio,
      0.12,
      Math.sin(angulo) * radio,
    );
    piedra.scale.y = 0.72;
    piedra.rotation.set(i * 0.7, angulo, i * 0.3);
    piedra.castShadow = true;
    piedra.receiveShadow = true;
    fogata.add(piedra);
  }

  const maderaMat = new THREE.MeshStandardMaterial({
    color: 0x5b3a22,
    roughness: 0.88,
  });
  for (let i = 0; i < 4; i += 1) {
    const tronco = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.085, 1.15, 8),
      maderaMat,
    );
    const angulo = (i / 4) * Math.PI;
    tronco.rotation.z = Math.PI / 2;
    tronco.rotation.y = angulo;
    tronco.position.set(
      Math.cos(angulo) * 0.05,
      0.16 + i * 0.035,
      Math.sin(angulo) * 0.05,
    );
    tronco.castShadow = true;
    fogata.add(tronco);
  }

  const coloresLlama = [0xffd166, 0xff9f1c, 0xff6b00, 0xffe29a];
  for (let i = 0; i < 5; i += 1) {
    const alto = 0.95 - i * 0.12;
    const llama = new THREE.Mesh(
      new THREE.ConeGeometry(0.26 - i * 0.035, alto, 14, 1, true),
      new THREE.MeshBasicMaterial({
        color: coloresLlama[i % coloresLlama.length],
        transparent: true,
        opacity: 0.68 - i * 0.07,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    llama.position.set(
      Math.cos(i * 2.1) * 0.07,
      0.42 + alto / 2,
      Math.sin(i * 2.1) * 0.07,
    );
    llama.userData.baseY = llama.position.y;
    llama.userData.fase = i * 1.7;
    fogata.add(llama);
    llamas.push(llama);
  }

  luzFogata = new THREE.PointLight(0xff7b28, 6, 8, 2);
  luzFogata.position.set(0, 1.05, 0);
  fogata.add(luzFogata);

  const cantidad = 34;
  const posiciones = new Float32Array(cantidad * 3);
  const velocidades = [];
  for (let i = 0; i < cantidad; i += 1) {
    const angulo = Math.random() * Math.PI * 2;
    const radio = Math.random() * 0.3;
    posiciones[i * 3] = Math.cos(angulo) * radio;
    posiciones[i * 3 + 1] = 0.6 + Math.random() * 1.1;
    posiciones[i * 3 + 2] = Math.sin(angulo) * radio;
    velocidades.push(0.25 + Math.random() * 0.55);
  }
  const geoBrasas = new THREE.BufferGeometry();
  geoBrasas.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
  brasas = new THREE.Points(
    geoBrasas,
    new THREE.PointsMaterial({
      color: 0xffb347,
      size: 0.045,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  brasas.userData.velocidades = velocidades;
  fogata.add(brasas);

  for (let i = 0; i < 28; i += 1) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texFuego, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      }),
    );
    s.userData = {};
    reiniciarLlama(s);
    s.userData.vida = Math.random() * s.userData.max;
    fogata.add(s);
    particulasFuego.push(s);
  }
  for (let i = 0; i < 10; i += 1) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texHumo, transparent: true, depthWrite: false }));
    const max = 2.4 + Math.random();
    s.userData = { max, vida: Math.random() * max, dx: (Math.random() - 0.5) * 0.8, dz: (Math.random() - 0.5) * 0.8 };
    fogata.add(s);
    humo.push(s);
  }
  charcoLuz = new THREE.Mesh(
    new THREE.PlaneGeometry(7.5, 7.5),
    new THREE.MeshBasicMaterial({
      map: texFuego, color: 0xff7a1f, transparent: true, opacity: 0.3,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    }),
  );
  charcoLuz.rotation.x = -Math.PI / 2;
  charcoLuz.position.y = 0.03;
  fogata.add(charcoLuz);
}

crearFogata();

/* ------------------------------------------------------------------ */
/* Gotas de agua                                                       */
/* ------------------------------------------------------------------ */

export const grupoGotas = new THREE.Group();
scene.add(grupoGotas);

const gotasMap = new Map();
const geoGotaCuerpo = new THREE.SphereGeometry(0.16, 16, 12);
const geoGotaPunta = new THREE.ConeGeometry(0.13, 0.26, 14);
const geoHalo = new THREE.RingGeometry(0.23, 0.31, 32);

function crearMallaGota(gota) {
  const grupo = new THREE.Group();

  const material = new THREE.MeshStandardMaterial({
    color: 0x9fe8ff,
    emissive: 0x2aa8ff,
    emissiveIntensity: 1.25,
    roughness: 0.14,
    metalness: 0.22,
    transparent: true,
    opacity: 0.94,
  });

  const cuerpo = new THREE.Mesh(geoGotaCuerpo, material);
  cuerpo.scale.set(1, 1.32, 1);
  cuerpo.castShadow = true;

  const punta = new THREE.Mesh(geoGotaPunta, material);
  punta.position.y = 0.23;

  grupo.add(cuerpo, punta);

  const halo = new THREE.Mesh(
    geoHalo,
    new THREE.MeshBasicMaterial({
      color: 0x63d6ff,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = -0.42;
  grupo.add(halo);

  const angulo = Number(gota.angulo) || 0;
  const radio = Number(gota.radio) || 1.8;
  grupo.position.set(Math.cos(angulo) * radio, 0.72, Math.sin(angulo) * radio);
  grupo.scale.setScalar(0.01);
  grupo.userData = {
    gotaId: gota.id,
    baseY: 0.72,
    fase: Math.random() * Math.PI * 2,
    entrada: 0,
    saliendo: null,
    recogiendo: null,
    halo,
    material,
  };

  return grupo;
}

function quitarGota(grupo) {
  const id = grupo.userData.gotaId;
  grupoGotas.remove(grupo);
  if (id && gotasMap.get(id) === grupo) gotasMap.delete(id);
  grupo.traverse((hijo) => {
    if (hijo.isMesh && hijo.material) hijo.material.dispose();
  });
}

export function sincronizarGotas(gotas = []) {
  const ids = new Set(gotas.map((gota) => gota.id));

  for (const [id, grupo] of gotasMap) {
    if (ids.has(id)) continue;
    if (grupo.userData.recogiendo !== null) continue;
    if (grupo.userData.saliendo === null) grupo.userData.saliendo = 0;
  }

  for (const gota of gotas) {
    if (gotasMap.has(gota.id)) continue;
    const grupo = crearMallaGota(gota);
    grupoGotas.add(grupo);
    gotasMap.set(gota.id, grupo);
  }
}

export function limpiarGotas() {
  for (const grupo of Array.from(gotasMap.values())) {
    quitarGota(grupo);
  }
  gotasMap.clear();
}

export function recogerGotaAnimada(gotaId) {
  const grupo = gotasMap.get(gotaId);
  if (!grupo || grupo.userData.recogiendo !== null) return;
  grupo.userData.recogiendo = 0;
}

export function mallasGotas() {
  return Array.from(gotasMap.values());
}

export function obtenerIdGota(objeto) {
  let nodo = objeto;
  while (nodo && !(nodo.userData && nodo.userData.gotaId)) {
    nodo = nodo.parent;
  }
  return nodo ? nodo.userData.gotaId : null;
}

/* ------------------------------------------------------------------ */
/* Explosiones                                                         */
/* ------------------------------------------------------------------ */

const explosiones = [];
const luzExplosion = new THREE.PointLight(0xff8a00, 0, 12, 2);
scene.add(luzExplosion);

export function explosionEn(posicion, color = 0xff8a00) {
  const cantidad = 140;
  const posiciones = new Float32Array(cantidad * 3);
  const velocidades = [];

  for (let i = 0; i < cantidad; i += 1) {
    posiciones[i * 3] = posicion.x;
    posiciones[i * 3 + 1] = Math.max(posicion.y, 0.65);
    posiciones[i * 3 + 2] = posicion.z;
    velocidades.push(
      new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() * 1.1 + 0.25,
        Math.random() - 0.5,
      )
        .normalize()
        .multiplyScalar(1.4 + Math.random() * 4.4),
    );
  }

  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
  const material = new THREE.PointsMaterial({
    color,
    size: 0.13,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const puntos = new THREE.Points(geometria, material);
  scene.add(puntos);

  const onda = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.35, 48),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  onda.rotation.x = -Math.PI / 2;
  onda.position.set(posicion.x, 0.09, posicion.z);
  scene.add(onda);

  luzExplosion.color.set(color);
  luzExplosion.position.set(posicion.x, 1, posicion.z);
  luzExplosion.intensity = 60;

  const bola = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texFuego, color, transparent: true, opacity: 1,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    }),
  );
  bola.position.set(posicion.x, Math.max(posicion.y, 0.8), posicion.z);
  scene.add(bola);

  explosiones.push({
    puntos,
    geometria,
    material,
    velocidades,
    onda,
    bola,
    vida: 0,
    maxVida: 1.15,
  });
}

/* ------------------------------------------------------------------ */
/* Jugadores                                                           */
/* ------------------------------------------------------------------ */

export function crearJugador(nombre, indice) {
  const grupo = new THREE.Group();
  const color = new THREE.Color(COLORES[indice % COLORES.length]);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    metalness: 0.05,
  });

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.38, 0.12, 20),
    material,
  );
  base.position.y = 0.06;
  base.castShadow = true;
  base.receiveShadow = true;
  grupo.add(base);

  const cuerpo = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.25, 0.55, 4, 10),
    material,
  );
  cuerpo.position.y = 0.62;
  cuerpo.castShadow = true;
  grupo.add(cuerpo);

  const cabeza = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xffd7b5, roughness: 0.9 }),
  );
  cabeza.position.y = 1.18;
  cabeza.castShadow = true;
  grupo.add(cabeza);

  material.emissive.copy(color).multiplyScalar(0.12);
  const blanco = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const negro = new THREE.MeshBasicMaterial({ color: 0x0b0f1a });
  for (const lado of [-1, 1]) {
    const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 10), blanco);
    ojo.position.set(lado * 0.095, 1.22, 0.195);
    const pupila = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), negro);
    pupila.position.set(lado * 0.095, 1.22, 0.24);
    const brazo = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.34, 4, 8), material);
    brazo.position.set(lado * 0.33, 0.66, 0.06);
    brazo.rotation.set(-0.25, 0, -lado * 0.35);
    brazo.castShadow = true;
    grupo.add(ojo, pupila, brazo);
  }

  const gorro = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.34, 14),
    new THREE.MeshStandardMaterial({ color: color.clone().offsetHSL(0, 0, 0.12), roughness: 0.6 }),
  );
  gorro.position.set(0, 1.5, 0);
  gorro.rotation.z = 0.12;
  gorro.castShadow = true;
  grupo.add(gorro);

  const anilloBase = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.022, 8, 40),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }),
  );
  anilloBase.rotation.x = Math.PI / 2;
  anilloBase.position.y = 0.025;
  grupo.add(anilloBase);

  const div = document.createElement('div');
  div.className = 'jugador-label';
  div.textContent = nombre;
  const etiqueta = new CSS2DObject(div);
  etiqueta.position.set(0, 1.95, 0);
  grupo.add(etiqueta);

  grupo.userData = {
    nombre,
    indice,
    labelDiv: div,
    color: `#${color.getHexString()}`,
  };
  return grupo;
}

export function posicionEnCirculo(indice, total) {
  const angulo = (indice / total) * Math.PI * 2 - Math.PI / 2;
  return new THREE.Vector3(Math.cos(angulo) * RADIO, 0, Math.sin(angulo) * RADIO);
}

export function tweenPosition(objeto, destino, duracion, arco = 0) {
  return new Promise((resolve) => {
    const desde = objeto.position.clone();
    const inicio = performance.now();
    const tiempo = Math.max(1, duracion);

    function paso(ahora) {
      const t = Math.min((ahora - inicio) / tiempo, 1);
      const e = t * t * (3 - 2 * t);
      objeto.position.lerpVectors(desde, destino, e);
      if (arco) {
        objeto.position.y += Math.sin(Math.PI * e) * arco;
      }
      if (t < 1) requestAnimationFrame(paso);
      else resolve();
    }

    requestAnimationFrame(paso);
  });
}

function destinoPapa(jugador) {
  const destino = new THREE.Vector3(
    jugador.position.x,
    1,
    jugador.position.z,
  );
  const haciaCentro = new THREE.Vector3(0, 0, 0)
    .sub(jugador.position)
    .setY(0)
    .normalize()
    .multiplyScalar(0.6);
  destino.add(haciaCentro);
  return destino;
}

export async function moverPapaA(jugador, duracion = 380) {
  potato.visible = true;
  potato.userData.moviendo = true;
  const destino = destinoPapa(jugador);
  await tweenPosition(potato, destino, duracion, 0.5);
  potato.userData.moviendo = false;
  potato.userData.baseY = destino.y;
}

export function colocarPapaEn(jugador) {
  if (!jugador) {
    potato.visible = false;
    return;
  }
  const destino = destinoPapa(jugador);
  potato.position.copy(destino);
  potato.userData.baseY = destino.y;
  potato.userData.moviendo = false;
  potato.visible = true;
}

export function resaltarActual(jugador) {
  if (!jugador) {
    aroActual.visible = false;
    return;
  }
  aroActual.position.set(jugador.position.x, 0.04, jugador.position.z);
  aroActual.visible = true;
}

export async function eliminarJugador(jugador) {
  jugador.userData.labelDiv.classList.add('fuera');

  const inicio = performance.now();
  const duracion = 500;

  await new Promise((resolve) => {
    function paso(ahora) {
      const t = Math.min((ahora - inicio) / duracion, 1);
      const e = t * t * (3 - 2 * t);
      jugador.scale.setScalar(1 - 0.9 * e);
      jugador.position.y = -e * 0.9;
      if (t < 1) requestAnimationFrame(paso);
      else resolve();
    }
    requestAnimationFrame(paso);
  });

  jugador.visible = false;
}

export async function reubicarJugadores(jugadores) {
  const total = jugadores.length;
  await Promise.all(
    jugadores.map((jugador, indice) =>
      tweenPosition(jugador, posicionEnCirculo(indice, total), 460),
    ),
  );
}

export async function celebrarGanador(jugador) {
  jugador.userData.labelDiv.classList.add('ganador');
  jugador.userData.labelDiv.textContent = `🏆 ${jugador.userData.nombre}`;

  const inicio = performance.now();
  const duracion = 1200;

  await new Promise((resolve) => {
    function paso(ahora) {
      const t = Math.min((ahora - inicio) / duracion, 1);
      jugador.position.y = Math.abs(Math.sin(t * Math.PI * 4)) * (1 - t) * 0.35;
      jugador.scale.setScalar(1 + Math.sin(t * Math.PI * 8) * 0.03 * (1 - t));
      if (t < 1) requestAnimationFrame(paso);
      else {
        jugador.position.y = 0;
        jugador.scale.setScalar(1);
        resolve();
      }
    }
    requestAnimationFrame(paso);
  });
}

/* ------------------------------------------------------------------ */
/* Cámara                                                              */
/* ------------------------------------------------------------------ */

const ejeY = new THREE.Vector3(0, 1, 0);

export function girarCamara(delta) {
  const desplazamiento = camera.position.clone().sub(controls.target);
  desplazamiento.applyAxisAngle(ejeY, delta);
  camera.position.copy(controls.target).add(desplazamiento);
  controls.update();
}

export function acercarCamara(factor) {
  const desplazamiento = camera.position.clone().sub(controls.target);
  const distancia = THREE.MathUtils.clamp(
    desplazamiento.length() * factor,
    controls.minDistance,
    controls.maxDistance,
  );
  desplazamiento.setLength(distancia);
  camera.position.copy(controls.target).add(desplazamiento);
  controls.update();
}

/* ------------------------------------------------------------------ */
/* Bucle de entorno                                                    */
/* ------------------------------------------------------------------ */

let tiempo = 0;

function suave(t) {
  return t * t * (3 - 2 * t);
}

function actualizarFogata(dt) {
  for (const s of particulasFuego) {
    const d = s.userData;
    d.vida += dt;
    if (d.vida >= d.max) reiniciarLlama(s);
    const t = d.vida / d.max;
    s.position.set(
      d.x + Math.sin(tiempo * 5 + d.x * 20) * 0.05 * t,
      0.45 + t * 1.15,
      d.z + Math.cos(tiempo * 4 + d.z * 20) * 0.05 * t,
    );
    s.scale.setScalar(0.72 * (1 - t * 0.75) + 0.1);
    s.material.opacity = Math.sin(Math.PI * Math.min(1, t * 1.15)) * 0.9;
    s.material.color.setHSL(0.12 - t * 0.09, 1, 0.62 - t * 0.2);
  }
  for (const s of humo) {
    const d = s.userData;
    d.vida += dt;
    if (d.vida >= d.max) {
      d.vida = 0;
      d.max = 2.4 + Math.random();
      d.dx = (Math.random() - 0.5) * 0.8;
      d.dz = (Math.random() - 0.5) * 0.8;
    }
    const t = d.vida / d.max;
    s.position.set(d.dx * t, 1.3 + t * 1.8, d.dz * t);
    s.scale.setScalar(0.7 + t * 1.7);
    s.material.opacity = Math.sin(Math.PI * t) * 0.22;
  }
  if (charcoLuz) {
    charcoLuz.material.opacity = 0.28 + Math.sin(tiempo * 8.3) * 0.04 + Math.sin(tiempo * 21) * 0.02;
  }

  for (let i = 0; i < llamas.length; i += 1) {
    const llama = llamas[i];
    const pulso = 1 + Math.sin(tiempo * (6.5 + i * 1.3) + i) * 0.14;
    llama.scale.set(pulso, 1 + Math.sin(tiempo * (5 + i) + i * 2) * 0.2, pulso);
    llama.position.y =
      llama.userData.baseY + Math.sin(tiempo * 4.6 + i) * 0.032;
    llama.rotation.y += dt * (0.5 + i * 0.22);
    llama.material.opacity =
      0.52 + Math.sin(tiempo * 7.5 + i * 1.4) * 0.14;
  }

  luzFogata.intensity =
    5.6 + Math.sin(tiempo * 8.3) * 0.85 + Math.sin(tiempo * 21) * 0.4;

  if (brasas) {
    const atributo = brasas.geometry.getAttribute('position');
    const posiciones = atributo.array;
    const velocidades = brasas.userData.velocidades;
    for (let i = 0; i < velocidades.length; i += 1) {
      posiciones[i * 3 + 1] += velocidades[i] * dt;
      if (posiciones[i * 3 + 1] > 2.4) {
        const angulo = Math.random() * Math.PI * 2;
        const radio = Math.random() * 0.28;
        posiciones[i * 3] = Math.cos(angulo) * radio;
        posiciones[i * 3 + 1] = 0.55;
        posiciones[i * 3 + 2] = Math.sin(angulo) * radio;
      }
    }
    atributo.needsUpdate = true;
  }
}

function actualizarGotas(dt) {
  for (const [id, grupo] of Array.from(gotasMap.entries())) {
    const datos = grupo.userData;

    if (datos.recogiendo !== null) {
      datos.recogiendo = Math.min(datos.recogiendo + dt * 1.9, 1);
      const t = suave(datos.recogiendo);
      grupo.position.y = datos.baseY + t * 1.9;
      grupo.scale.setScalar(Math.max(0.001, 1 - t));
      grupo.rotation.y += dt * 9;
      datos.halo.material.opacity = Math.max(0, 0.55 * (1 - t));
      if (datos.recogiendo >= 1) quitarGota(grupo);
      continue;
    }

    if (datos.saliendo !== null) {
      datos.saliendo = Math.min(datos.saliendo + dt * 2.4, 1);
      const t = suave(datos.saliendo);
      grupo.scale.setScalar(Math.max(0.001, 1 - t));
      grupo.position.y = datos.baseY + t * 0.6;
      if (datos.saliendo >= 1) quitarGota(grupo);
      continue;
    }

    if (datos.entrada < 1) {
      datos.entrada = Math.min(1, datos.entrada + dt * 2.6);
    }
    const entrada = suave(datos.entrada);
    const flotar = Math.sin(tiempo * 2.2 + datos.fase) * 0.075;

    grupo.scale.setScalar(entrada);
    grupo.position.y = datos.baseY + flotar;
    grupo.rotation.y += dt * 0.9;
    datos.halo.rotation.z += dt * 0.55;
    datos.halo.scale.setScalar(1 + Math.sin(tiempo * 3 + datos.fase) * 0.09);
    datos.material.emissiveIntensity =
      1.1 + Math.sin(tiempo * 4 + datos.fase) * 0.25;
    if (gotasMap.get(id) !== grupo) continue;
  }
}

function actualizarExplosiones(dt) {
  for (let i = explosiones.length - 1; i >= 0; i -= 1) {
    const ex = explosiones[i];
    ex.vida += dt;
    const t = Math.min(ex.vida / ex.maxVida, 1);

    if (ex.puntos) {
      const atributo = ex.geometria.getAttribute('position');
      const posiciones = atributo.array;
      for (let j = 0; j < ex.velocidades.length; j += 1) {
        const v = ex.velocidades[j];
        v.y -= 6.8 * dt;
        posiciones[j * 3] += v.x * dt;
        posiciones[j * 3 + 1] += v.y * dt;
        posiciones[j * 3 + 2] += v.z * dt;
        if (posiciones[j * 3 + 1] < 0.06) {
          posiciones[j * 3 + 1] = 0.06;
          v.y *= -0.32;
          v.x *= 0.72;
          v.z *= 0.72;
        }
      }
      atributo.needsUpdate = true;
      ex.material.opacity = Math.max(0, 1 - t);
      ex.material.size = 0.13 + t * 0.06;
    }

    if (ex.onda) {
      ex.onda.scale.setScalar(1 + t * 5.5);
      ex.onda.material.opacity = Math.max(0, 0.9 * (1 - t));
    }

    if (ex.bola) {
      ex.bola.scale.setScalar(0.8 + t * 4.2);
      ex.bola.material.opacity = Math.max(0, 1 - t * 1.4);
    }

    if (t >= 1) {
      if (ex.bola) {
        scene.remove(ex.bola);
        ex.bola.material.dispose();
      }
      if (ex.puntos) {
        scene.remove(ex.puntos);
        ex.geometria.dispose();
        ex.material.dispose();
      }
      if (ex.onda) {
        scene.remove(ex.onda);
        ex.onda.geometry.dispose();
        ex.onda.material.dispose();
      }
      explosiones.splice(i, 1);
    }
  }
}

export function updateEnvironment(dt) {
  tiempo += dt;

  potato.rotation.y += dt * 1.5;
  auraPapa.material.opacity = 0.7 + Math.sin(tiempo * 6) * 0.15;
  estrellas.material.opacity = 0.7 + Math.sin(tiempo * 1.3) * 0.15;
  actualizarLuciernagas(tiempo);
  luzExplosion.intensity *= Math.exp(-dt * 5);
  if (luzExplosion.intensity < 0.05) luzExplosion.intensity = 0;
  if (potato.visible && !potato.userData.moviendo) {
    potato.position.y =
      (potato.userData.baseY ?? 1) + Math.sin(tiempo * 3) * 0.04;
    luzPapa.intensity = 2.3 + Math.sin(tiempo * 6) * 0.5;
  }

  if (aroActual.visible) {
    aroActual.scale.setScalar(1 + Math.sin(tiempo * 3) * 0.05);
  }

  actualizarFogata(dt);
  actualizarGotas(dt);
  actualizarExplosiones(dt);
}

export function eliminarObjeto(objeto) {
  scene.remove(objeto);
  objeto.traverse((hijo) => {
    if (hijo.isMesh) {
      hijo.geometry.dispose();
      if (Array.isArray(hijo.material)) {
        hijo.material.forEach((material) => material.dispose());
      } else {
        hijo.material.dispose();
      }
    }
  });
  if (objeto.userData?.labelDiv) {
    objeto.userData.labelDiv.remove();
  }
}

export function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', resize);
