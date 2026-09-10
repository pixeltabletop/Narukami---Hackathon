# Guion narrado del video de entrega — Chen

**Equipo:** Jajanken 2.0 — Diego Laverde y Josué Carrillo
**Reto:** Track 05, Caja de Ahorros — Hackatón ISD/QVAC 2026
**Duración objetivo:** menos de 4 minutos 45 segundos

## Bloque 1 — 0:00 a 0:24 · El equipo y la condición central

### LOCUCIÓN

Chen, tu pasiero financiero. Somos Jajanken 2.0: Diego Laverde y Josué Carrillo. Diego escribió la base Rastro para analizar consumo. Josué construyó sobre ella Chen: el dominio de cuenta, la organización del saldo, la proyección, el asistente y la integración verificada de QVAC. Chen nace para el Track 05 de Caja de Ahorros. Toda esta demostración usa clientes y movimientos sintéticos.

### EN PANTALLA

1. Muestre una placa limpia con “Jajanken 2.0”, los nombres Diego Laverde y Josué Carrillo, y “Track 05 — Caja de Ahorros”.
2. Abra Chen en la portada.
3. Mantenga visibles el logotipo y la advertencia de datos ficticios.

## Bloque 2 — 0:24 a 0:58 · Antes de descargar, el equipo dice lo que sabe

### LOCUCIÓN

Antes de descargar un modelo, ejecutamos `fit check`. El comando consulta al SDK y no baja pesos. En esta máquina, con cuatro coma cinco gigabytes libres, el SDK respondió que no tenía evidencia suficiente para decidir. Con trescientos treinta y un megabytes libres, indicó que ninguno de los dos candidatos entraba. Chen no convierte incertidumbre en una promesa. Muestra el rango de memoria, el tamaño de la descarga y la memoria disponible para tomar una decisión informada.

### EN PANTALLA

1. Muestre en terminal `npm run fit:check` y su salida guardada en `evidencia/fit-check.json`.
2. Resalte el veredicto “sin veredicto” y los supuestos visibles, sin ocultar la incertidumbre.
3. Cambie a Chen y abra “¿Aguanta este equipo el modelo?”.
4. Muestre el mismo veredicto junto al botón de carga.

## Bloque 3 — 0:58 a 1:36 · El problema bancario: entender qué sí fue gasto

### LOCUCIÓN

Un estado de cuenta enumera movimientos. La pregunta del cliente es otra: ¿en qué se me fue el dinero y cuánto tengo realmente disponible? Chen separa consumo de flujo de cuenta. Una compra de tarjeta explica consumo. El pago de esa tarjeta sale de la cuenta, pero no vuelve a contarse como gasto. Y una transferencia hacia la cuenta de ahorros es un traslado: el dinero cambió de lugar, no se consumió. Chen la muestra aparte con su importe. Esa distinción evita que un tablero genérico infle el gasto.

### EN PANTALLA

1. Seleccione a Ana Martínez y el período septiembre de 2026.
2. Abra el resumen y muestre el gasto neto, el período comparable y el pendiente de contabilizar.
3. Desplácese hasta “No es gasto”.
4. Abra el traslado hacia ahorros y muestre su movimiento.
5. Abra Movimientos y alterne los filtros “Tarjeta de crédito”, “Cuenta corriente” y “Cuenta de ahorros”.
6. Señale el pago de tarjeta sin volver a sumarlo al consumo.

## Bloque 4 — 1:36 a 2:22 · Una pregunta real y su evidencia

### LOCUCIÓN

Ahora hacemos una inferencia real. Preguntamos: “¿en qué se me fue el dinero?”. QVAC corre en este equipo. El modelo no suma importes, no consulta la base de datos y no redacta libremente. Recibe hechos ya calculados, clasifica la intención y selecciona entre una y tres referencias. La aplicación redacta con esos hechos. Si la intención no coincide con la evidencia, la respuesta se rechaza y se intenta una vez más. Abrimos la evidencia de la respuesta. La cifra no termina en una tarjeta del tablero: llega hasta los movimientos que la sostienen.

### EN PANTALLA

1. Abra el Asistente Chen con el estado “Modelo disponible”.
2. Escriba exactamente: “¿en qué se me fue el dinero?”.
3. Envíe la pregunta y conserve en la captura el envío y la llegada de la respuesta real.
4. Acelere o recorte únicamente el silencio de espera según la nota de montaje al final.
5. Abra la evidencia elegida por esa respuesta.
6. Muestre los movimientos de respaldo y sus importes.

