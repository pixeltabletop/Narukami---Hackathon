# Guion narrado del video de entrega — Chen

**Equipo:** Narukami — Diego Laverde y Josué Carrillo
**Reto:** Track 05, Caja de Ahorros — Hackatón ISD/QVAC 2026
**Locución medida:** 3 minutos 21 segundos. Con transiciones y esperas, el video debe cerrar por debajo de 4 minutos. El límite duro del reto es 5.

## Bloque 1 — 0:00 a 0:19 · El equipo y la condición central

### LOCUCIÓN

Chen, tu pasiero financiero. Somos Narukami: Diego Laverde y Josué Carrillo. Diego escribió la base Rastro para analizar consumo. Josué construyó Chen sobre ella. Esta demostración del reto de Caja de Ahorros usa únicamente clientes y movimientos sintéticos.

### EN PANTALLA

1. Muestre una placa limpia con “Narukami”, los nombres Diego Laverde y Josué Carrillo, y “Track 05 — Caja de Ahorros”.
2. Abra Chen en la portada.
3. Mantenga visibles el logotipo y la advertencia de datos ficticios.

## Bloque 2 — 0:19 a 0:40 · Antes de descargar, el equipo dice lo que sabe

### LOCUCIÓN

Antes de descargar un modelo, Chen consulta al sistema sin bajar sus archivos. En este equipo, con menos de un gigabyte libre, ningún candidato entraba. Cuando la evidencia no basta, Chen admite que no sabe. También muestra la memoria necesaria, la descarga y la memoria disponible.

### EN PANTALLA

1. Muestre en terminal `npm run fit:check` y su salida guardada en `evidencia/fit-check.json`.
2. Resalte el veredicto “sin veredicto” y los supuestos visibles, sin ocultar la incertidumbre.
3. Cambie a Chen y abra “¿Aguanta este equipo el modelo?”.
4. Muestre el mismo veredicto junto al botón de carga.

## Bloque 3 — 0:40 a 1:05 · El problema bancario: entender qué sí fue gasto

### LOCUCIÓN

Un estado de cuenta enumera movimientos. Chen responde algo más útil: en qué se fue el dinero y cuánto queda disponible. Separa consumo de flujo de cuenta. Una compra de tarjeta sí es gasto. Pagar esa tarjeta mueve dinero desde la cuenta, pero no duplica el consumo. Transferir hacia ahorros también es un traslado. El dinero cambió de lugar; no se gastó.

### EN PANTALLA

1. Seleccione a Ana Martínez y el período septiembre de 2026.
2. Abra el resumen y muestre el gasto neto, el período comparable y el pendiente de contabilizar.
3. Desplácese hasta “No es gasto”.
4. Abra el traslado hacia ahorros y muestre su movimiento.
5. Abra Movimientos y alterne los filtros “Tarjeta de crédito”, “Cuenta corriente” y “Cuenta de ahorros”.
6. Señale el pago de tarjeta sin volver a sumarlo al consumo.

## Bloque 4 — 1:05 a 1:32 · Una pregunta real y su evidencia

### LOCUCIÓN

Ahora hacemos una inferencia real: preguntamos en qué se fue el dinero. QVAC corre en este equipo. El modelo no suma importes ni consulta la base. Recibe hechos ya calculados, clasifica la intención y elige referencias. La aplicación redacta con esos hechos. Si la evidencia no coincide, rechaza la respuesta. Luego abrimos los movimientos que sostienen la cifra.

### EN PANTALLA

1. Abra el Asistente Chen con el estado “Modelo disponible”.
2. Escriba exactamente: “¿en qué se me fue el dinero?”.
3. Envíe la pregunta y conserve en la captura el envío y la llegada de la respuesta real.
4. Acelere o recorte únicamente el silencio de espera según la nota de montaje al final.
5. Abra la evidencia elegida por esa respuesta.
6. Muestre los movimientos de respaldo y sus importes.

## Bloque 5 — 1:32 a 1:57 · Organizar el saldo, no solo leer el pasado

### LOCUCIÓN

En Organiza, Chen parte del saldo disponible hoy. Separa pendientes, compromisos, presupuesto variable y reserva. El próximo ingreso no se suma antes de recibirse. Un descuento directo de planilla tampoco toca el saldo de hoy; el empleador lo retiene del próximo ingreso. Al cambiar un compromiso o presupuesto, Chen recalcula el margen.

### EN PANTALLA

1. Abra Organiza.
2. Muestre saldo, pendientes, compromisos, presupuesto variable, reserva y margen.
3. Abra la explicación de “Pendiente”.
4. Desmarque un compromiso y muestre el margen recalculado.
5. Muestre por separado un descuento directo de planilla y su efecto sobre el próximo ingreso.
6. Ajuste el presupuesto variable y muestre nuevamente el margen.

## Bloque 6 — 1:57 a 2:31 · Escenarios, proyección y la pregunta que decide

### LOCUCIÓN

En Escenarios, el cliente compara tres niveles de ahorro y cuánto dinero queda. Ninguno altera sus movimientos. La proyección avanza día por día, porque un promedio mensual puede ocultar cuándo falta dinero. Reconoce el patrón de ingresos y ubica compromisos en sus fechas. Si el saldo no alcanza, muestra el día y el faltante. También calcula cuánto aguanta sin otro ingreso. Preguntamos al asistente si alcanza hasta el próximo pago. Responde con el mismo veredicto de la proyección.

