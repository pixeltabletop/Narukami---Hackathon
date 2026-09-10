# Validación

Corte: 10 de septiembre de 2026. Todo lo que sigue fue ejecutado en la máquina de desarrollo,
no estimado. Los artefactos citados se generan con los comandos indicados.

## Dónde está la evidencia

Cada afirmación de este documento tiene detrás la salida de un comando. Esas salidas viajan en
el repositorio, en `evidencia/`, con un índice que dice qué comando produjo cada archivo y qué
demuestra. La carpeta `artifacts/` es donde los comandos las regeneran y no se versiona.

## Determinista, sin modelos

| Qué | Resultado |
| --- | --- |
| `npm test` | 71 de 71 |
| `npm run build` | TypeScript y Vite sin errores |
| `npm run ui:check` | Recorrido en Edge, escritorio y móvil |

Cubierto por las pruebas: importes en centavos enteros, deduplicación, períodos equivalentes y
ausencia de historial, traslados que no suman al gasto, descuentos de planilla que no reducen el
saldo, proyección día a día que cuadra con sus propios eventos, historial por rubro y por
comercio, coherencia entre la etiqueta del modelo y su evidencia, aislamiento entre clientes,
sesiones y CSRF, la cerca contra inferencia en nube, y el veredicto de memoria, que no puede
afirmar que un modelo entra cuando el SDK no lo sostiene.

## Veredicto de memoria, contra el SDK real

`npm run fit:check` corrió en este equipo en cinco segundos, sin descargar pesos. Devolvió las dos
respuestas posibles según la memoria libre del momento, que es justo lo que se quería comprobar:
con 4,5 GB libres el SDK no se comprometió y dio «sin veredicto» con el rango estimado a la vista;
con 331 MB libres dijo que ninguno de los dos candidatos entra. La misma respuesta llegó por la
ruta HTTP real, con sesión y CSRF, y se ve en la aplicación junto al botón de carga. Evidencia en
`evidencia/fit-check.json` y `evidencia/fit-panel.png`.

El recorrido de interfaz no depende del estado guardado: fija los valores del plan antes de
medir, y elige un destino de categoría distinto del actual antes de guardarlo.

## Inferencia local con QVAC

`npm run qvac:check` carga el modelo, corre nueve preguntas reales y escribe
`artifacts/qvac-check.json`. Última corrida, del 10 de septiembre de 2026: **9 de 9 con la
intención esperada**, incluidas las dos que miran hacia adelante. El modelo cargó desde caché en
51 segundos y cada respuesta tardó entre 17 y 27 segundos.

Las dos nuevas son las que antes devolvían una negativa:

| Pregunta | Intención | Lo que contestó |
| --- | --- | --- |
| ¿Me alcanza hasta el próximo pago? | `payday_forecast` | Que sí, con el saldo con que llega al 15, y que sin ningún cobro nuevo aguanta 6 días |
| ¿Cuánto me queda disponible después de mis compromisos? | `available_margin` | El margen y la resta completa, con el descuento de planilla explicado aparte |

El comando comprueba, sin intervención humana: que la intención devuelta sea una de las que la
pregunta admite, que la evidencia elegida corresponda a lo preguntado, que la respuesta hable del
rubro o del comercio consultado, y que no devuelva otra pregunta. Falla si algo de eso no se
cumple.

Las intenciones esperadas están escritas por lo que la pregunta significa, no por lo que el
modelo contestó la última vez. La diferencia no es cosmética: escribirlas al revés convertiría la
verificación en un espejo del comportamiento actual, pasaría siempre y no detectaría nada.

**Lo que apareció al exigirlo.** A «¿en qué se me fue el dinero?» el modelo respondía con la
intención de comparación, que explica por qué el gasto subió o bajó contra el mes anterior. La
pregunta no compara nada. Pasó desapercibido en tres corridas porque la verificación anterior
solo miraba la evidencia, y la comparación también selecciona categorías. Corregido sacando esa
intención del enum cuando la pregunta no trae ninguna marca de comparación, con su propia prueba
determinista en la suite.

**Y una expectativa que estaba mal calibrada.** La prueba exigía para esa misma pregunta la
evidencia que elige la comparación. Estaba escrita contra el defecto, no contra la respuesta
correcta. Ahora acepta las dos evidencias que una respuesta correcta puede traer: el total, si
contesta el gasto global, o una categoría, si contesta en qué pesa más.

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

### Cómo se mide que no hay red

Un solo intento contra un solo host, hecho cuando la inferencia ya terminó, prueba poco: prueba
que ese host no contestó, en ese instante, por ese camino. La medición actual toma tres momentos
y cuatro destinos.

| Momento | Por qué está |
| --- | --- |
| Antes de cargar el modelo | Si ya hay red aquí, la corrida no vale como prueba sin conexión. |
| Mientras el modelo responde la primera pregunta | Es la única toma que dice algo sobre el instante que importa. Corre en paralelo con la inferencia. |
| Al terminar todas las respuestas | Descarta que la red volviera a mitad de camino. |

| Destino | Capa | Qué descarta |
| --- | --- | --- |
| `1.1.1.1:443` | TCP directo | Salida a internet sin pasar por DNS. |
| `8.8.8.8:443` | TCP directo | Lo mismo por otra red de destino. |
| `cloudflare.com/cdn-cgi/trace` | HTTPS completo | DNS, TLS y HTTP funcionando de punta a punta. |
| Resolución de `example.com` | DNS del sistema | El camino que usaría cualquier aplicación. |

Son doce intentos por corrida y el artefacto guarda cada uno con su resultado y su tiempo. Las
dos pruebas, la de texto y la de voz, usan la misma medición y la escriben en su artefacto.

**Estado de esta medición.** El instrumento está en las dos pruebas, la de texto y la de voz, y
quedó comprobado con red disponible el 10 de septiembre: `voice:check` registró las tres tomas
contra los cuatro destinos dentro de su artefacto, cargó Whisper en 18 segundos y transcribió las
dos frases correctamente. **Los artefactos sin red archivados siguen siendo los del 9 de
septiembre**, hechos con el instrumento anterior de un solo sondeo, y el de voz no llevaba campo
de red. Rehacer la corrida sin red con este instrumento es lo único que falta para que la tabla
de arriba y los archivos digan lo mismo.

**Un sondeo que no podía pasar nunca.** La primera versión resolvía el nombre consultando
directamente a los servidores DNS configurados. En esta máquina esos servidores son `127.0.0.1`,
un proxy local que rechaza la consulta, así que ese destino fallaba con red y sin red. Una prueba
que no puede pasar regala un «sin salida» y ensucia justo la medición que sostiene la afirmación
central del reto. Ahora resuelve por el resolutor del sistema.

## Punta a punta desde un clon limpio

Ejecutado el 10 de septiembre de 2026 sobre un `git clone` recién hecho, para reproducir lo que
haría el jurado y no lo que funciona en la máquina donde se escribió el código.

| Paso | Resultado |
| --- | --- |
| `npm ci` | Sin vulnerabilidades |
| `npm run build` | TypeScript y Vite sin errores |
| `npm test` | 71 de 71 |
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
