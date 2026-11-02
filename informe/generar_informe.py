#!/usr/bin/env python3
"""Genera el informe PDF de Papa Caliente 3D a partir de las capturas.

Uso:
    PYTHONPATH=/tmp/opencode/reportdeps python3 generar_informe.py \
        --nombre Samir --apellido Perez --github samir18

Las capturas deben estar en ./capturas con los nombres indicados en el
apartado 4 del informe. Si falta una, se inserta un recuadro de pendiente.
"""

import argparse
import os
import subprocess
from pathlib import Path

from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL, WD_ROW_HEIGHT_RULE, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

BASE = Path(__file__).resolve().parent
CAPTURAS = BASE / "capturas"
SALIDA = BASE / "salida"

NAVY = RGBColor(0x0B, 0x1B, 0x33)
ORANGE = RGBColor(0xE8, 0x6A, 0x1C)
GRAY = RGBColor(0x5A, 0x66, 0x78)
LIGHT_GRAY = RGBColor(0x8B, 0x96, 0xA6)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

NAVY_HEX = "0B1B33"
ORANGE_HEX = "E86A1C"
BLUE_HEX = "1D4E89"
LIGHT_HEX = "F3F5F8"
BORDER_HEX = "D5DBE3"

PARAMS = {
    "nombre": "Samir",
    "apellido": "PENDIENTE",
    "github": "USUARIO",
    "url": "https://samir18.pythonanywhere.com/",
}
REPO = "https://github.com/{github}/papa-caliente-3d"
FECHA = "3 de noviembre de 2026"

doc = Document()
FIG = {"n": 0}


# ----------------------------------------------------------------------
# Utilidades de formato
# ----------------------------------------------------------------------

def configurar_documento():
    seccion = doc.sections[0]
    seccion.page_width = Cm(21)
    seccion.page_height = Cm(29.7)
    seccion.left_margin = Cm(2.4)
    seccion.right_margin = Cm(2.4)
    seccion.top_margin = Cm(2.3)
    seccion.bottom_margin = Cm(2.1)
    seccion.header_distance = Cm(1.1)
    seccion.footer_distance = Cm(1.0)
    seccion.different_first_page_header_footer = True

    normal = doc.styles["Normal"]
    normal.font.name = "Liberation Sans"
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = RGBColor(0x1F, 0x27, 0x33)
    normal.paragraph_format.space_after = Pt(4)
    normal.paragraph_format.line_spacing = 1.16
    rpr = normal.element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    rfonts.set(qn("w:eastAsia"), "Liberation Sans")


def sombrear_celda(celda, color):
    tc_pr = celda._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color)
    tc_pr.append(shd)


def borde_inferior(parrafo, color, grosor=8):
    p_pr = parrafo._p.get_or_add_pPr()
    p_bdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), str(grosor))
    bottom.set(qn("w:space"), "4")
    bottom.set(qn("w:color"), color)
    p_bdr.append(bottom)
    p_pr.append(p_bdr)


def borde_celda(celda, color, grosor=6):
    tc_pr = celda._tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    for lado in ("top", "left", "bottom", "right"):
        borde = OxmlElement(f"w:{lado}")
        borde.set(qn("w:val"), "single")
        borde.set(qn("w:sz"), str(grosor))
        borde.set(qn("w:space"), "0")
        borde.set(qn("w:color"), color)
        borders.append(borde)
    tc_pr.append(borders)


def campo(pagina, texto):
    run = pagina.add_run()
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = texto
    fld_sep = OxmlElement("w:fldChar")
    fld_sep.set(qn("w:fldCharType"), "separate")
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    run._r.append(fld_begin)
    run._r.append(instr)
    run._r.append(fld_sep)
    run._r.append(fld_end)


def encabezado_y_pie():
    seccion = doc.sections[0]
    header = seccion.header
    hp = header.paragraphs[0]
    hp.text = ""
    hp.paragraph_format.tab_stops.add_tab_stop(Cm(16.2), WD_TAB_ALIGNMENT.RIGHT)
    r = hp.add_run("Papa Caliente 3D")
    r.bold = True
    r.font.size = Pt(8.5)
    r.font.color.rgb = NAVY
    r = hp.add_run("\tInforme de actividad · Estructura de Datos")
    r.font.size = Pt(8.5)
    r.font.color.rgb = GRAY
    borde_inferior(hp, ORANGE_HEX, 6)

    footer = seccion.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = fp.add_run("Página ")
    r.font.size = Pt(8)
    r.font.color.rgb = GRAY
    r = fp.add_run()
    r.font.size = Pt(8)
    r.font.color.rgb = GRAY
    campo(fp, "PAGE")
    r = fp.add_run(" de ")
    r.font.size = Pt(8)
    r.font.color.rgb = GRAY
    campo(fp, "NUMPAGES")
    r = fp.add_run("  ·  " + PARAMS["nombre"] + " " + PARAMS["apellido"])
    r.font.size = Pt(8)
    r.font.color.rgb = GRAY


def h1(texto, salto=True):
    par = doc.add_paragraph()
    par.paragraph_format.page_break_before = bool(salto)
    par.paragraph_format.space_before = Pt(0)
    par.paragraph_format.space_after = Pt(10)
    par.paragraph_format.keep_with_next = True
    run = par.add_run(texto)
    run.bold = True
    run.font.size = Pt(19)
    run.font.color.rgb = NAVY
    borde_inferior(par, ORANGE_HEX, 12)
    return par


def h2(texto):
    par = doc.add_paragraph()
    par.paragraph_format.space_before = Pt(13)
    par.paragraph_format.space_after = Pt(5)
    par.paragraph_format.keep_with_next = True
    run = par.add_run(texto)
    run.bold = True
    run.font.size = Pt(13.5)
    run.font.color.rgb = NAVY
    return par


def h3(texto):
    par = doc.add_paragraph()
    par.paragraph_format.space_before = Pt(9)
    par.paragraph_format.space_after = Pt(3)
    par.paragraph_format.keep_with_next = True
    run = par.add_run(texto)
    run.bold = True
    run.font.size = Pt(11.2)
    run.font.color.rgb = ORANGE
    return par


def p(texto, negrita=None, cursiva=False, tamano=10.5, justificar=True,
      espacio=4, color=None):
    par = doc.add_paragraph()
    par.paragraph_format.space_after = Pt(espacio)
    if justificar:
        par.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    if negrita:
        r = par.add_run(negrita)
        r.bold = True
        r.font.color.rgb = NAVY
        r.font.size = Pt(tamano)
    r = par.add_run(texto)
    r.italic = cursiva
    r.font.size = Pt(tamano)
    if color:
        r.font.color.rgb = color
    return par


def bullets(items, tamano=10.3):
    for item in items:
        par = doc.add_paragraph(style="List Bullet")
        par.paragraph_format.space_after = Pt(2)
        par.paragraph_format.left_indent = Cm(0.75)
        par.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        if isinstance(item, tuple):
            lead, resto = item
            r = par.add_run(lead)
            r.bold = True
            r.font.color.rgb = NAVY
            r.font.size = Pt(tamano)
            r = par.add_run(resto)
            r.font.size = Pt(tamano)
        else:
            r = par.add_run(item)
            r.font.size = Pt(tamano)


