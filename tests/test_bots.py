import unittest

from app import app
from juego import (
    MECHA_MAXIMA_AGUA,
    bot_quiere_agua,
    candidatos_bot,
    elegir_destino_bot,
    nueva_lista,
)


class Fijo:
    """Azar controlado para probar decisiones."""

    def __init__(self, valor):
        self.valor = valor

    def random(self):
        return self.valor

    def choice(self, opciones):
        return opciones[0]


def lista_de(nombres):
    lista = nueva_lista()
    for nombre in nombres:
        lista.insertar_final(nombre)
    return lista


def nodo(lista, nombre):
    actual = lista.cabeza
    while actual.dato != nombre:
        actual = actual.siguiente
    return actual


class TestDecisionesBot(unittest.TestCase):
    def test_candidatos_siguen_el_orden_del_circulo(self):
        lista = lista_de(["A", "B", "C", "D"])
        self.assertEqual(candidatos_bot(lista, nodo(lista, "C")), ["D", "A", "B"])

    def test_destino_nunca_es_el_mismo_ni_uno_fuera(self):
        lista = lista_de(["A", "B", "C", "D", "E"])
        actual = nodo(lista, "B")
        for _ in range(300):
            destino = elegir_destino_bot(lista, actual)
            self.assertNotEqual(destino, "B")
            self.assertTrue(lista.contiene(destino))

    def test_destino_siguiente_si_el_azar_es_bajo(self):
        lista = lista_de(["A", "B", "C"])
        self.assertEqual(elegir_destino_bot(lista, nodo(lista, "A"), Fijo(0.0)), "B")

    def test_con_mecha_1_nunca_recoge_agua(self):
        gotas = [{"id": "g1"}]
        for _ in range(300):
            self.assertIsNone(bot_quiere_agua(1, gotas))

    def test_con_mecha_2_recoge_si_el_azar_lo_permite(self):
        gotas = [{"id": "g1"}, {"id": "g2"}]
        self.assertEqual(bot_quiere_agua(2, gotas, azar=Fijo(0.0)), "g1")
        self.assertIsNone(bot_quiere_agua(2, gotas, ya_tomo_agua=True, azar=Fijo(0.0)))
        self.assertIsNone(bot_quiere_agua(2, [], azar=Fijo(0.0)))
        self.assertIsNone(bot_quiere_agua(MECHA_MAXIMA_AGUA, gotas, azar=Fijo(0.0)))


class TestApiBots(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.cli = app.test_client()

    def nueva(self, bots=True, n=4):
        nombres = ["Jugador 1"] + [f"Bot {i}" for i in range(2, n + 1)]
        return self.cli.post("/api/nueva", json={"jugadores": nombres, "bots": bots})

    def test_sin_bots_el_endpoint_se_rechaza(self):
        self.nueva(bots=False)
        self.assertEqual(self.cli.post("/api/bot", json={}).status_code, 400)

    def test_no_juega_en_turno_del_humano(self):
        self.nueva()
        self.assertEqual(self.cli.post("/api/bot", json={}).status_code, 400)

    def test_bot_juega_despues_de_que_pasa_el_humano(self):
        self.nueva()
        self.assertEqual(self.cli.post("/api/pasar", json={"destino": "Bot 2"}).status_code, 200)
        datos = self.cli.post("/api/bot", json={}).get_json()
        self.assertEqual(datos["bot"]["jugador"], "Bot 2")
        self.assertIn(datos["bot"]["accion"], {"agua", "pasar"})

    def test_partida_completa_termina_con_ganador(self):
        datos = self.nueva(n=5).get_json()
        for _ in range(600):
            if datos["fin"]:
                break
            if datos["actual"] == "Jugador 1":
                otro = next(j for j in datos["jugadores"] if j != "Jugador 1")
                datos = self.cli.post("/api/pasar", json={"destino": otro}).get_json()
            else:
                datos = self.cli.post("/api/bot", json={}).get_json()
        self.assertTrue(datos["fin"])
        self.assertIsNotNone(datos["ganador"])


if __name__ == "__main__":
    unittest.main()