## Bloque 5 — 2:22 a 3:08 · Organizar el saldo, no solo leer el pasado

### LOCUCIÓN

Chen no se queda en explicar el pasado. En Organiza, parte del saldo que existe hoy. Resta pendientes, compromisos confirmados, presupuesto variable y reserva. El próximo ingreso no se suma antes de recibirse. Un descuento directo de planilla se trata distinto: no reduce el saldo de hoy, porque el empleador lo retiene antes de pagar; reduce el próximo ingreso. Al excluir un compromiso o ajustar el presupuesto, el margen se recalcula. Así el cliente ve qué está disponible, qué ya está comprometido y qué puede reservar sin mezclar conceptos.

### EN PANTALLA

1. Abra Organiza.
2. Muestre saldo, pendientes, compromisos, presupuesto variable, reserva y margen.
3. Abra la explicación de “Pendiente”.
4. Desmarque un compromiso y muestre el margen recalculado.
5. Muestre por separado un descuento directo de planilla y su efecto sobre el próximo ingreso.
6. Ajuste el presupuesto variable y muestre nuevamente el margen.

## Bloque 6 — 3:08 a 3:42 · Escenarios y proyección día a día

### LOCUCIÓN

En Escenarios, el cliente compara una reserva conservadora, una sugerida y una ambiciosa, siempre viendo cuánto dinero queda. Ningún escenario altera sus movimientos. En Proyección, Chen avanza día por día porque un promedio mensual puede esconder la fecha en que la cuenta se queda corta. Reconoce patrones de ingreso mensuales, quincenales o irregulares. Coloca compromisos y cargos recurrentes en sus fechas. Si el saldo no alcanza, muestra el día y el faltante. También calcula cuántos días aguanta el saldo sin otro ingreso.

### EN PANTALLA

1. Abra Escenarios y muestre las tres alternativas con su saldo remanente.
2. Abra Proyección con Ana Martínez y muestre el patrón quincenal de los días 15 y 30.
3. Muestre el estado donde el saldo no alcanza, con el día y el faltante visibles.
4. Cambie a Luis Rodríguez y muestre el patrón irregular y la autonomía sin cobrar.

## Bloque 7 — 3:42 a 4:20 · La prueba de que la inferencia no sale del dispositivo

> **BLOQUEADO HASTA REHACER LA CORRIDA SIN RED.** La locución de este bloque describe la medición
> nueva, que comprueba la red antes, durante y después de inferir contra cuatro destinos. Los
> artefactos sin red que hay hoy en `evidencia/` son de la corrida del 9 de septiembre, hecha con
> el instrumento anterior: un solo sondeo, a un solo host, después de terminar la inferencia. El
> de voz ni siquiera lleva el campo de red. Si se graba este bloque tal como está, la narración
> promete una medición que el archivo en pantalla contradice, y es lo primero que un jurado
> técnico abriría. Antes de grabarlo hay que volver a correr `qvac:check` y `voice:check` con la
> red desconectada, y reemplazar los dos artefactos.

### LOCUCIÓN

La condición del reto es concreta: la inferencia en nube descalifica. Desactivamos la red y hacemos otra pregunta real. Chen responde porque QVAC y los datos están en este dispositivo. No existe respaldo remoto. Si el modelo local no está cargado, Chen lo dice y no responde. La prueba sin red registrada ejecutó siete preguntas de texto, entre catorce y diecinueve segundos cada una. También transcribió dos frases con Whisper dentro de QVAC. La medición comprobó la red antes, durante y después de inferir, contra cuatro destinos.

### EN PANTALLA

1. Desactive el Wi-Fi y muestre el estado sin conexión del sistema.
2. Regrese al Asistente Chen.
3. Escriba exactamente “¿por qué gasté más?” y envíe la pregunta.
4. Conserve en la captura la pregunta y la respuesta real; acelere solamente la espera.
5. Abra `evidencia/qvac-check-offline.json` y muestre `network.reachable: false`, las siete respuestas y sus latencias.
6. Muestre brevemente `evidencia/voice-check-offline.json` como evidencia separada del dictado local.

## Bloque 8 — 4:20 a 4:38 · Cierre

### LOCUCIÓN

Hoy, este portátil es el dispositivo y el servidor. Express escucha solamente en la dirección local. Chen no es una aplicación oficial del banco ni da asesoría financiera. Es un prototipo auditable: distingue gasto de traslado, organiza el saldo y abre cada respuesta hasta su evidencia, sin enviar la inferencia ni los datos del cliente a la nube. Somos Jajanken 2.0. Esto es Chen, tu pasiero financiero.