def numeros(items, tamano=10.3):
    for indice, item in enumerate(items, start=1):
        par = doc.add_paragraph()
        par.paragraph_format.space_after = Pt(2)
        par.paragraph_format.left_indent = Cm(0.75)
        par.paragraph_format.first_line_indent = Cm(-0.5)
        par.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        r = par.add_run(f"{indice}. ")
        r.bold = True
        r.font.size = Pt(tamano)
        r.font.color.rgb = NAVY
        r = par.add_run(item)
        r.font.size = Pt(tamano)


def codigo(texto, titulo=None):
    if titulo:
        cap = doc.add_paragraph()
        cap.paragraph_format.space_before = Pt(6)
        cap.paragraph_format.space_after = Pt(2)
        cap.paragraph_format.keep_with_next = True
        r = cap.add_run(titulo)
        r.bold = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = GRAY

    tabla = doc.add_table(rows=1, cols=1)
    tabla.alignment = WD_TABLE_ALIGNMENT.CENTER
    tabla.autofit = False
    fila = tabla.rows[0]
    tr_pr = fila._tr.get_or_add_trPr()
    tr_pr.append(OxmlElement("w:cantSplit"))
    celda = tabla.cell(0, 0)
    celda.width = Cm(16.2)
    sombrear_celda(celda, LIGHT_HEX)
    borde_celda(celda, BORDER_HEX, 4)

    par = celda.paragraphs[0]
    par.paragraph_format.space_before = Pt(5)
    par.paragraph_format.space_after = Pt(5)
    par.paragraph_format.line_spacing = 1.0
    lineas = texto.strip("\n").split("\n")
    for indice, linea in enumerate(lineas):
        run = par.add_run(linea if linea else " ")
        run.font.name = "DejaVu Sans Mono"
        run.font.size = Pt(7.9)
        run.font.color.rgb = RGBColor(0x22, 0x2A, 0x36)
        if indice < len(lineas) - 1:
            run.add_break()

    espacio = doc.add_paragraph()
    espacio.paragraph_format.space_after = Pt(2)


def tabla(headers, filas, anchos=None, tamano=9.0):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False

    tr_pr = t.rows[0]._tr.get_or_add_trPr()
    tr_pr.append(OxmlElement("w:tblHeader"))

    for indice, texto in enumerate(headers):
        celda = t.rows[0].cells[indice]
        celda.text = ""
        celda.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        sombrear_celda(celda, NAVY_HEX)
        par = celda.paragraphs[0]
        par.paragraph_format.space_before = Pt(2)
        par.paragraph_format.space_after = Pt(2)
        run = par.add_run(texto)
        run.bold = True
        run.font.size = Pt(tamano)
        run.font.color.rgb = WHITE

    for numero_fila, fila in enumerate(filas):
        fila_obj = t.add_row()
        fila_obj._tr.get_or_add_trPr().append(OxmlElement("w:cantSplit"))
        celdas = fila_obj.cells
        for indice, valor in enumerate(fila):
            celda = celdas[indice]
            celda.text = ""
            celda.vertical_alignment = WD_ALIGN_VERTICAL.TOP
            if numero_fila % 2 == 1:
                sombrear_celda(celda, "FAFBFC")
            par = celda.paragraphs[0]
            par.paragraph_format.space_before = Pt(2)
            par.paragraph_format.space_after = Pt(2)
            run = par.add_run(str(valor))
            run.font.size = Pt(tamano)

    if anchos:
        for fila in t.rows:
            for indice, ancho in enumerate(anchos):
                fila.cells[indice].width = Cm(ancho)

    espacio = doc.add_paragraph()
    espacio.paragraph_format.space_after = Pt(1)


def aviso(titulo, texto, color_fondo="FFF4E8", color_borde=ORANGE_HEX):
    tabla_aviso = doc.add_table(rows=1, cols=1)
    tabla_aviso.alignment = WD_TABLE_ALIGNMENT.CENTER
    tabla_aviso.autofit = False
    celda = tabla_aviso.cell(0, 0)
    celda.width = Cm(16.2)
    sombrear_celda(celda, color_fondo)
    borde_celda(celda, color_borde, 6)
    par = celda.paragraphs[0]
    par.paragraph_format.space_before = Pt(4)
    par.paragraph_format.space_after = Pt(4)
    r = par.add_run(titulo + " ")
    r.bold = True
    r.font.size = Pt(9)
    r.font.color.rgb = ORANGE if color_borde == ORANGE_HEX else NAVY
    r = par.add_run(texto)
    r.font.size = Pt(9)
    r.font.color.rgb = RGBColor(0x33, 0x3D, 0x4A)
    espacio = doc.add_paragraph()
    espacio.paragraph_format.space_after = Pt(2)


def pendiente(nombre_archivo):
    tabla_p = doc.add_table(rows=1, cols=1)
    tabla_p.alignment = WD_TABLE_ALIGNMENT.CENTER
    tabla_p.autofit = False
    fila = tabla_p.rows[0]
    fila.height = Cm(5.4)
    fila.height_rule = WD_ROW_HEIGHT_RULE.AT_LEAST
    celda = fila.cells[0]
    celda.width = Cm(15.8)
    sombrear_celda(celda, "F7F8FA")
    borde_celda(celda, "C9D0DA", 6)
    par = celda.paragraphs[0]
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = par.add_run("CAPTURA PENDIENTE\n")
    r.bold = True
    r.font.size = Pt(10)
    r.font.color.rgb = GRAY
    r = par.add_run("Guarda la imagen en informe/capturas/" + nombre_archivo)
    r.font.size = Pt(8.5)
    r.font.color.rgb = LIGHT_GRAY
    espacio = doc.add_paragraph()
    espacio.paragraph_format.space_after = Pt(1)


def figura(nombre_archivo, comentario, ancho=15.6):
    FIG["n"] += 1
    ruta = CAPTURAS / nombre_archivo
    if ruta.exists():
        try:
            doc.add_picture(str(ruta), width=Cm(ancho))
            doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
            doc.paragraphs[-1].paragraph_format.space_before = Pt(4)
            doc.paragraphs[-1].paragraph_format.space_after = Pt(2)
            doc.paragraphs[-1].paragraph_format.keep_with_next = True
        except Exception:
            pendiente(nombre_archivo)
    else:
        pendiente(nombre_archivo)

    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_after = Pt(9)
    r = cap.add_run(f"Figura {FIG['n']}. ")
    r.bold = True
    r.font.size = Pt(8.4)
    r.font.color.rgb = ORANGE
    r = cap.add_run(comentario)
    r.italic = True
    r.font.size = Pt(8.4)
    r.font.color.rgb = GRAY


# ----------------------------------------------------------------------
# Portada y contenido
# ----------------------------------------------------------------------

