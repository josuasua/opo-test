# opo-test
Aplicación web test oposiciones

=========================================
 OPOS TEST – SIMULADOR DE EXÁMENES (LOCAL)
 Implementación: selector de temas en DROPDOWN (multi-selección)
=========================================

Este programa permite practicar tests tipo oposición de forma aleatoria,
con penalización configurable y estadísticas básicas.

- Funciona SIN internet.
- No envía datos a ningún sitio.
- Todo se ejecuta en tu ordenador.

-----------------------------------------
 ESTRUCTURA DE ARCHIVOS
-----------------------------------------

Carpeta del programa:

opos-test/
  - index.html      (interfaz del programa)
  - styles.css      (estilos / apariencia)
  - app.js          (lógica / funcionamiento)
  - preguntas.json  (base de datos de preguntas)

-----------------------------------------
 USO NORMAL
-----------------------------------------

1) Usa el simulador:
   - elige número de preguntas
   - elige penalización
   - (opcional) selecciona temas en el desplegable (dropdown)
   - pulsa "Empezar examen"

-----------------------------------------
 SELECTOR DE TEMAS (DROPDOWN)
-----------------------------------------

En vez de una lista grande de temas en pantalla, ahora hay un desplegable:

- Botón "Temas" / "Filtrar por temas"
- Al pulsarlo aparece un panel con:
  - buscador de temas
  - lista con casillas (multi-selección)
  - botones "Todos" y "Ninguno"
  - contador de seleccionados

IMPORTANTE:
- Si NO marcas ningún tema → entran TODOS los temas.
- Si marcas 1 o más temas → el examen solo saldrá de esos temas.

Consejo:
- Escribe en el buscador palabras como:
  "contratos", "procedimiento", "local", "presupuesto", etc.

-----------------------------------------
 BASE DE DATOS: preguntas.json
-----------------------------------------

El archivo preguntas.json contiene todas las preguntas.
Se irá ampliando poco a poco conforme se digitalicen más tests.

Formato recomendado de cada pregunta:

{
  "id": "T33-Q012",
  "test": 33,
  "tema": "Contratos del Sector Público",
  "pregunta": "Texto de la pregunta...",
  "opciones": {
    "A": "Opción A",
    "B": "Opción B",
    "C": "Opción C",
    "D": "Opción D"
  },
  "correcta": "C",
  "explicacion": "Opcional"
}

Notas:
- "id" debe ser único (no repetir).
- "correcta" siempre debe ser: "A", "B", "C" o "D".
- "test" (1..47) ayuda a ordenar y filtrar de forma estable.
- "tema" debe ser corto (evita párrafos largos).

-----------------------------------------
 RESULTADOS Y ESTADÍSTICAS
-----------------------------------------

El programa muestra al finalizar:
- aciertos
- fallos
- en blanco
- puntuación (aplicando penalización)
- % de acierto
- listado de falladas (con correcta y explicación si existe)

Histórico:
- guarda en este navegador la media y última nota.
- botón "Reset estadísticas" borra ese historial.

-----------------------------------------
 CONSEJOS DE USO PARA OPOSICIONES
-----------------------------------------

- No hace falta cargar 47 tests desde el primer día.
- Es mejor empezar por temas clave:
  Procedimiento, Contratos, Régimen Local, Presupuestos y Electrónica.
- Ir ampliando preguntas poco a poco.

=========================================
 FIN
=========================================
