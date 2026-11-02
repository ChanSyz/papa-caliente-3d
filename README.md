# Papa Caliente 3D · Lista Circular

Juego para navegador donde la papa caliente se pasa de jugador en jugador.
La lógica y la lista circular están en Python (Flask); la escena 3D se dibuja
con Three.js.

## Cómo se juega

- Se eligen entre 2 y 10 jugadores.
- La papa empieza con el primer jugador de la lista circular.
- La mecha empieza con un número aleatorio entre 4 y 9 pases.
- En cada turno el jugador con la papa **elige a quién pasársela**: puede
  hacer clic sobre otro jugador en el escenario 3D o usar los botones del
  panel.
- Cada pase gasta un número de la mecha. Cuando llega a cero, el jugador que
  recibe la papa queda eliminado y sale de la lista.
- Alrededor de la fogata aparecen **gotas de agua**. Al hacer clic en una gota
  la mecha sube un pase (hasta un máximo de 12), así que recogerlas da margen
  antes de la siguiente explosión.
- La mecha se reinicia con otro número aleatorio y el turno pasa al siguiente
  jugador que quedó en el círculo. También se reponen las gotas.
- Gana el último jugador que queda en la lista.

### Cámara

- **Arrastrar** con el ratón o el dedo gira la cámara alrededor de la mesa.
- **Rueda** del ratón acerca o aleja.
- **← →** giran la cámara y **↑ ↓** hacen zoom.
- **R** empieza una partida nueva.

## La lista circular del profesor

El archivo `lista_circular.py` contiene la clase `ListaCircular` **tal como la
entregó el profesor**, incluido su método `def init(self)` (sin guiones bajos).
No se le cambió nada a esa clase.

Como Python no ejecuta `init` automáticamente, `juego.py` incluye una función
pequeña, `nueva_lista()`, que crea el objeto y llama a `lista.init()` una vez.
La clase `Nodo` se agregó aparte porque la lista la necesita.

Las operaciones que usa el juego son las de la clase original:

- `insertar_final(nombre)` para armar el círculo.
- `recorrer()` para mostrar la lista y saber quién sigue.
- `contiene()` para validar jugadores.
- `eliminar(nombre)` cuando la mecha explota.
- `cabeza` y `siguiente` para avanzar por el círculo.

## Ejecutar en local

```bash
python3 -m venv .venv
source .venv/bin/activate        # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Abre <http://127.0.0.1:5000>.

> En Windows no hace falta `gunicorn`; con `python app.py` es suficiente.

## Probar sin navegador

```bash
python3 -m unittest discover -s tests -v
```

Las pruebas cubren la lista circular, un pase normal, la explosión, el
ganador, los nombres repetidos, el intento de pasarle la papa a uno mismo,
la creación y recogida de gotas, y la API de recogida.

## API

- `POST /api/nueva` con `{"jugadores": ["Ana", "Beto", ...]}` crea la partida.
- `POST /api/pasar` con `{"destino": "Beto"}` pasa la papa al jugador elegido.
- `POST /api/recoger` con `{"gota_id": "abc123"}` recoge una gota y suma un
  pase a la mecha.
- Las respuestas incluyen `jugadores`, `actual`, `mecha`, `gotas`,
  `eliminado`, `ganador` y `fin`. La respuesta de `/api/recoger` agrega
  `recogida` con la gota retirada.

La partida se guarda en la cookie de sesión de Flask: no hace falta base de
datos ni estado global en el servidor.

## Desplegar en PythonAnywhere (recomendado)

La cuenta gratuita no pide tarjeta, mantiene la app despierta y da una URL
pública `https://TU_USUARIO.pythonanywhere.com`.

1. Crea una cuenta **Beginner** en <https://www.pythonanywhere.com>.
2. Sube la carpeta `papa-caliente-3d` (Files → Upload a file, o comprime la
   carpeta y descomprímela en un Bash console).
3. En **Web** → **Add a new web app** → **Manual configuration** → **Flask**.
4. En **Source code** escribe `/home/TU_USUARIO/papa-caliente-3d`.
5. Abre el archivo **WSGI configuration file** y reemplaza su contenido por:

```python
import sys

path = "/home/TU_USUARIO/papa-caliente-3d"
if path not in sys.path:
    sys.path.insert(0, path)

from app import app as application
```

6. Si Flask no está instalado, en un **Bash console** ejecuta:

```bash
pip install --user Flask
```

7. Pulsa **Reload** y abre:

```text
https://TU_USUARIO.pythonanywhere.com
```

La cuenta gratuita permite una app web, 512 MB y no tiene dominio propio.
Hay que renovar la app cada 3 meses desde el panel.

## Desplegar en Render (alternativa con GitHub)

1. Sube el proyecto a un repositorio de GitHub.
2. En Render: **New** → **Web Service** → conecta el repositorio.
3. Configura:
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `gunicorn app:app`
   - **Plan:** Free
4. Render entrega una URL `https://tu-proyecto.onrender.com`.
   El servicio gratuito se duerme tras 15 minutos sin visitas y tarda cerca de
   un minuto en despertar.

## Estructura

```text
papa-caliente-3d/
├── app.py                 # Flask: página y API /api/nueva, /api/pasar, /api/recoger
├── juego.py               # Reglas, mecha, gotas y nueva_lista()
├── lista_circular.py      # Clase del profesor + Nodo
├── requirements.txt
├── Procfile               # Para Render
├── templates/
│   └── index.html
├── static/
│   ├── style.css
│   ├── escena.js          # Three.js: fogata, jugadores, gotas y explosiones
│   └── main.js            # Interfaz, clics, cámara y llamadas a la API
└── tests/
    └── test_lista.py
```

## Nota sobre el 3D y Python

Three.js se ejecuta en el navegador; Python no dibuja el 3D. Si el profesor
exige que **todo** el juego sea Python (incluido el 3D), este esquema no
cumple: en ese caso la entrega tendría que ser una aplicación de escritorio
con Ursina/Panda3D (`.exe`), porque esos motores no exportan de forma fiable
a la web.