def portada():
    for _ in range(3):
        doc.add_paragraph()

    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = par.add_run("INFORME DE ACTIVIDAD CALIFICADA")
    r.bold = True
    r.font.size = Pt(9.5)
    r.font.color.rgb = ORANGE
    par.paragraph_format.space_after = Pt(10)

    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = par.add_run("Papa Caliente 3D")
    r.bold = True
    r.font.size = Pt(34)
    r.font.color.rgb = NAVY
    par.paragraph_format.space_after = Pt(2)

    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = par.add_run("Un juego 3D con Python, Three.js y una lista circular")
    r.font.size = Pt(13)
    r.font.color.rgb = GRAY
    par.paragraph_format.space_after = Pt(18)

    linea = doc.add_paragraph()
    linea.alignment = WD_ALIGN_PARAGRAPH.CENTER
    borde_inferior(linea, ORANGE_HEX, 12)
    linea.paragraph_format.space_after = Pt(20)

    datos = [
        ("Asignatura", "Estructura de Datos"),
        ("Docente", "Giomar"),
        ("Autor", f"{PARAMS['nombre']} {PARAMS['apellido']}"),
        ("Fecha", FECHA),
        ("URL pública", PARAMS["url"]),
        ("Repositorio", REPO.format(github=PARAMS["github"])),
    ]
    t = doc.add_table(rows=0, cols=2)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    for etiqueta, valor in datos:
        celdas = t.add_row().cells
        celdas[0].width = Cm(4.0)
        celdas[1].width = Cm(11.6)
        par = celdas[0].paragraphs[0]
        par.paragraph_format.space_after = Pt(3)
        r = par.add_run(etiqueta)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = NAVY
        par = celdas[1].paragraphs[0]
        par.paragraph_format.space_after = Pt(3)
        r = par.add_run(valor)
        r.font.size = Pt(9.5)
        if etiqueta in ("URL pública", "Repositorio"):
            r.font.color.rgb = BLUE_HEX if False else ORANGE
            r.bold = True

    for _ in range(4):
        doc.add_paragraph()

    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = par.add_run("Trabajo de Estructura de Datos · Flask + Three.js · Publicado en PythonAnywhere")
    r.font.size = Pt(8.5)
    r.font.color.rgb = LIGHT_GRAY

    doc.add_page_break()


def contenido():
    h1("Contenido")
    p("En este documento cuento cómo hice el juego, qué problemas tuve y cómo los "
      "fui resolviendo. También explico cómo lo publiqué en internet y dejo las "
      "capturas que pide la guía de la actividad.")

    apartados = [
        ("1. Introducción", "Por qué elegí este juego, qué quería lograr y qué me salió."),
        ("2. Memoria técnica", "Cómo está hecho: reglas, lista circular, lógica, escena 3D y pruebas."),
        ("3. Documentación del despliegue", "Los pasos que seguí para publicarlo en PythonAnywhere."),
        ("4. Aporte final", "Capturas comentadas del IDE, Git, el hosting, los logs y el juego funcionando."),
        ("5. Conclusiones", "Lo que aprendí, lo que me costó y lo que haría después."),
        ("6. Referencias", "Las páginas y documentos que consulté."),
        ("Anexo A", "El código y los comandos que usé, por si hay que repetir el proceso."),
    ]
    for titulo, descripcion in apartados:
        par = doc.add_paragraph()
        par.paragraph_format.space_after = Pt(1)
        r = par.add_run(titulo)
        r.bold = True
        r.font.size = Pt(10.5)
        r.font.color.rgb = NAVY
        par = doc.add_paragraph()
        par.paragraph_format.left_indent = Cm(0.6)
        par.paragraph_format.space_after = Pt(7)
        r = par.add_run(descripcion)
        r.font.size = Pt(9.5)
        r.font.color.rgb = GRAY

    aviso(
        "Sobre las capturas:",
        "todas las figuras del apartado 4 las tomé yo durante el desarrollo y el "
        "despliegue. Si alguna todavía aparece como pendiente, es porque falta "
        "guardarla en la carpeta informe/capturas con el nombre que se indica.",
    )


# ----------------------------------------------------------------------
# 1. Introducción
# ----------------------------------------------------------------------

def introduccion():
    h1("1. Introducción")

    p("Cuando nos pidieron hacer un videojuego 3D para el curso, lo primero que se "
      "me ocurrió fue la papa caliente. Es un juego que todos conocemos del colegio "
      "y me pareció una forma entretenida de mostrar la lista circular sin que se "
      "sintiera como un ejercicio sacado de un libro.")

    p("El juego funciona así: escribo el nombre de dos a diez jugadores, cada "
      "uno aparece alrededor de una fogata y uno de ellos tiene la papa. Esa persona "
      "elige a quién pasársela y la mecha baja un punto. Si la mecha llega a cero, "
      "el que recibe la papa queda eliminado y sale del círculo. Gana el último que "
      "queda. Todo lo que pasa en la partida lo decide Python; el navegador solo "
      "dibuja la escena y me manda lo que voy haciendo con el ratón.")

    p("Además de lo mínimo, le agregué dos cosas para que no fuera solo apretar "
      "botones: la cámara se puede girar y acercar, y aparecen gotas de agua que "
      "puedo recoger para alargar la mecha. La segunda fue la que más me gustó, "
      "porque obliga a decidir entre pasar la papa rápido o gastar un clic en "
      "recoger agua.")

    h2("1.1 Objetivos")
    bullets([
        ("Objetivo general: ", "hacer un videojuego 3D que funcione en el navegador, "
         "que tenga su lógica en Python y que use una estructura de datos hecha con "
         "clases."),
        ("Objetivos personales: ", "entender para qué sirve de verdad una lista "
         "circular, aprender a publicar una aplicación Flask en internet y animarme "
         "a probar cosas hasta que funcionen."),
    ])

    h2("1.2 Qué logré y qué no")
    p("Al final el juego quedó funcionando en local y publicado. Se puede crear una "
      "partida, pasar la papa, recoger gotas, provocar explosiones y llegar a un "
      "ganador. Hice catorce pruebas automáticas y varias pruebas a mano en el "
      "navegador. Lo que no hice fue un multijugador real en red: la partida vive "
      "en la sesión del navegador de cada persona.")

    aviso(
        "Resultado:",
        f"el juego quedó publicado en {PARAMS['url']} y el código en "
        f"{REPO.format(github=PARAMS['github'])}. La clase ListaCircular del "
        "profesor quedó tal cual, con su def init y llamando a init() a mano.",
    )


# ----------------------------------------------------------------------
# 2. Memoria técnica
# ----------------------------------------------------------------------

