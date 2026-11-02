import * as THREE from 'three';
import {
  scene,
  camera,
  renderer,
  labelRenderer,
  controls,
  crearJugador,
  posicionEnCirculo,
  moverPapaA,
  colocarPapaEn,
  resaltarActual,
  eliminarJugador,
  reubicarJugadores,
  celebrarGanador,
  updateEnvironment,
  eliminarObjeto,
  sincronizarGotas,
  limpiarGotas,
  recogerGotaAnimada,
  mallasGotas,
  obtenerIdGota,
  explosionEn,
  girarCamara,
  acercarCamara,
} from './escena.js?v=7';

const numInput = document.querySelector('#numJugadores');
const numVal = document.querySelector('#numVal');
const btnNueva = document.querySelector('#btnNueva');
const infoJuego = document.querySelector('#infoJuego');
const mechaCard = document.querySelector('#mechaCard');
const mechaNum = document.querySelector('#mechaNum');
const gotasNum = document.querySelector('#gotasNum');
const aguaCard = document.querySelector('#aguaCard');
const actualNombre = document.querySelector('#actualNombre');
const destinosEl = document.querySelector('#destinos');
const circuloEl = document.querySelector('#circulo');
const estadoEl = document.querySelector('#estado');
const resultadoEl = document.querySelector('#resultado');
const flashEl = document.querySelector('#flash');

const raycaster = new THREE.Raycaster();
const puntero = new THREE.Vector2();

let jugadores = [];
let grupos = new Map();
let actual = null;
let jugando = false;
let fin = false;
let ocupado = false;
let pointerDown = null;

const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function nombresPorDefecto(cantidad) {
  return Array.from({ length: cantidad }, (_, i) => `Jugador ${i + 1}`);
}

function pedir(url, cuerpo) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  }).then(async (respuesta) => {
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(datos.error || `Error del servidor (${respuesta.status})`);
    }
    return datos;
  });
}

function limpiarJugadores() {
  for (const jugador of jugadores) {
    eliminarObjeto(jugador);
  }
  jugadores = [];
  grupos = new Map();
  resaltarActual(null);
  colocarPapaEn(null);
}

function crearJugadores(nombres) {
  limpiarJugadores();
  nombres.forEach((nombre, indice) => {
    const jugador = crearJugador(nombre, indice);
    jugador.position.copy(posicionEnCirculo(indice, nombres.length));
    jugador.lookAt(0, 0, 0);
    scene.add(jugador);
    jugadores.push(jugador);
    grupos.set(nombre, jugador);
  });
}

function actualizarCirculo(nombres) {
  circuloEl.textContent = nombres.length
    ? `${nombres.join(' → ')} → ↺`
    : '—';
}

function actualizarGotas(gotas = []) {
  gotasNum.textContent = String(gotas.length);
  aguaCard.classList.toggle('vacia', gotas.length === 0);
}

function mostrarMecha(valor, explotar = false) {
  mechaNum.textContent = valor;
  mechaCard.classList.toggle('alerta', valor > 0 && valor <= 3);
  if (explotar) {
    mechaCard.classList.remove('boom');
    void mechaCard.offsetWidth;
    mechaCard.classList.add('boom');
  }
}

function destello() {
  flashEl.classList.remove('boom');
  void flashEl.offsetWidth;
  flashEl.classList.add('boom');
}

function bloquearDestinos(bloqueado) {
  destinosEl.querySelectorAll('button').forEach((boton) => {
    boton.disabled = bloqueado;
  });
}

function renderDestinos() {
  destinosEl.innerHTML = '';

  const opciones = jugadores.filter(
    (jugador) => jugador.userData.nombre !== actual,
  );

  if (opciones.length === 0) {
    const aviso = document.createElement('p');
    aviso.className = 'sin-destinos';
    aviso.textContent = 'No hay más jugadores.';
    destinosEl.appendChild(aviso);
    return;
  }

  for (const jugador of opciones) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'destino-btn';
    boton.disabled = ocupado || fin;

    const punto = document.createElement('span');
    punto.className = 'dot';
    punto.style.background = jugador.userData.color;

    const texto = document.createElement('span');
    texto.textContent = jugador.userData.nombre;

    boton.append(punto, texto);
    boton.addEventListener('click', () => pasarPapa(jugador.userData.nombre));
    destinosEl.appendChild(boton);
  }
}

function marcarActual(nombre) {
  actual = nombre;
  actualNombre.textContent = nombre ?? '—';
  resaltarActual(nombre ? grupos.get(nombre) : null);
  renderDestinos();
}

function vistaPrevia(actualizarEstado = true) {
  if (ocupado) return;

  jugando = false;
  fin = false;
  actual = null;
  crearJugadores(nombresPorDefecto(Number(numInput.value)));
  limpiarGotas();
  actualizarGotas([]);
  infoJuego.hidden = true;
  resultadoEl.hidden = true;
  resultadoEl.textContent = '';
  numInput.disabled = false;
  btnNueva.disabled = false;
  btnNueva.textContent = 'Empezar partida';

  if (actualizarEstado) {
    estadoEl.textContent =
      'Elige cuántos jugadores y pulsa Empezar partida.';
  }
}

