"""Lista circular enlazada usada por el juego.

La clase ListaCircular quedó exactamente como la entregó el profesor,
incluido ``def init``. Como Python no llama automáticamente a ``init``,
el juego crea la lista con ``nueva_lista()`` (en juego.py), que ejecuta
``init()`` una vez. La clase Nodo se agregó aparte porque la lista la usa.
"""


class Nodo:
    def __init__(self, dato):
        self.dato = dato
        self.siguiente = None


class ListaCircular:
    def init(self):
        self.cola = None

    @property
    def cabeza(self):
        if self.cola is None:
            return None
        return self.cola.siguiente

    def esta_vacia(self):
        return self.cola is None

    def insertar_inicio(self, dato):
        nuevo = Nodo(dato)

        if self.cola is None:
            nuevo.siguiente = nuevo
            self.cola = nuevo
        else:
            nuevo.siguiente = self.cola.siguiente
            self.cola.siguiente = nuevo

    def insertar_final(self, dato):
        nuevo = Nodo(dato)

        if self.cola is None:
            nuevo.siguiente = nuevo
            self.cola = nuevo
            return

        nuevo.siguiente = self.cola.siguiente
        self.cola.siguiente = nuevo
        self.cola = nuevo

    def recorrer(self):
        if self.cola is None:
            return []

        resultado = []
        inicio = self.cola.siguiente
        actual = inicio

        while True:
            resultado.append(actual.dato)
            actual = actual.siguiente

            if actual is inicio:
                break

        return resultado

    def contiene(self, buscado):
        if self.cola is None:
            return False

        inicio = self.cola.siguiente
        actual = inicio

        while True:
            if actual.dato == buscado:
                return True

            actual = actual.siguiente

            if actual is inicio:
                break

        return False

    def eliminar_inicio(self):
        if self.cola is None:
            raise IndexError("La lista circular está vacía")

        cabeza = self.cola.siguiente
        dato = cabeza.dato

        if cabeza is self.cola:
            self.cola = None
        else:
            self.cola.siguiente = cabeza.siguiente

        return dato

    def eliminar(self, buscado):
        if self.cola is None:
            return False

        anterior = self.cola
        actual = self.cola.siguiente
        inicio = actual

        while True:
            if actual.dato == buscado:
                if actual is anterior:
                    self.cola = None
                else:
                    anterior.siguiente = actual.siguiente
                    if actual is self.cola:
                        self.cola = anterior
                return True

            anterior = actual
            actual = actual.siguiente

            if actual is inicio:
                break

        return False