def memoria():
    h1("2. Memoria técnica")

    h2("2.1 De qué trata el juego")
    p("Papa Caliente es un juego de eliminación por turnos para dos a diez "
      "jugadores. Cada uno se coloca alrededor de una fogata y uno empieza con la "
      "papa. Esa persona elige a quién pasársela antes de que la mecha se apague. "
      "Cada pase gasta un punto de mecha y, cuando llega a cero, el que recibe la "
      "papa explota y sale del círculo. Gana el último que queda.")

    tabla(
        ["Elemento", "Cómo funciona"],
        [
            ["Jugadores", "De 2 a 10, con nombres distintos de 1 a 20 letras."],
            ["Mecha inicial", "Al azar, entre 4 y 9 pases."],
            ["Pase", "El jugador actual elige a otro y la mecha baja 1."],
            ["Explosión", "Si la mecha llega a 0, el que recibe la papa sale."],
            ["Nueva mecha", "Después de una explosión se sortea otra de 4 a 9."],
            ["Gotas de agua", "3 gotas por ronda; cada una suma 1 pase, hasta 12."],
            ["Reposición", "Después de cada explosión vuelven a salir 3 gotas."],
            ["Victoria", "El último que queda en la lista gana."],
        ],
        anchos=[4.0, 12.0],
    )

    p("Las gotas fueron la mecánica que más me costó pensar. Al principio el juego "
      "era solo elegir a quién pasarle la papa, y se sentía muy automático. Agregar "
      "el agua hace que uno tenga que decidir: pasarla rápido o gastar un clic en "
      "recoger una gota. El límite de 12 es a propósito, para que la partida no se "
      "vuelva eterna y todavía haya que arriesgarse a pasar la papa.")

    h2("2.2 Cómo está organizado el proyecto")
    p("Al principio quería meter todo en un solo archivo, pero se volvía imposible "
      "encontrar los errores. Entonces separé el proyecto en tres partes: Python "
      "decide las reglas y guarda el estado, el navegador dibuja la escena y un "
      "archivo aparte se encarga de los botones y los clics. Python no dibuja nada "
      "en 3D: solo responde con datos en formato JSON, y Three.js se encarga de la "
      "parte visual.")

    p("Esa separación fue la que me permitió publicar el juego sin que la persona "
      "que entra tenga que instalar algo. Todo corre en el servidor y en el "
      "navegador, nada más.")

    codigo("""
Navegador
├── templates/index.html        Estructura de la página y panel de control
├── static/style.css            Presentación de la interfaz
├── static/main.js              Interfaz, raycasting, cámara y llamadas fetch
└── static/escena.js            Escena Three.js, jugadores, fogata, gotas y efectos
             │
             │  HTTP + JSON
             ▼
Flask (app.py)
├── GET  /                      Página principal
├── POST /api/nueva             Crea la lista circular y la partida
├── POST /api/pasar             Pasa la papa y descuenta la mecha
├── POST /api/recoger           Recoge una gota y suma mecha
├── Sesión firmada              Guarda nombres, turno, mecha y gotas
└── juego.py
    ├── crear_partida()         Inserta jugadores en la lista
    ├── pasar_papa()            Avanza, elimina y declara ganador
    ├── crear_gotas()           Genera posiciones de las gotas
    ├── recoger_gota()          Valida y aplica el +1 de mecha
    └── lista_circular.py       Clase ListaCircular del profesor
""", "Figura de arquitectura lógica (no es una captura).")

    tabla(
        ["Archivo", "Para qué sirve"],
        [
            ["app.py", "Crea la aplicación, define las rutas y guarda la partida en la sesión."],
            ["juego.py", "Tiene las reglas: mecha, turnos, gotas y quién gana."],
            ["lista_circular.py", "La clase del profesor, con Nodo y ListaCircular. No la modifiqué."],
            ["escena.js", "Arma la escena 3D: luces, sombras, fogata, jugadores y efectos."],
            ["main.js", "Mueve los botones, detecta los clics y llama a la API."],
            ["index.html", "La página y los paneles que se ven en pantalla."],
            ["style.css", "Los colores, tamaños y el diseño para celular."],
            ["tests/test_lista.py", "Las catorce pruebas automáticas."],
        ],
        anchos=[3.9, 12.1],
    )

    h2("2.3 La lista circular")
    p("La estructura que pedía la actividad es una lista circular enlazada. En "
      "palabras simples, es una cadena de nodos donde el último no apunta a None, "
      "sino que vuelve al primero. En el juego queda perfecto: cuando el turno "
      "llega al último jugador, el siguiente es otra vez el primero, y así nadie "
      "se queda sin vecino. El archivo lista_circular.py tiene la clase Nodo y la "
      "clase ListaCircular tal como las dio el profesor.")

    p("La lista guarda la cola, y la cabeza se obtiene como cola.siguiente. Al "
      "principio me confundió un poco eso de guardar el último en lugar del "
      "primero, pero después entendí que así es más rápido insertar al final: no "
      "hay que recorrer toda la lista para encontrar dónde termina.")

    codigo("""
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
""", "Fragmento de lista_circular.py. La clase no fue modificada.")

    p("Aquí fue donde me trabé al principio. Creé la lista, inserté jugadores y no "
      "pasaba nada: la lista se quedaba vacía. Después de dar vueltas me di cuenta "
      "de que el método del profesor se llama init, sin guiones bajos, y que Python "
      "solo llama solo a __init__. Como no quería cambiarle la clase, hice una "
      "función aparte, nueva_lista(), que crea el objeto y llama a init() una vez "
      "antes de insertar a los jugadores.")

    p("Esa fue una de las cosas que más me sirvió para entender que no basta con "
      "que el código compile: hay que saber qué está pasando por dentro.")

    codigo("""
def nueva_lista():
    lista = ListaCircular()
    lista.init()
    return lista
""", "Inicialización explícita de la lista.")

    tabla(
        ["Operación", "Dónde la uso", "Tiempo"],
        [
            ["insertar_final(dato)", "Para meter a los jugadores al círculo.", "O(1)"],
            ["recorrer()", "Para mostrar la lista y contar cuántos quedan.", "O(n)"],
            ["contiene(dato)", "Para revisar nombres repetidos y destinos válidos.", "O(n)"],
            ["eliminar(dato)", "Para sacar al que recibe la explosión.", "O(n)"],
            ["cabeza / siguiente", "Para pasar el turno sin salirme del círculo.", "O(1)"],
        ],
        anchos=[4.4, 9.6, 2.0],
    )

    h2("2.4 La lógica del juego en Python")
    p("La función pasar_papa() es el corazón del juego. Primero revisa que la lista "
      "exista, que el destino esté en el círculo y que no me esté pasando la papa a "
      "mí mismo. Después busca al jugador, baja la mecha y, si llega a cero, lo "
      "elimina. Si todavía quedan dos o más, el turno sigue con el siguiente nodo y "
      "se sortea otra mecha; si queda uno solo, ese es el ganador.")

    p("Algo que aprendí en el camino: no se puede confiar solo en lo que hace el "
      "navegador. Aunque los botones estén bien, alguien podría mandar una petición "
      "con un nombre que no existe o con la mecha en negativo. Por eso todas las "
      "reglas se revisan otra vez en Python antes de cambiar el estado.")

    codigo("""
def pasar_papa(lista, actual, mecha, destino):
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
    if mecha <= 0:
        eliminado = objetivo.dato
        siguiente = objetivo.siguiente
        lista.eliminar(eliminado)
        if len(lista.recorrer()) == 1:
            actual = lista.cabeza
            ganador = actual.dato
        else:
            actual = siguiente
            mecha = random.randint(MECHA_MIN, MECHA_MAX)
    else:
        actual = objetivo
    return {"lista": lista, "actual": actual, "mecha": mecha, ...}
""", "Regla principal de pases y eliminación (resumida).")

    p("La partida se guarda en una cookie de sesión que Flask firma. No usé base de "
      "datos porque para una partida no hacía falta: cada navegador tiene la suya y "
      "no se mezcla con la de otra persona. En cada petición el servidor vuelve a "
      "armar la lista con los nombres guardados, busca el turno actual y aplica el "
      "cambio. Las gotas se guardan como una lista de diccionarios con id, ángulo y "
      "radio.")

    p("Cuando cambié el nombre de la cookie para que fuera más claro, todas las "
      "partidas que tenía abiertas dejaron de funcionar. Al principio pensé que "
      "había roto algo, pero era lo esperado: al cambiar la firma, la sesión vieja "
      "ya no vale. Lo dejé anotado para no volver a asustarme.")

    tabla(
        ["Ruta", "Método", "Qué le mando", "Qué me devuelve"],
        [
            ["/", "GET", "—", "La página del juego."],
            ["/api/nueva", "POST", '{"jugadores": ["Ana", "Beto"]}',
             "Los jugadores, el turno, la mecha y las gotas."],
            ["/api/pasar", "POST", '{"destino": "Beto"}',
             "El estado nuevo, quién salió y quién va ganando."],
            ["/api/recoger", "POST", '{"gota_id": "a1b2c3d4"}',
             "La mecha con +1 y las gotas que quedan."],
        ],
        anchos=[2.7, 1.7, 4.8, 7.0],
        tamano=8.5,
    )

    h2("2.5 La escena 3D y los controles")
    p("La cámara usa perspectiva, que es lo que hace que las cosas lejanas se vean "
      "más chicas y la escena no parezca plana. Para que se sienta con volumen puse "
      "sombras debajo de los jugadores y de la fogata, y una niebla suave al fondo "
      "para que no se vea el borde de la mesa. La luz principal viene de arriba, hay "
      "otra luz fría de relleno y la fogata tiene su propia luz cálida que parpadea.")

    bullets([
        ("Escenario: ", "una mesa circular, un anillo que marca el círculo, piedras, "
         "troncos y llamas en el centro."),
        ("Jugadores: ", "cada uno tiene base, cuerpo, cabeza y un nombre flotando. "
         "El que tiene la papa se ve distinto."),
        ("Cámara: ", "se puede girar arrastrando y acercar con la rueda. También "
         "responde a las flechas del teclado."),
        ("Límites: ", "la cámara no puede bajar del piso ni alejarse demasiado, para "
         "que no se pierda la escena."),
        ("Clics: ", "uso un Raycaster, que es como lanzar un rayo invisible desde "
         "donde hice clic para ver qué objeto toca."),
        ("Animaciones: ", "la papa vuela en curva, los jugadores se acomodan cuando "
         "alguien sale y las gotas flotan y desaparecen al recogerlas."),
        ("Efectos: ", "la explosión tiene partículas, una onda que se expande y un "
         "pequeño temblor en el panel de la mecha."),
    ])

    p("La cámara fue lo que más me costó. Al principio, cada vez que arrastraba para "
      "girar, sin querer se seleccionaba un jugador. Lo resolví midiendo cuántos "
      "píxeles se movió el mouse: si se movió muy poco, cuenta como clic; si se "
      "movió más de siete, era un arrastre y no pasa nada. Parece un detalle tonto, "
      "pero cambió por completo la forma de jugar.")

    h2("2.6 Las gotas de agua")
    p("La idea de las gotas salió probando la partida: pasar la papa era divertido "
      "las primeras veces, pero después se volvía repetitivo. Entonces pensé en algo "
      "que se pudiera recoger con el mouse y que diera una ventaja pequeña. Así "
      "llegaron las gotas: cada una suma un punto de mecha, con un máximo de 12.")

    p("Cada partida genera tres gotas alrededor de la fogata. El servidor elige un "
      "ángulo y un radio para cada una y los guarda en la sesión; el navegador dibuja "
      "la forma de gota, un halo en el piso y una luz azul. Al hacer clic, main.js "
      "sabe cuál es y manda su id a /api/recoger.")

    p("Del lado de Python se revisa que la gota exista y que la mecha no esté al "
      "máximo. Si todo está bien, la gota se saca de la lista, la mecha sube uno y "
      "se devuelve el estado completo. Cuando alguien explota, vuelven a aparecer "
      "tres gotas para la siguiente ronda.")

    p("Un error que tuve que corregir: al inicio se podía recoger la misma gota dos "
      "veces si hacías doble clic rápido, y la mecha subía de más. Lo arreglé "
      "quitando la gota de la lista en el servidor y validando el máximo ahí mismo, "
      "no solo en la pantalla.")

    codigo("""
def recoger_gota(gotas, mecha, gota_id):
    if not isinstance(gota_id, str) or not gota_id:
        raise ValueError("La gota indicada no es válida.")
    if mecha >= MECHA_MAXIMA_AGUA:
        raise ValueError("La mecha ya está al máximo; no necesita más agua.")
    for indice, gota in enumerate(gotas):
        if gota["id"] == gota_id:
            gotas.pop(indice)
            return {"mecha": mecha + 1, "gotas": gotas, "gota": gota}
    raise ValueError("Esa gota ya fue recogida.")
""", "Validación y efecto de la recolección.")

    h2("2.7 Dependencias y cómo se ejecuta")
    p("El backend necesita Flask y, por si se publica en Render, gunicorn. Three.js "
      "se carga desde internet con un importmap, así que no hay que instalar Node.js "
      "ni compilar nada. La primera vez que abre la página necesita conexión para "
      "descargar Three.js, y el navegador tiene que tener WebGL activo.")

    p("Al comienzo instalé Flask sin entorno virtual y se me mezclaron las versiones "
      "con otros proyectos. Después aprendí a crear un entorno con venv y a instalar "
      "todo ahí. Desde entonces los errores raros desaparecieron.")

    codigo("""
Flask==3.0.3
gunicorn==22.0.0
""", "requirements.txt del proyecto.")

    codigo("""
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
python app.py

# Abrir en el navegador
http://127.0.0.1:5000
""", "Ejecución local.")

    h2("2.8 Las pruebas")
    p("Las pruebas las hice con unittest, que ya viene con Python. Cubren la lista "
      "circular, las reglas del juego, las gotas y la API. Para probar Flask uso su "
      "cliente de pruebas, así no tengo que levantar el servidor cada vez. Al final "
      "quedaron catorce pruebas y todas pasan.")

    p("No voy a decir que salieron a la primera. Las primeras veces fallaban porque "
      "me olvidaba de llamar a init() o porque esperaba otro orden en la lista. Ver "
      "el mensaje de error, corregir y volver a correr se volvió casi una costumbre, "
      "y creo que así entendí mejor lo que estaba haciendo.")

    tabla(
        ["Grupo", "Qué revisa"],
        [
            ["Lista circular", "Insertar, recorrer, buscar y eliminar sin romper el círculo."],
            ["Reglas", "Pase normal, explosión, ganador, nombres repetidos y autopase."],
            ["Gotas", "Que se creen bien, se recojan una sola vez y no pasen del máximo."],
            ["API", "Que /api/nueva y /api/recoger respondan lo que deben."],
        ],
        anchos=[3.8, 12.2],
    )

    codigo("""
$ python3 -m unittest discover -s tests -v
...
Ran 14 tests in 0.307s
OK
""", "Salida resumida de las pruebas automáticas.")

    p("También jugué varias veces a mano: recogí gotas, pasé la papa, provoqué "
      "explosiones, llegué a ganar, reinicié la partida y moví la cámara con el "
      "ratón, la rueda y las flechas. Probé en ventana normal y en pantalla de "
      "celular. Al final revisé la consola del navegador y no quedaban errores.")


