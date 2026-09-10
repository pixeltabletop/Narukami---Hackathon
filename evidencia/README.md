# Evidencia de las corridas

Estos archivos son la salida real de los comandos de verificación en la máquina donde se
construyó Chen. Están aquí, dentro del repositorio, para que el jurado pueda contrastar lo que
afirma `docs/VALIDACION.md` sin tener que ejecutar nada. Las rutas locales de los archivos de
audio se recortaron a su nombre; el resto del contenido es el que escribió cada comando.

Los mismos archivos se regeneran en `artifacts/`, que no se versiona, cada vez que se corre el
comando correspondiente.

| Archivo | Comando que lo produce | Qué demuestra |
| --- | --- | --- |
| `qvac-check.json` | `npm run qvac:check` | Siete preguntas contra el modelo local, con la intención, la evidencia elegida y la latencia de cada una. |
| `qvac-check-offline.json` | `npm run qvac:check` sin red | La misma corrida con el Wi-Fi desconectado. Lleva `network.reachable: false` junto a las respuestas. |
| `voice-check.json` | `npm run voice:check` | Transcripción local con Whisper dentro de QVAC: modelo, tiempo de carga y texto obtenido. |
| `voice-check-offline.json` | `npm run voice:check` sin red | La misma prueba de dictado sin conexión. Este archivo no lleva campo de red: su condición sin conexión consta en el log de la corrida. |
| `model-bench.json` | `npm run model:bench` | Comparativo de los dos modelos candidatos sobre ocho preguntas. |
| `fit-check.json` | `npm run fit:check` | Veredicto de memoria antes de descargar pesos, con el rango estimado y los supuestos del SDK. |
| `desktop.png`, `mobile.png` | `npm run ui:check` | La aplicación en escritorio y en móvil. |
| `organiza-desktop.png`, `organiza-mobile.png` | `npm run ui:check` | La pantalla de margen y compromisos. |
| `escenarios-desktop.png` | `npm run ui:check` | Los tres escenarios de ahorro. |
| `proyeccion-desktop.png`, `proyeccion-rojo.png` | `npm run ui:check` | La proyección día a día, en su estado normal y cuando el saldo no alcanza. |
| `fit-panel.png` | Captura del panel de carga | El veredicto de memoria tal como lo ve el cliente. |

Las capturas son de corridas del 9 y 10 de septiembre de 2026. Los importes que aparecen
corresponden a los clientes sintéticos Ana Martínez y Luis Rodríguez, que no existen.