### EN PANTALLA

1. Vuelva al resumen de Chen.
2. Muestre en una secuencia breve “Entiende”, “Organiza”, “Proyección” y “Asistente”.
3. Cierre con una placa que diga “Chen, tu pasiero financiero”, debajo “Jajanken 2.0 — Diego Laverde y Josué Carrillo” y “Track 05 — Caja de Ahorros”.
4. Mantenga visible la leyenda “Prototipo con datos sintéticos. No es una aplicación oficial de Caja de Ahorros”.

## Antes de grabar, en este orden

1. Liberar memoria. Con menos de cuatro gigabytes libres el modelo tarda minutos en cargar y la
   grabación se vuelve impracticable. Cerrar lo que esté ocupando memoria, Jajanken incluido.
2. `npm run fit:check`, para saber si la máquina de grabación aguanta el modelo.
3. `npm run demo`, pulsar **Cargar modelo local** y esperar el estado listo. No es automático.
4. **Rehacer la corrida sin red**: desconectar el adaptador y correr `qvac:check` y `voice:check`,
   y copiar los artefactos nuevos a `evidencia/`. Sin esto el Bloque 7 no se puede grabar.
5. Confirmar que la pregunta del Bloque 4 responde como se espera en esa misma sesión.

## Duración estimada

Estimación calculada únicamente sobre la locución, a unas 160 palabras por minuto. Las pausas de inferencia se aceleran o recortan en montaje y no se suman como silencio al metraje final.

| Bloque | Palabras de locución | Duración estimada |
| --- | ---: | ---: |
| 1. Equipo y condición central | 62 | 0:23 |
| 2. Veredicto antes de descargar | 77 | 0:29 |
| 3. Qué sí fue gasto | 89 | 0:33 |
| 4. Pregunta y evidencia | 93 | 0:35 |
| 5. Organizar el saldo | 89 | 0:33 |
| 6. Escenarios y proyección | 82 | 0:31 |
| 7. Prueba sin red | 87 | 0:33 |
| 8. Cierre | 67 | 0:25 |
| **Total** | **646** | **4:02** |

La locución deja aproximadamente 46 segundos frente al objetivo máximo de 4:45. El cronograma de bloques reserva 39 de esos segundos para transiciones, respiraciones y aperturas de evidencia; termina en 4:38 y deja siete segundos adicionales de seguridad. El límite duro del reto sigue siendo cinco minutos.

## Lo que NO se dice

- No se afirma que el modelo razone sobre finanzas, calcule saldos ni dé consejo financiero. Los importes los calculan motores deterministas.
- No se presenta Chen como producto oficial de Caja de Ahorros ni se presupone aval del banco. La marca identifica el reto.
- No se muestran ni se insinúan datos reales. Ana Martínez y Luis Rodríguez son clientes sintéticos.
- No se afirma que exista integración bancaria de producción. La autenticación es demostrativa; identidad bancaria, TLS, autorización, retención y auditoría quedan fuera del prototipo.
- No se afirma que `fit:check` garantice rendimiento. El comando informa el veredicto y los supuestos que devuelve el SDK antes de descargar pesos.
- No se afirma que una prueba aislada de conectividad demuestre privacidad. La evidencia combina revisión del código, una prueba automatizada contra inferencia en nube y una corrida real sin red.
- No se dice que la API de voz del navegador sea parte de Chen. El dictado usa Whisper dentro de QVAC precisamente para mantener el audio en el equipo.
- No se recita, sustituye ni prepara ninguna respuesta del modelo. Si la inferencia real falla, la toma se descarta y se vuelve a grabar.

## Nota de latencia y montaje honesto

En esta máquina, cada respuesta del modelo tarda entre 11 y 26 segundos. Dejar esas pausas completas y en silencio haría que el video perdiera ritmo y pondría en riesgo el límite de cinco minutos.

La grabación debe conservar siempre una inferencia real. Capture en una misma toma el envío de la pregunta, el estado de espera y la llegada de la respuesta producida por QVAC. En montaje, acelere o recorte solamente el tramo de espera. Marque el salto con una leyenda visible, por ejemplo: “Espera real acelerada. Latencia de esta respuesta: XX segundos”. Use el tiempo real de esa toma, no una cifra preparada.

No sustituya la respuesta, no inserte una respuesta de otra corrida y no la grabe antes que la pregunta. Si QVAC falla, descarte la toma completa y repítala. El montaje reduce silencio; no cambia qué respondió el modelo ni presenta una respuesta pregrabada como si hubiera ocurrido en cámara.