# ----------------------------------------------------------------------
# 3. Despliegue
# ----------------------------------------------------------------------

def despliegue():
    h1("3. Documentación del despliegue")

    h2("3.1 Por qué elegí PythonAnywhere")
    p("Necesitaba un hosting gratis y que no me pidiera tarjeta. Probé a mirar varias "
      "opciones y al final me quedé con PythonAnywhere porque está pensado para "
      "Python, tiene consola, editor y una dirección fija. La cuenta gratuita solo "
      "permite una aplicación web y hay que renovarla cada cierto tiempo, pero para "
      "un trabajo del curso alcanza.")

    tabla(
        ["Plataforma", "Por qué no la elegí"],
        [
            ["PythonAnywhere", "Fue la que elegí: Flask funciona directo y la URL es gratuita."],
            ["Render", "Está bien, pero la versión gratuita se duerme por inactividad."],
            ["Glitch", "Había que cambiar la forma de arrancar el proyecto."],
            ["Vercel", "Está pensado para funciones sueltas, no para una app Flask completa."],
        ],
        anchos=[4.0, 12.0],
    )

    h2("3.2 Preparar el paquete")
    p("Antes de subir nada, comprimí el proyecto sin el entorno virtual ni las "
      "carpetas __pycache__, porque esos archivos pesan y no sirven en el servidor. "
      "El ZIP tiene que llevar la carpeta papa-caliente-3d con app.py, juego.py, "
      "lista_circular.py, requirements.txt, templates, static y tests.")

    codigo("""
cd ~/Imágenes
zip -qr papa-caliente-3d.zip papa-caliente-3d \\
    -x '*/__pycache__/*' '*.pyc' '.venv/*'
""", "Empaquetado local (Linux/macOS). En Windows se puede usar el Explorador: clic derecho → Enviar a → Carpeta comprimida.")

    h2("3.3 Subirlo y descomprimirlo")
    numeros([
        "Entro a https://www.pythonanywhere.com con mi cuenta SAMIR18.",
        "Voy a la pestaña Files y subo papa-caliente-3d.zip a /home/SAMIR18.",
        "Abro una consola Bash desde Consoles → Bash.",
        "Descomprimo el archivo y reviso que estén todas las carpetas.",
        "Instalo Flask si la cuenta todavía no lo tiene.",
    ])

    codigo("""
cd ~
unzip -o papa-caliente-3d.zip
ls papa-caliente-3d
python3 -m pip install --user Flask==3.0.3
""", "Comandos de la consola Bash de PythonAnywhere.")

    h2("3.4 Configurar la aplicación web")
    p("En la pestaña Web se configura todo a mano. Si la aplicación ya existe, como "
      "en mi caso, no hay que crearla otra vez: se actualizan los archivos y se "
      "pulsa Reload. Si se empieza de cero, se elige Manual configuration y una "
      "versión de Python 3.10 o superior.")

    p("Al principio no entendía por qué no bastaba con subir los archivos. Después "
      "entendí que PythonAnywhere necesita un archivo WSGI que le diga dónde está "
      "el proyecto y qué variable tiene la aplicación. Ese archivo es como la puerta "
      "de entrada.")

    tabla(
        ["Campo", "Qué puse"],
        [
            ["Source code", "/home/SAMIR18/papa-caliente-3d"],
            ["Working directory", "/home/SAMIR18/papa-caliente-3d"],
            ["WSGI file", "El que indica PythonAnywhere; borré lo que traía y puse mi código."],
            ["Virtualenv", "No usé. Flask quedó instalado con pip --user."],
            ["Variables", "SECRET_KEY con una clave larga y difícil de adivinar."],
        ],
        anchos=[4.2, 11.8],
    )

    codigo("""
import sys

path = "/home/SAMIR18/papa-caliente-3d"
if path not in sys.path:
    sys.path.insert(0, path)

from app import app as application
""", "Contenido del archivo WSGI configuration file.")

    p("La clave secreta la puse como variable de entorno para no dejarla escrita en "
      "el código. Cuando la cambié, las partidas que tenía abiertas se perdieron. "
      "Me asusté un momento, pero es normal: la cookie vieja ya no coincide con la "
      "firma nueva. Solo hay que empezar otra partida.")

    codigo("""
# En la consola Bash, antes de recargar:
export SECRET_KEY="una-clave-larga-y-propia"
# En el panel Web también se puede agregar como variable de entorno.
""", "Configuración recomendada de SECRET_KEY.")

    h2("3.5 Comprobar que quedó bien")
    numeros([
        "Pulso Reload en la pestaña Web y espero unos segundos.",
        "Abro https://samir18.pythonanywhere.com en una ventana privada.",
        "Creo una partida con tres jugadores.",
        "Recojo una gota y reviso que la mecha suba.",
        "Paso la papa hasta que explote alguien y confirmo que sale del círculo.",
        "Giro la cámara con el ratón y con las flechas.",
        "Abro la consola del navegador para ver si hay errores.",
    ])

    p("Si veo la versión anterior, recargo con Ctrl + F5, porque a veces el "
      "navegador guarda el JavaScript viejo y no lo suelta.")

    aviso(
        "Sobre el registro de inicio:",
        "en mi computadora aparece el mensaje «Running on http://127.0.0.1:5000». En "
        "PythonAnywhere no sale ese mensaje porque la aplicación no se inicia con "
        "python app.py, sino con el botón Reload. Por eso guardé una captura del "
        "arranque local y otra del panel con el Reload y el registro de accesos.",
        color_fondo="EAF2FB",
        color_borde="1D4E89",
    )

    h2("3.6 Problemas frecuentes y solución")
    tabla(
        ["Lo que me pasó", "Por qué era", "Cómo lo resolví"],
        [
            ["Error 500 al abrir la URL", "Faltaba Flask o la ruta del WSGI estaba mal.",
             "Revisé el Error log, instalé Flask con pip --user y corregí la ruta."],
            ["ModuleNotFoundError: flask", "La app estaba usando otro intérprete.",
             "Instalé Flask en esa versión y volví a cargar."],
            ["La página abría pero el 3D estaba negro", "WebGL apagado o el CDN no cargaba.",
             "Activé la aceleración por hardware y revisé la conexión."],
            ["Seguía viendo la versión vieja", "El navegador tenía guardado el JavaScript anterior.",
             "Recargué con Ctrl + F5 y comprobé las fechas de los archivos."],
            ["La partida se perdía al recargar", "Cambié la SECRET_KEY o el navegador bloqueaba cookies.",
             "Dejé una clave fija y permití las cookies del sitio."],
            ["No podía crear otra app web", "La cuenta gratuita solo permite una.",
             "Reutilicé la aplicación que ya tenía."],
        ],
        anchos=[4.4, 5.4, 6.2],
        tamano=8.5,
    )


