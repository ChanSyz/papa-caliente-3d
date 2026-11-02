"""Pruebas de la lista circular y de la lógica del juego."""

import unittest

from juego import (
    GOTAS_INICIALES,
    MECHA_MAXIMA_AGUA,
    crear_gotas,
    crear_partida,
    nueva_lista,
    pasar_papa,
    recoger_gota,
    reponer_gota,
)


class TestListaCircular(unittest.TestCase):
    def test_insertar_recorrer_contiene(self):
        lista = nueva_lista()
        self.assertTrue(lista.esta_vacia())
        self.assertEqual(lista.recorrer(), [])

        lista.insertar_final("Ana")
        lista.insertar_final("Beto")
        lista.insertar_final("Caro")

        self.assertEqual(lista.recorrer(), ["Ana", "Beto", "Caro"])
        self.assertEqual(lista.cabeza.dato, "Ana")
        self.assertTrue(lista.contiene("Beto"))
        self.assertFalse(lista.contiene("Zoe"))

    def test_eliminar_y_eliminar_inicio(self):
        lista = nueva_lista()
        for nombre in ("Ana", "Beto", "Caro"):
            lista.insertar_final(nombre)

        self.assertTrue(lista.eliminar("Beto"))
        self.assertEqual(lista.recorrer(), ["Ana", "Caro"])
        self.assertEqual(lista.eliminar_inicio(), "Ana")
        self.assertEqual(lista.recorrer(), ["Caro"])
        self.assertTrue(lista.eliminar("Caro"))
        self.assertTrue(lista.esta_vacia())

    def test_insertar_inicio(self):
        lista = nueva_lista()
        lista.insertar_final("Beto")
        lista.insertar_inicio("Ana")
        lista.insertar_final("Caro")
        self.assertEqual(lista.recorrer(), ["Ana", "Beto", "Caro"])


class TestJuego(unittest.TestCase):
    def test_pase_normal(self):
        lista, actual, mecha = crear_partida(["A", "B", "C"], mecha=3)
        self.assertEqual(lista.recorrer(), ["A", "B", "C"])
        self.assertEqual(actual.dato, "A")

        resultado = pasar_papa(lista, actual, mecha, "B")
        self.assertEqual(resultado["actual"].dato, "B")
        self.assertEqual(resultado["mecha"], 2)
        self.assertIsNone(resultado["eliminado"])
        self.assertIsNone(resultado["ganador"])

    def test_explosion_y_ganador(self):
        lista, actual, mecha = crear_partida(["A", "B", "C"], mecha=2)

        resultado = pasar_papa(lista, actual, mecha, "B")
        self.assertIsNone(resultado["eliminado"])

        resultado = pasar_papa(
            resultado["lista"],
            resultado["actual"],
            resultado["mecha"],
            "C",
        )
        self.assertEqual(resultado["eliminado"], "C")
        self.assertEqual(resultado["lista"].recorrer(), ["A", "B"])
        self.assertIsNone(resultado["ganador"])
        self.assertEqual(resultado["actual"].dato, "A")

        resultado = pasar_papa(
            resultado["lista"],
            resultado["actual"],
            1,
            "B",
        )
        self.assertEqual(resultado["eliminado"], "B")
        self.assertEqual(resultado["ganador"], "A")
        self.assertEqual(resultado["lista"].recorrer(), ["A"])

    def test_no_se_puede_pasar_a_si_mismo(self):
        lista, actual, mecha = crear_partida(["A", "B"], mecha=3)
        with self.assertRaises(ValueError):
            pasar_papa(lista, actual, mecha, "A")

    def test_nombres_duplicados(self):
        with self.assertRaises(ValueError):
            crear_partida(["A", "A"], mecha=3)


class TestGotas(unittest.TestCase):
    def test_crear_gotas_iniciales(self):
        gotas = crear_gotas()
        self.assertEqual(len(gotas), GOTAS_INICIALES)
        self.assertEqual(len({gota["id"] for gota in gotas}), GOTAS_INICIALES)
        for gota in gotas:
            self.assertGreaterEqual(gota["radio"], 1.35)
            self.assertLessEqual(gota["radio"], 2.35)
            self.assertGreaterEqual(gota["angulo"], 0)
            self.assertLessEqual(gota["angulo"], 6.29)

    def test_recoger_gota_aumenta_mecha(self):
        gotas = crear_gotas()
        primera = gotas[0]["id"]
        resultado = recoger_gota(gotas, 5, primera)

        self.assertEqual(resultado["mecha"], 6)
        self.assertEqual(len(resultado["gotas"]), GOTAS_INICIALES - 1)
        self.assertEqual(resultado["gota"]["id"], primera)

    def test_gota_repetida(self):
        gotas = crear_gotas()
        primera = gotas[0]["id"]
        resultado = recoger_gota(gotas, 5, primera)
        with self.assertRaises(ValueError):
            recoger_gota(resultado["gotas"], resultado["mecha"], primera)

    def test_mecha_al_maximo_no_consume_gota(self):
        gotas = crear_gotas()
        with self.assertRaises(ValueError):
            recoger_gota(gotas, MECHA_MAXIMA_AGUA, gotas[0]["id"])
        self.assertEqual(len(gotas), GOTAS_INICIALES)

    def test_reponer_gotas(self):
        gotas = crear_gotas()[:1]
        reponer_gota(gotas)
        self.assertEqual(len(gotas), GOTAS_INICIALES)


class TestApi(unittest.TestCase):
    def setUp(self):
        from app import app

        app.config.update(TESTING=True, SECRET_KEY="test")
        self.cliente = app.test_client()

    def test_nueva_partida_incluye_gotas(self):
        respuesta = self.cliente.post(
            "/api/nueva",
            json={"jugadores": ["A", "B", "C"]},
        )
        self.assertEqual(respuesta.status_code, 200)
        datos = respuesta.get_json()
        self.assertEqual(datos["mecha"] >= 4, True)
        self.assertEqual(len(datos["gotas"]), GOTAS_INICIALES)

    def test_recoger_gota_por_api(self):
        datos = self.cliente.post(
            "/api/nueva",
            json={"jugadores": ["A", "B", "C"]},
        ).get_json()
        gota = datos["gotas"][0]
        respuesta = self.cliente.post("/api/recoger", json={"gota_id": gota["id"]})
        self.assertEqual(respuesta.status_code, 200)
        nuevos = respuesta.get_json()
        self.assertEqual(nuevos["mecha"], datos["mecha"] + 1)
        self.assertEqual(len(nuevos["gotas"]), len(datos["gotas"]) - 1)
        self.assertEqual(nuevos["recogida"]["id"], gota["id"])


if __name__ == "__main__":
    unittest.main()
