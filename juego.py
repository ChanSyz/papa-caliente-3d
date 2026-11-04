"""Lógica de la papa caliente usando la ListaCircular del profesor."""

import math
import random
import uuid

from lista_circular import ListaCircular

MECHA_MIN = 4
MECHA_MAX = 9
MECHA_MAXIMA_AGUA = 12
GOTAS_INICIALES = 3
PROB_BOT_SIGUIENTE = 0.4


def nueva_lista():
    """Crea la lista y ejecuta su init(), porque la clase lo define aparte."""
    lista = ListaCircular()
    lista.init()
    return lista


def crear_partida(nombres, mecha=None):
    """Crea la lista circular y devuelve (lista, nodo_actual, mecha)."""
    if len(nombres) < 2:
        raise ValueError("Se necesitan al menos 2 jugadores.")

    lista = nueva_lista()
    for nombre in nombres:
        if lista.contiene(nombre):
            raise ValueError("Los nombres deben ser únicos.")
        lista.insertar_final(nombre)

    actual = lista.cabeza
    if mecha is None:
        mecha = random.randint(MECHA_MIN, MECHA_MAX)
    return lista, actual, mecha


def crear_gota():
    """Crea una gota de agua con una posición 3D estable."""
    return {
        "id": uuid.uuid4().hex[:8],
        "angulo": round(random.uniform(0, math.tau), 4),
        "radio": round(random.uniform(1.35, 2.35), 4),
    }


def crear_gotas(cantidad=GOTAS_INICIALES):
    """Reparte las gotas alrededor del centro de la mesa."""
    base = random.uniform(0, math.tau)
    gotas = []
    for indice in range(cantidad):
        gota = crear_gota()
        gota["angulo"] = round(
            (base + indice * (math.tau / cantidad) + random.uniform(-0.22, 0.22))
            % math.tau,
            4,
        )
        gotas.append(gota)
    return gotas


def recoger_gota(gotas, mecha, gota_id):
    """Recoge una gota y enfría la mecha un punto.

    Devuelve la mecha nueva, la lista de gotas restantes y la gota recogida.
    """
    if not isinstance(gota_id, str) or not gota_id:
        raise ValueError("La gota indicada no es válida.")
    if mecha >= MECHA_MAXIMA_AGUA:
        raise ValueError("La mecha ya está al máximo; no necesita más agua.")

    for indice, gota in enumerate(gotas):
        if gota["id"] == gota_id:
            gotas.pop(indice)
            return {
                "mecha": mecha + 1,
                "gotas": gotas,
                "gota": gota,
            }

    raise ValueError("Esa gota ya fue recogida.")


def reponer_gota(gotas):
    """Después de una explosión vuelve a dejar hasta tres gotas."""
    while len(gotas) < GOTAS_INICIALES:
        gotas.append(crear_gota())
    return gotas


def pasar_papa(lista, actual, mecha, destino):
    """Pasa la papa a otro jugador y descuenta un paso de la mecha.

    Si la mecha llega a cero, el jugador que recibe la papa queda eliminado.
    Devuelve un diccionario con el nuevo estado.
    """
    if lista is None or lista.esta_vacia():
        raise ValueError("No hay una partida activa.")
    if len(lista.recorrer()) < 2:
        raise ValueError("La partida ya terminó.")
    if not lista.contiene(destino):
        raise ValueError("Ese jugador ya no está en el círculo.")
    if actual is None:
        actual = lista.cabeza
    if destino == actual.dato:
        raise ValueError("La papa ya está con ese jugador.")

    objetivo = actual
    while objetivo.dato != destino:
        objetivo = objetivo.siguiente
        if objetivo is actual:
            raise ValueError("No se encontró al jugador en el círculo.")

    mecha -= 1
    eliminado = None
    ganador = None

    if mecha <= 0:
        eliminado = objetivo.dato
        siguiente = objetivo.siguiente
        lista.eliminar(eliminado)

        if lista.esta_vacia():
            ganador = eliminado
            actual = None
            mecha = 0
        elif len(lista.recorrer()) == 1:
            actual = lista.cabeza
            ganador = actual.dato
            mecha = 0
        else:
            actual = siguiente
            mecha = random.randint(MECHA_MIN, MECHA_MAX)
    else:
        actual = objetivo

    return {
        "lista": lista,
        "actual": actual,
        "mecha": mecha,
        "eliminado": eliminado,
        "ganador": ganador,
    }


def estado_partida(
    lista,
    actual,
    mecha,
    eliminado=None,
    ganador=None,
    gotas=None,
    recogida=None,
):
    """Convierte el estado del juego a algo que se puede enviar como JSON."""
    datos = {
        "jugadores": lista.recorrer(),
        "actual": actual.dato if actual is not None else None,
        "mecha": mecha,
        "eliminado": eliminado,
        "ganador": ganador,
        "fin": ganador is not None,
        "gotas": list(gotas or []),
    }
    if recogida is not None:
        datos["recogida"] = recogida
    return datos


def candidatos_bot(lista, actual):
    """Jugadores a los que puede pasar un bot, en el orden del círculo.

    Recorre la lista con ``siguiente`` empezando por quien sigue a ``actual``.
    Solo lee la ListaCircular; no la modifica.
    """
    if lista is None or lista.esta_vacia():
        raise ValueError("No hay una partida activa.")
    if actual is None:
        actual = lista.cabeza

    candidatos = []
    nodo = actual.siguiente
    while nodo is not actual:
        candidatos.append(nodo.dato)
        nodo = nodo.siguiente
    return candidatos


def elegir_destino_bot(lista, actual, azar=random):
    """El bot elige a quién pasar: el siguiente del círculo o uno al azar."""
    candidatos = candidatos_bot(lista, actual)
    if not candidatos:
        raise ValueError("No hay a quién pasarle la papa.")
    if azar.random() < PROB_BOT_SIGUIENTE:
        return candidatos[0]
    return azar.choice(candidatos)


def bot_quiere_agua(mecha, gotas, ya_tomo_agua=False, azar=random):
    """Devuelve el id de la gota que el bot recoge, o None si no recoge.

    Con mecha 1 el bot prefiere pasar (el que recibe explota). Con mecha 2
    suele tomar agua para no dejarle la mecha en 1 al siguiente jugador.
    """
    if ya_tomo_agua or not gotas or mecha >= MECHA_MAXIMA_AGUA or mecha == 1:
        return None
    probabilidad = 0.75 if mecha == 2 else 0.1
    if azar.random() < probabilidad:
        return azar.choice(gotas)["id"]
    return None