# ----------------------------------------------------------------------
# 4. Aporte final
# ----------------------------------------------------------------------

def aporte_final():
    h1("4. Aporte final: evidencias del desarrollo y despliegue")
    p("Aquí están las capturas que pide la guía, con un comentario de lo que se ve "
      "en cada una. Las tomé mientras trabajaba, no las saqué de internet. Si alguna "
      "aparece como pendiente es porque todavía no la había guardado con el nombre "
      "correcto.")

    h2("4.1 El proyecto en el IDE")
    figura(
        "01_ide_estructura.png",
        "El proyecto abierto en el editor. Se ven app.py, juego.py, lista_circular.py, "
        "templates, static y tests.",
    )
    p("Esta captura la tomé con el proyecto ya ordenado. Al principio tenía todo "
      "revuelto en una carpeta; después separé la lógica, la escena 3D y las pruebas. "
      "Así, cuando algo falla, ya sé más o menos por dónde buscar.")

    figura(
        "02_ide_codigo.png",
        "app.py y juego.py abiertos, con las rutas de Flask y las funciones de la "
        "lista circular.",
    )
    p("En app.py están las rutas /api/nueva, /api/pasar y /api/recoger. En juego.py "
      "está lo que no depende del navegador: la mecha, los turnos, las gotas y el "
      "ganador. Separarlos me ayudó a probar las reglas sin abrir la página.")

    figura(
        "03_ide_dependencias.png",
        "requirements.txt y la terminal del entorno virtual con Flask instalado.",
    )
    p("Las dependencias son pocas: Flask y lo que trae consigo. Three.js se descarga "
      "desde internet, así que no tuve que instalar Node.js ni compilar nada. Eso fue "
      "un alivio porque no quería sumar más cosas al proyecto.")

    h2("4.2 Git y GitHub")
    figura(
        "04_git_terminal.png",
        "La terminal con los comandos de Git, los commits y el push al repositorio.",
    )
    p("No había usado Git más allá de lo básico, así que al principio me "
      "confundía con el orden de los comandos. Cuando entendí que cada commit "
      "es como guardar una foto del proyecto, todo tuvo más sentido. Aquí se ve el "
      "historial: primero subí la versión con gotas, cámara y explosiones, y después "
      "un cambio pequeño para las cookies de sesión.")

    figura(
        "05_github_repo.png",
        "El repositorio en GitHub, con las carpetas, el README y los commits.",
    )
    p("Con el repositorio publicado, cualquiera puede revisar el código sin pedirme "
      "el ZIP. También me sirvió para tener una copia por si algo se rompía en mi "
      "computadora.")

    h2("4.3 El hosting")
    figura(
        "06_hosting_panel.png",
        "El panel Web de PythonAnywhere con la ruta del proyecto, el archivo WSGI y el "
        "botón Reload.",
    )
    p("En esta parte me demoré más de lo que pensaba. La ruta tiene que ser exactamente "
      "/home/SAMIR18/papa-caliente-3d, y el WSGI debe agregarla al sys.path e importar "
      "la aplicación como application. Cuando por fin vi el botón Reload en verde y la "
      "página cargó, sentí que el trabajo estaba terminando.")

    figura(
        "07_hosting_archivos.png",
        "La consola de PythonAnywhere después de subir y descomprimir el ZIP.",
    )
    p("Subí el ZIP desde Files y lo descomprimí con unzip -o. Ese -o hace que "
      "reemplace los archivos anteriores, así no quedan mezcladas dos versiones. "
      "Después revisé con ls que estuvieran app.py, templates y static.")

    figura(
        "08_hosting_variables.png",
        "La variable SECRET_KEY configurada en el hosting.",
    )
    p("La clave secreta es la que firma la cookie de la partida. La puse como variable "
      "de entorno para que no quedara escrita en el código ni en el repositorio. Es "
      "una de esas cosas que uno no le da importancia hasta que entiende que alguien "
      "podría leer la sesión si la clave fuera fácil.")

    h2("4.4 El registro de inicio")
    figura(
        "09_log_inicio.png",
        "El registro de arranque: en local se lee «Running on http://127.0.0.1:5000» "
        "y en PythonAnywhere se ve el Reload y el log de accesos.",
    )
    p("Esta captura me gusta porque es la prueba de que el servidor levanta sin "
      "errores. En mi computadora aparece el mensaje de Flask con la dirección local; "
      "en PythonAnywhere no se usa python app.py, sino que el servidor WSGI arranca "
      "cuando pulso Reload. Al principio esa diferencia me confundió, porque buscaba "
      "el mismo mensaje en el hosting y no lo encontraba.")

    h2("4.5 El juego publicado")
    figura(
        "10_juego_final.png",
        "El juego abierto en el navegador, con samir18.pythonanywhere.com visible en "
        "la barra de direcciones.",
    )
    p("Esta es la captura más importante para mí, porque ya no es el juego corriendo "
      "en mi laptop: está en internet y cualquiera puede entrar. En la barra se ve el "
      "dominio completo y en la escena están la fogata, los jugadores y el panel con "
      "la mecha.")

    figura(
        "11_juego_gotas.jpg",
        "Las gotas de agua alrededor de la fogata y el contador en el panel.",
        ancho=14.0,
    )
    p("Aquí estaba probando la mecánica nueva. Al hacer clic en una gota, el contador "
      "baja y la mecha sube un punto. Esa parte me costó varias pruebas porque al "
      "principio el clic también movía la cámara.")

    figura(
        "12_juego_explosion.jpg",
        "La explosión de un jugador, con partículas y la mecha en cero.",
        ancho=14.0,
    )
    p("La explosión fue lo último que agregué. Ver salir las partículas y que el "
      "jugador desapareciera del círculo me confirmó que la lista y la escena estaban "
      "conectadas de verdad. Después de eso, la mecha se reinicia y vuelven las gotas.")