async function nuevaPartida() {
  if (ocupado) return;

  ocupado = true;
  btnNueva.disabled = true;
  numInput.disabled = true;
  estadoEl.textContent = 'Barajando la lista circular…';

  try {
    const datos = await pedir('/api/nueva', {
      jugadores: nombresPorDefecto(Number(numInput.value)),
    });

    crearJugadores(datos.jugadores);
    limpiarGotas();
    sincronizarGotas(datos.gotas);
    jugando = true;
    fin = false;
    infoJuego.hidden = false;
    resultadoEl.hidden = true;
    resultadoEl.textContent = '';
    btnNueva.textContent = 'Nueva partida';
    actualizarCirculo(datos.jugadores);
    actualizarGotas(datos.gotas);
    marcarActual(datos.actual);
    mostrarMecha(datos.mecha);
    colocarPapaEn(grupos.get(datos.actual));
    estadoEl.textContent = `${datos.actual} tiene la papa. Elige a quién pasarla o recoge una gota 💧.`;
  } catch (error) {
    estadoEl.textContent = `Error: ${error.message}`;
    vistaPrevia(false);
  } finally {
    ocupado = false;
    btnNueva.disabled = false;
    numInput.disabled = jugando && !fin;
    bloquearDestinos(fin);
  }
}

async function eliminarDelCirculo(nombre) {
  const jugador = grupos.get(nombre);
  if (!jugador) return;

  destello();
  explosionEn(jugador.position.clone().setY(0.95), 0xff7b2e);
  estadoEl.textContent = `¡Boom! ${nombre} queda fuera.`;
  mostrarMecha(0, true);

  grupos.delete(nombre);
  jugadores = jugadores.filter((item) => item !== jugador);
  await dormir(180);
  await eliminarJugador(jugador);
  eliminarObjeto(jugador);

  if (jugadores.length > 1) {
    await reubicarJugadores(jugadores);
    jugadores.forEach((item) => item.lookAt(0, 0, 0));
  }
}

async function pasarPapa(destino) {
  if (!jugando || fin || ocupado) return;
  if (destino === actual || !grupos.has(destino)) return;

  ocupado = true;
  bloquearDestinos(true);
  estadoEl.textContent = `Pasando la papa a ${destino}…`;

  try {
    await moverPapaA(grupos.get(destino), 340);
    const datos = await pedir('/api/pasar', { destino });

    actualizarCirculo(datos.jugadores);
    mostrarMecha(datos.mecha);
    sincronizarGotas(datos.gotas);
    actualizarGotas(datos.gotas);

    if (datos.eliminado) {
      await eliminarDelCirculo(datos.eliminado);
      if (!datos.fin) {
        mostrarMecha(datos.mecha);
      }
    }

    if (datos.fin) {
      fin = true;
      marcarActual(datos.ganador);
      colocarPapaEn(null);
      estadoEl.textContent = `¡${datos.ganador} es el último en el círculo!`;
      await dormir(260);
      await celebrarGanador(grupos.get(datos.ganador));
      resultadoEl.textContent = `🏆 Gana ${datos.ganador}`;
      resultadoEl.hidden = false;
      btnNueva.textContent = 'Jugar otra vez';
      numInput.disabled = false;
    } else {
      marcarActual(datos.actual);
      if (!datos.eliminado) {
        estadoEl.textContent = `${datos.actual} tiene la papa. Elige a quién pasarla o recoge una gota 💧.`;
      } else {
        colocarPapaEn(grupos.get(datos.actual));
        estadoEl.textContent =
          `La mecha se reinicia con ${datos.actual}: ${datos.mecha} pases.`;
      }
    }
  } catch (error) {
    estadoEl.textContent = `Error: ${error.message}`;
    if (actual && grupos.has(actual)) {
      colocarPapaEn(grupos.get(actual));
    }
  } finally {
    ocupado = false;
    btnNueva.disabled = false;
    bloquearDestinos(fin);
  }
}

async function recogerGota(gotaId) {
  if (!jugando || fin || ocupado || !gotaId) return;

  ocupado = true;
  bloquearDestinos(true);
  estadoEl.textContent = 'Recogiendo agua para enfriar la mecha…';

  try {
    const datos = await pedir('/api/recoger', { gota_id: gotaId });

    recogerGotaAnimada(datos.recogida.id);
    sincronizarGotas(datos.gotas);
    actualizarGotas(datos.gotas);
    mostrarMecha(datos.mecha);

    mechaCard.classList.remove('refresco');
    void mechaCard.offsetWidth;
    mechaCard.classList.add('refresco');

    estadoEl.textContent = `💧 ¡Agua recogida! La mecha sube a ${datos.mecha} pases.`;
  } catch (error) {
    estadoEl.textContent = `Error: ${error.message}`;
  } finally {
    ocupado = false;
    btnNueva.disabled = false;
    bloquearDestinos(fin);
  }
}

