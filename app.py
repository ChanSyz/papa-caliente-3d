"""Servidor Flask de Papa Caliente 3D."""

import os

from flask import Flask, jsonify, render_template, request, session

from juego import (
    crear_gotas,
    crear_partida,
    estado_partida,
    nueva_lista,
    pasar_papa,
    recoger_gota,
    reponer_gota,
)

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "papa-caliente-3d-demo")
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_NAME="papa3d_session",
)


def _nombres_validos(datos):
    nombres = datos.get("jugadores", [])
    if not isinstance(nombres, list):
        raise ValueError("La lista de jugadores no es válida.")
    if not (2 <= len(nombres) <= 10):
        raise ValueError("Debe haber entre 2 y 10 jugadores.")

    limpios = []
    for nombre in nombres:
        if not isinstance(nombre, str):
            raise ValueError("Los nombres deben ser texto.")
        nombre = nombre.strip()
        if not (1 <= len(nombre) <= 20):
            raise ValueError("Cada nombre debe tener entre 1 y 20 caracteres.")
        if nombre in limpios:
            raise ValueError("Los nombres deben ser únicos.")
        limpios.append(nombre)
    return limpios


def _lista_desde_sesion():
    nombres = session.get("nombres")
    if not nombres:
        return None

    lista = nueva_lista()
    for nombre in nombres:
        lista.insertar_final(nombre)
    return lista


def _nodo_actual(lista, nombre):
    if lista is None or lista.esta_vacia():
        return None

    actual = lista.cabeza
    while True:
        if actual.dato == nombre:
            return actual
        actual = actual.siguiente
        if actual is lista.cabeza:
            return None


def _gotas_sesion():
    gotas = session.get("gotas")
    if not isinstance(gotas, list):
        gotas = crear_gotas()
        session["gotas"] = gotas
    return gotas


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/nueva")
def api_nueva():
    datos = request.get_json(silent=True) or {}
    try:
        nombres = _nombres_validos(datos)
        lista, actual, mecha = crear_partida(nombres)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    session["nombres"] = lista.recorrer()
    session["actual"] = actual.dato
    session["mecha"] = mecha
    gotas = crear_gotas()
    session["gotas"] = gotas

    return jsonify(estado_partida(lista, actual, mecha, gotas=gotas))


@app.post("/api/pasar")
def api_pasar():
    datos = request.get_json(silent=True) or {}
    destino = datos.get("destino")

    if not isinstance(destino, str) or not destino.strip():
        return jsonify({"error": "Debes elegir un jugador."}), 400
    destino = destino.strip()

    lista = _lista_desde_sesion()
    if lista is None:
        return jsonify({"error": "No hay una partida activa. Pulsa Nueva partida."}), 400

    actual = _nodo_actual(lista, session.get("actual"))
    mecha = session.get("mecha", 0)
    gotas = _gotas_sesion()

    try:
        resultado = pasar_papa(lista, actual, mecha, destino)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    actual = resultado["actual"]
    session["nombres"] = resultado["lista"].recorrer()
    session["actual"] = actual.dato if actual is not None else None
    session["mecha"] = resultado["mecha"]

    if resultado["eliminado"] is not None:
        reponer_gota(gotas)
    session["gotas"] = gotas

    return jsonify(
        estado_partida(
            resultado["lista"],
            actual,
            resultado["mecha"],
            eliminado=resultado["eliminado"],
            ganador=resultado["ganador"],
            gotas=gotas,
        )
    )


@app.post("/api/recoger")
def api_recoger():
    datos = request.get_json(silent=True) or {}
    gota_id = datos.get("gota_id")

    lista = _lista_desde_sesion()
    if lista is None:
        return jsonify({"error": "No hay una partida activa. Pulsa Nueva partida."}), 400
    if len(lista.recorrer()) < 2:
        return jsonify({"error": "La partida ya terminó."}), 400

    actual = _nodo_actual(lista, session.get("actual"))
    mecha = session.get("mecha", 0)
    gotas = _gotas_sesion()

    try:
        resultado = recoger_gota(gotas, mecha, gota_id)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    session["mecha"] = resultado["mecha"]
    session["gotas"] = resultado["gotas"]

    return jsonify(
        estado_partida(
            lista,
            actual,
            resultado["mecha"],
            gotas=resultado["gotas"],
            recogida=resultado["gota"],
        )
    )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
