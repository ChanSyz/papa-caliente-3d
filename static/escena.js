import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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

export const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x080d18, 0.022);

export const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 7.6, 9.8);

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

scene.add(new THREE.HemisphereLight(0xbfd0ff, 0x1a1f2e, 1.25));

const luz = new THREE.DirectionalLight(0xffffff, 1.7);
luz.position.set(-5, 9, 5);
luz.castShadow = true;
luz.shadow.mapSize.set(1536, 1536);
luz.shadow.camera.near = 1;
luz.shadow.camera.far = 30;
luz.shadow.camera.left = -8;
luz.shadow.camera.right = 8;
luz.shadow.camera.top = 8;
luz.shadow.camera.bottom = -8;
scene.add(luz);

const suelo = new THREE.Mesh(
  new THREE.CylinderGeometry(RADIO + 1.2, RADIO + 1.2, 0.16, 64),
  new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.95,
    metalness: 0.05,
  }),
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

export const potato = new THREE.Group();
const papa = new THREE.Mesh(
  new THREE.SphereGeometry(0.17, 18, 14),
  new THREE.MeshStandardMaterial({
    color: 0xffb347,
    emissive: 0xff6a00,
    emissiveIntensity: 1.4,
    roughness: 0.45,
  }),
);
papa.castShadow = true;
potato.add(papa);
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
let luzFogata;
let brasas;

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

  const luzGota = new THREE.PointLight(0x4fc3ff, 1.1, 1.9, 2);
  grupo.add(luzGota);

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

export function explosionEn(posicion, color = 0xff8a00) {
  const cantidad = 90;
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

  explosiones.push({
    puntos,
    geometria,
    material,
    velocidades,
    onda,
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

  const div = document.createElement('div');
  div.className = 'jugador-label';
  div.textContent = nombre;
  const etiqueta = new CSS2DObject(div);
  etiqueta.position.set(0, 1.65, 0);
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

    if (t >= 1) {
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
}

window.addEventListener('resize', resize);