### EN PANTALLA

1. Abra Escenarios y muestre las tres alternativas con su saldo remanente.
2. Abra Proyección con Ana Martínez y muestre el patrón quincenal de los días 15 y 30.
3. Muestre el estado donde el saldo no alcanza, con el día y el faltante visibles.
4. Cambie a Luis Rodríguez y muestre el patrón irregular y la autonomía sin cobrar.
5. Vuelva a Ana Martínez, abra el Asistente Chen y escriba exactamente: “¿me alcanza hasta el próximo pago?”.
6. Conserve el envío y la llegada de la respuesta real; acelere solamente la espera.
7. Ponga la respuesta del asistente al lado del veredicto de la pestaña para que se vea que dicen lo mismo.

## Bloque 7 — 2:31 a 3:02 · La prueba de que la inferencia no sale del dispositivo

### LOCUCIÓN

La condición del reto es clara: la inferencia en la nube descalifica. Desactivamos la red y hacemos otra pregunta real. Chen responde porque QVAC y los datos están en este dispositivo. No existe respaldo en la nube. Si el modelo local no está cargado, Chen lo informa y no responde. La prueba sin red completó nueve preguntas y dos dictados transcritos por Whisper dentro de QVAC. La conectividad se midió antes, durante y después.

### EN PANTALLA

1. Desactive el Wi-Fi y muestre el estado sin conexión del sistema.
2. Regrese al Asistente Chen.
3. Escriba exactamente “¿por qué gasté más?” y envíe la pregunta.
4. Conserve en la captura la pregunta y la respuesta real; acelere solamente la espera.
5. Abra `evidencia/qvac-check-offline.json` y muestre `network.reachable: false`, las tres tomas contra los cuatro destinos, las nueve respuestas y sus latencias.
6. Muestre brevemente `evidencia/voice-check-offline.json` como evidencia separada del dictado local.

## Bloque 8 — 3:02 a 3:21 · Cierre

### LOCUCIÓN

Chen no es una aplicación oficial del banco ni ofrece asesoría financiera. Es un prototipo auditable. Distingue gasto de traslado, organiza el saldo y abre la evidencia, sin enviar la inferencia ni los datos a la nube. Somos Narukami. Chen, tu pasiero financiero.

### EN PANTALLA

1. Vuelva al resumen de Chen.
2. Muestre en una secuencia breve “Entiende”, “Organiza”, “Proyección” y “Asistente”.
3. Cierre con una placa que diga “Chen, tu pasiero financiero”, debajo “Narukami — Diego Laverde y Josué Carrillo” y “Track 05 — Caja de Ahorros”.
4. Mantenga visible la leyenda “Prototipo con datos sintéticos. No es una aplicación oficial de Caja de Ahorros”.

## Antes de grabar, en este orden

1. Liberar memoria. Con menos de cuatro gigabytes libres el modelo tarda minutos en cargar y la
   grabación se vuelve impracticable. Cerrar todo lo demás antes de empezar.
2. `npm run fit:check`, para saber si la máquina de grabación aguanta el modelo.
3. `npm run demo`, pulsar **Cargar modelo local** y esperar el estado listo. No es automático.
4. La corrida sin red ya está hecha y archivada, del 10 de septiembre. Si se rehace, poner el
   perfil de Wi-Fi en conexión manual antes de desconectar: en automático Windows se reconecta
   solo a mitad de la corrida y la prueba deja de valer.
5. Confirmar que la pregunta del Bloque 4 responde como se espera en esa misma sesión.

## Duración, medida y no estimada

Estas cifras salen de sintetizar la locución con la voz que se va a usar y leer la duración de
cada archivo. `npm run locucion` las regenera y las vuelve a medir.

La versión anterior de esta tabla estimaba a 160 palabras por minuto y daba 4:17. Al sintetizarla
duraba **4:55**: esta voz habla a 140 palabras por minuto, no a 160. El guion se recortó de 690 a
451 palabras con ese dato delante, no con la conjetura.

| Bloque | Palabras | Duración | Acumulado |
| --- | ---: | ---: | ---: |
| 1. Equipo | 38 | 0:19 | 0:19 |
| 2. Veredicto de memoria | 46 | 0:20 | 0:40 |
| 3. Qué sí fue gasto | 62 | 0:26 | 1:05 |
| 4. Inferencia real | 58 | 0:27 | 1:32 |
| 5. Organiza | 52 | 0:24 | 1:57 |
| 6. Proyección y asistente | 78 | 0:34 | 2:31 |
| 7. Sin red | 74 | 0:31 | 3:02 |
| 8. Cierre | 43 | 0:20 | 3:21 |
| **Total** | **451** | **3:21** | |

Los tramos de cada bloque son los de la locución. La acción en pantalla necesita algo más: las
transiciones y las dos esperas de inferencia. Con eso el video debe cerrar por debajo de cuatro
minutos, con más de un minuto de margen contra el límite del reto.

Si al montar hiciera falta recortar, lo primero que sale es la enumeración de productos del
Bloque 3. Lo último, el Bloque 7: es el que sostiene la elegibilidad.

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