# ----------------------------------------------------------------------
# 5. Conclusiones
# ----------------------------------------------------------------------

def conclusiones():
    h1("5. Conclusiones")

    p("Cuando empecé, la lista circular me parecía un tema de examen: algo que se "
      "entiende en el papel pero que no se ve en ningún lado. Al hacer el juego dejó "
      "de ser así. Cada vez que la papa cambia de mano estoy avanzando un nodo, y "
      "cuando alguien explota estoy eliminando uno y volviendo a cerrar el círculo. "
      "Eso es lo que más me llevo de la actividad: entendí la estructura usándola, "
      "no solo leyéndola.")

    p("También aprendí que un proyecto no termina cuando funciona en mi computadora. "
      "Todavía faltaba subirlo, configurar la aplicación, revisar los logs y aceptar "
      "que en internet las cosas se comportan distinto. Esa parte me dio más "
      "problemas que el código, pero fue la que más me enseñó.")

    h2("5.1 Lo que aprendí")
    bullets([
        ("A respetar el código del profesor: ", "su método init no se ejecuta solo, y "
         "en lugar de cambiarlo aprendí a llamarlo desde fuera. Entendí que muchas "
         "veces el problema no está en la clase, sino en cómo la uso."),
        ("A separar responsabilidades: ", "Python decide las reglas y el navegador "
         "dibuja. Cuando mezclaba todo, cualquier cambio rompía otra cosa."),
        ("A validar en el servidor: ", "no basta con esconder un botón; la mecha, las "
         "gotas y los turnos se revisan otra vez en Python."),
        ("A usar Git: ", "los commits me dieron tranquilidad. Si algo salía mal, podía "
         "volver atrás sin perder todo."),
        ("A publicar: ", "aprendí qué es un archivo WSGI, para qué sirve una variable "
         "de entorno y por qué el navegador a veces muestra una versión vieja."),
    ])

    h2("5.2 Lo que me faltó")
    bullets([
        "La cuenta gratuita de PythonAnywhere solo permite una aplicación web, así que "
        "tuve que reutilizar la que ya tenía.",
        "Three.js se carga desde internet; si no hay conexión, la escena 3D no aparece.",
        "La partida se guarda en una cookie, no en una base de datos. Si se borran las "
        "cookies, se pierde.",
        "No es multijugador en red: cada persona juega en su propio navegador.",
        "Me hubiera gustado agregar sonido, pero no me alcanzó el tiempo.",
    ])

    h2("5.3 Qué haría después")
    bullets([
        "Agregar sonido y música, con un botón para silenciar.",
        "Guardar partidas y puntajes en una base de datos.",
        "Inventar más objetos, como un hielo que congele la mecha por un turno.",
        "Mejorar el acceso con teclado y los textos para lectores de pantalla.",
        "Probar un modo en línea con WebSockets, aunque sea para dos personas.",
    ])

    p("En resumen, el juego cumple lo que pedía la actividad: lógica en Python, una "
      "estructura de datos hecha con clases, escena 3D con perspectiva, luces y "
      "profundidad, cámara que se puede mover, una mecánica de recolección, pruebas y "
      "una URL pública. Me quedan cosas por mejorar, pero la versión que entrego "
      f"funciona y se puede jugar en {PARAMS['url']}.")


