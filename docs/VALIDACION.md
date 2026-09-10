# Validación

Corte: 10 de septiembre de 2026. Todo lo que sigue fue ejecutado en la máquina de desarrollo,
no estimado. Los artefactos citados se generan con los comandos indicados.

## Determinista, sin modelos

| Qué | Resultado |
| --- | --- |
| `npm test` | 42 de 42 |
| `npm run build` | TypeScript y Vite sin errores |
| `npm run ui:check` | Recorrido en Edge, escritorio y móvil |

Cubierto por las pruebas: importes en centavos enteros, deduplicación, períodos equivalentes y
ausencia de historial, traslados que no suman al gasto, descuentos de planilla que no reducen el
saldo, proyección día a día que cuadra con sus propios eventos, historial por rubro y por
comercio, coherencia entre la etiqueta del modelo y su evidencia, aislamiento entre clientes,
sesiones y CSRF, y la cerca contra inferencia en nube.

El recorrido de interfaz no depende del estado guardado: fija los valores del plan antes de
medir, y elige un destino de categoría distinto del actual antes de guardarlo.

## Inferencia local con QVAC

`npm run qvac:check` carga el modelo, corre siete preguntas reales y escribe
`artifacts/qvac-check.json`. Última corrida con red disponible: 7 de 7 con intención y evidencia
correctas.

`npm run model:bench` compara los dos candidatos sobre ocho preguntas y escribe
`artifacts/model-bench.json`.

| | QWEN3 4B Q4_K_M | GEMMA4 2B Q4_K_M |
| --- | --- | --- |
| Preguntas respondidas | 8 de 8 | 7 de 8 |
| Intención correcta | 8 de 8 | 6 de 8 |
| Latencia mediana | 10.6 s | 6.6 s |

Se conserva Qwen3 4B: en banca pesa más que la evidencia sostenga la respuesta que ganar cuatro
segundos. Gemma 2B queda documentado como alternativa para equipos con menos memoria.

## Sin red

Wi-Fi desconectado y `1.1.1.1:443` inalcanzable, verificado antes de empezar.

| Capacidad | Resultado |
| --- | --- |
| Texto, 7 preguntas incluidas las de historial | Correctas, de 14 a 19 s cada una |
| Carga del modelo de texto desde caché | 36 s |
| Voz, dos frases dictadas en español | Transcritas correctamente, 1.4 s cada una |
| Carga de Whisper desde caché | 17 s |

Artefactos: `artifacts/qvac-check-offline.json` y `artifacts/voice-check-offline.json`, ambos con
`network.reachable: false` junto a las respuestas.

## Punta a punta desde un clon limpio

Ejecutado el 10 de septiembre de 2026 sobre un `git clone` recién hecho, para reproducir lo que
haría el jurado y no lo que funciona en la máquina donde se escribió el código.

| Paso | Resultado |
| --- | --- |
| `npm ci` | Sin vulnerabilidades |
| `npm run build` | TypeScript y Vite sin errores |
| `npm test` | 42 de 42 |
| `npm run demo` y recorrer las ocho pestañas | Todas renderizan, ninguna con error |
| Cargar el modelo desde la interfaz | Listo, «Modelo disponible» en pantalla |
| Dictado por la ruta HTTP real, con sesión y CSRF | Whisper listo y transcripción correcta en 2.4 s |
| El texto dictado enviado al asistente | Intención `category_history`, respuesta con 13 movimientos de respaldo |
| `npm run ui:check` con inferencia encendida y apagada | Pasa en ambos casos |

El recorrido de interfaz exigía antes que la inferencia estuviera apagada, así que fallaba justo
después de la secuencia que recomienda el README. Ahora acepta las dos formas de arrancar.

## Modelos descartados por el camino

- **Llama 3.2 1B**: cargaba, pero no producía explicaciones fiables.
- **Gemma4 2B**: más rápido, pero confundió una pregunta de resumen con una de comparación y
  perdió una respuesta por repetir una evidencia. Eso último se corrigió exigiendo evidencias
  únicas en la gramática, y queda como alternativa documentada, no como descarte definitivo.

## Lo que no se ha hecho

- El repositorio no está publicado, así que el acceso del jurado no está probado.
- El video no está grabado.
- Los Términos y Condiciones generales no se han leído.
- No hay integración bancaria: la autenticación es demostrativa y los datos son sintéticos.