function jugadorBajoElPuntero(evento) {
  const rect = renderer.domElement.getBoundingClientRect();
  puntero.x = ((evento.clientX - rect.left) / rect.width) * 2 - 1;
  puntero.y = -((evento.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(puntero, camera);

  const visibles = jugadores.filter((jugador) => jugador.visible);
  const impactos = raycaster.intersectObjects(visibles, true);

  for (const impacto of impactos) {
    let objeto = impacto.object;
    while (objeto && !visibles.includes(objeto)) {
      objeto = objeto.parent;
    }
    if (objeto) return objeto;
  }
  return null;
}

function gotaBajoElPuntero(evento) {
  const rect = renderer.domElement.getBoundingClientRect();
  puntero.x = ((evento.clientX - rect.left) / rect.width) * 2 - 1;
  puntero.y = -((evento.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(puntero, camera);

  const impactos = raycaster.intersectObjects(mallasGotas(), true);
  if (!impactos.length) return null;
  return obtenerIdGota(impactos[0].object);
}

renderer.domElement.addEventListener('pointerdown', (evento) => {
  if (evento.button !== 0 && evento.pointerType === 'mouse') return;
  pointerDown = { x: evento.clientX, y: evento.clientY };
});

renderer.domElement.addEventListener('click', (evento) => {
  const eraArrastre = pointerDown
    ? Math.hypot(evento.clientX - pointerDown.x, evento.clientY - pointerDown.y) > 7
    : false;
  pointerDown = null;
  if (eraArrastre) return;
  if (!jugando || fin || ocupado) return;

  const gotaId = gotaBajoElPuntero(evento);
  if (gotaId) {
    recogerGota(gotaId);
    return;
  }

  const jugador = jugadorBajoElPuntero(evento);
  if (!jugador) return;
  if (jugador.userData.nombre === actual) {
    estadoEl.textContent = 'La papa ya está contigo. Elige a otro jugador.';
    return;
  }
  pasarPapa(jugador.userData.nombre);
});

renderer.domElement.addEventListener('pointermove', (evento) => {
  if (!jugando || fin || ocupado) {
    renderer.domElement.style.cursor = 'grab';
    return;
  }

  const gotaId = gotaBajoElPuntero(evento);
  if (gotaId) {
    renderer.domElement.style.cursor = 'pointer';
    return;
  }

  const jugador = jugadorBajoElPuntero(evento);
  const pulsa = jugador && jugador.userData.nombre !== actual;
  renderer.domElement.style.cursor = pulsa ? 'pointer' : 'grab';
});

function configurarTeclado() {
  window.addEventListener('keydown', (evento) => {
    if (evento.target instanceof HTMLInputElement) return;

    if (evento.key === 'ArrowLeft') {
      evento.preventDefault();
      girarCamara(0.16);
    } else if (evento.key === 'ArrowRight') {
      evento.preventDefault();
      girarCamara(-0.16);
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      acercarCamara(0.9);
    } else if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      acercarCamara(1.1);
    } else if (evento.key === 'r' || evento.key === 'R') {
      evento.preventDefault();
      nuevaPartida();
    }
  });
}

numInput.addEventListener('input', () => {
  numVal.textContent = numInput.value;
  vistaPrevia();
});

btnNueva.addEventListener('click', nuevaPartida);
configurarTeclado();

let anterior = performance.now();

function animar(ahora) {
  const dt = Math.min((ahora - anterior) / 1000, 0.05);
  anterior = ahora;

  updateEnvironment(dt);
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);

  requestAnimationFrame(animar);
}

numVal.textContent = numInput.value;
vistaPrevia();
requestAnimationFrame(animar);

if (location.hostname === '127.0.0.1' || location.hostname === 'localhost') {
  const proyectar = (objeto, altura = 0.7) => {
    const punto = objeto.position.clone();
    punto.y += altura;
    punto.project(camera);
    return {
      x: (punto.x * 0.5 + 0.5) * window.innerWidth,
      y: (-punto.y * 0.5 + 0.5) * window.innerHeight,
    };
  };

  window.papaDebug = {
    estado: () => ({
      actual,
      fin,
      jugando,
      ocupado,
      gotas: Number(gotasNum.textContent),
      mecha: Number(mechaNum.textContent),
    }),
    gotas: () =>
      mallasGotas().map((grupo) => ({
        id: grupo.userData.gotaId,
        ...proyectar(grupo, 0),
      })),
    jugadores: () =>
      jugadores.map((jugador) => ({
        nombre: jugador.userData.nombre,
        ...proyectar(jugador),
      })),
    camara: () => camera.position.toArray(),
  };
}