# ----------------------------------------------------------------------
# 6. Referencias y anexo
# ----------------------------------------------------------------------

def referencias():
    h1("6. Referencias")
    p("Estas son las páginas que fui consultando cuando no entendía algo. La mayoría "
      "las abrí varias veces, sobre todo las de Flask y PythonAnywhere.")

    referencias_lista = [
        "Flask. Documentation. https://flask.palletsprojects.com/",
        "Three.js. Documentation. https://threejs.org/docs/",
        "Three.js. OrbitControls. https://threejs.org/docs/#examples/en/controls/OrbitControls",
        "Python Software Foundation. unittest — Unit testing framework. "
        "https://docs.python.org/3/library/unittest.html",
        "MDN Web Docs. Pointer events. https://developer.mozilla.org/es/docs/Web/API/Pointer_events",
        "PythonAnywhere. Help: Flask. https://help.pythonanywhere.com/pages/Flask/",
        "PythonAnywhere. Web apps. https://help.pythonanywhere.com/pages/WebApps/",
        "Guía de actividad calificada: Desarrollo y despliegue de un videojuego 3D en Python. "
        "Asignatura Estructura de Datos, docente Giomar, 2026.",
    ]
    for referencia in referencias_lista:
        par = doc.add_paragraph()
        par.paragraph_format.left_indent = Cm(0.7)
        par.paragraph_format.first_line_indent = Cm(-0.7)
        par.paragraph_format.space_after = Pt(5)
        r = par.add_run("•  ")
        r.font.color.rgb = ORANGE
        r.bold = True
        r = par.add_run(referencia)
        r.font.size = Pt(9.8)


def anexo():
    h1("Anexo A. Código y comandos que usé")
    p("Dejo aquí la estructura final y los comandos que repetí varias veces. Sirven "
      "por si hay que volver a publicar el juego o revisar dónde está cada cosa.")

    h2("A.1 Estructura final del proyecto")
    codigo("""
papa-caliente-3d/
├── app.py                  Rutas Flask y sesión
├── juego.py                Reglas, mecha y gotas
├── lista_circular.py       Clase ListaCircular del profesor + Nodo
├── requirements.txt        Dependencias de Python
├── Procfile                Arranque alternativo para Render
├── README.md               Documentación del proyecto
├── templates/
│   └── index.html          Página y panel
├── static/
│   ├── style.css
│   ├── escena.js           Three.js
│   └── main.js             Interfaz y API
├── tests/
│   └── test_lista.py
└── informe/
    ├── generar_informe.py
    └── capturas/
""")

    h2("A.2 Cómo actualizar la versión publicada")
    codigo("""
# 1. En local: crear el ZIP sin archivos temporales
cd ~/Imágenes
zip -qr papa-caliente-3d.zip papa-caliente-3d \\
    -x '*/__pycache__/*' '*.pyc' '.venv/*'

# 2. En PythonAnywhere: Files → subir el ZIP y luego Bash
cd ~
unzip -o papa-caliente-3d.zip

# 3. En Web: pulsar Reload y abrir
https://samir18.pythonanywhere.com/
""")

    h2("A.3 Lo que reviso antes de entregar")
    bullets([
        "Abro la URL en una ventana privada y confirmo que se ve la versión nueva.",
        "En la captura final aparece el dominio completo.",
        "Puedo crear una partida, recoger una gota y provocar una explosión.",
        "La consola del navegador no muestra errores.",
        "El repositorio de GitHub tiene el código y el README.",
        "El archivo se llama Videojuego3D_Apellido_Nombre.pdf y no depende de enlaces externos.",
    ])


# ----------------------------------------------------------------------
# Generación
# ----------------------------------------------------------------------

def generar():
    SALIDA.mkdir(parents=True, exist_ok=True)
    configurar_documento()
    encabezado_y_pie()
    portada()
    contenido()
    introduccion()
    memoria()
    despliegue()
    aporte_final()
    conclusiones()
    referencias()
    anexo()

    nombre_archivo = f"Videojuego3D_{PARAMS['apellido']}_{PARAMS['nombre']}".replace(" ", "_")
    docx_path = SALIDA / f"{nombre_archivo}.docx"
    doc.save(docx_path)
    print(f"DOCX generado: {docx_path}")

    entorno = os.environ.copy()
    entorno["HOME"] = "/tmp/opencode/lohome"
    os.makedirs(entorno["HOME"], exist_ok=True)
    try:
        subprocess.run(
            ["libreoffice", "--headless", "--convert-to", "pdf",
             "--outdir", str(SALIDA), str(docx_path)],
            check=True, env=entorno, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        )
        pdf_path = docx_path.with_suffix(".pdf")
        print(f"PDF generado:  {pdf_path}")
    except Exception as error:
        print(f"No se pudo convertir a PDF: {error}")


def main():
    parser = argparse.ArgumentParser(description="Genera el informe de Papa Caliente 3D.")
    parser.add_argument("--nombre", default=PARAMS["nombre"])
    parser.add_argument("--apellido", default=PARAMS["apellido"])
    parser.add_argument("--github", default=PARAMS["github"])
    parser.add_argument("--url", default=PARAMS["url"])
    args = parser.parse_args()

    PARAMS["nombre"] = args.nombre.strip() or PARAMS["nombre"]
    PARAMS["apellido"] = args.apellido.strip() or PARAMS["apellido"]
    PARAMS["github"] = args.github.strip() or PARAMS["github"]
    PARAMS["url"] = args.url.strip() or PARAMS["url"]
    generar()


if __name__ == "__main__":
    main()
