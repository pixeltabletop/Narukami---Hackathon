# Chen · tu pasiero financiero

Entrega del equipo **Narukami**.

Asistente bancario que explica el gasto y organiza el saldo, con IA **100 % local**. El dato del
cliente no sale del equipo.

Para el **Track 05 de Caja de Ahorros** (IA descentralizada para banca) del ISD Summit 2026.

**▶ Video de demostración (3:47)** — _enlace pendiente de publicar_

> **Aviso:** Chen · prototipo del equipo Narukami para el reto de Caja de Ahorros · Hackathon ISD
> Summit 2026 · **No es una aplicación oficial de Caja de Ahorros.** Todos los clientes, tarjetas
> y movimientos son **inventados**. El logotipo se usa solo para identificar el reto, sin aval del
> banco. Esto no es consejo financiero.

---

## Qué problema resuelve

Un cliente de banca abre su aplicación y ve una lista de movimientos. Lo que no ve es lo que de
verdad le preocupa: **en qué se le fue la plata, y si le alcanza hasta el próximo pago.**

Los tableros bancarios fallan en tres puntos concretos, y los tres están resueltos aquí:

1. **Cuentan como gasto lo que no lo es.** Un traspaso a la cuenta de ahorros, un retiro en cajero
   o el pago de la tarjeta salen de la cuenta, pero el dinero no se consumió: cambió de lugar o ya
   se había contado. Chen los separa en un bloque aparte, con su importe.
2. **No distinguen lo que sale de la cuenta de lo que se retiene de la planilla.** Un préstamo
   descontado por planilla no toca el saldo de hoy: reduce el próximo ingreso. Mezclarlos da un
   margen falso.
3. **Promedian el mes.** La pregunta «¿me alcanza?» se decide un día concreto. Chen proyecta día
   por día y dice **qué día** el saldo se queda corto y **cuánto** falta.

**El diferenciador:** cada cifra que el asistente afirma **se abre hasta los movimientos que la
sostienen**. El modelo no redacta libremente y no calcula: clasifica la pregunta y elige entre una
y tres evidencias ya calculadas. Si los datos no alcanzan, lo dice y no responde. Un modelo pequeño
falla en silencio y con buena letra; aquí el fallo es auditable en vez de invisible.

---

## Qué es

Ocho pantallas sobre los mismos movimientos sintéticos:

| Pantalla | Qué hace |
|---|---|
| **Resumen** | Gasto neto del período, comparación con el anterior, pendiente por contabilizar, mapa por categoría y el bloque «no es gasto». |
| **Movimientos** | Bandeja única con filtro por tarjeta de crédito, cuenta corriente y cuenta de ahorros. La categoría se corrige en el propio renglón y se queda corregida. |
| **Recurrentes** | Cargos que se repiten período a período, con el importe anterior al lado: ahí se ve el que subió de precio. |
| **Organiza** | Saldo, pendientes, compromisos confirmables, presupuesto variable, reserva y el margen hasta el próximo ingreso. Los descuentos de planilla van aparte. |
| **Proyección** | Día a día hasta el próximo cobro, con el veredicto, el punto más bajo y la autonomía sin cobrar. |
| **Escenarios** | Tres alternativas de ahorro con lo que quedaría disponible en cada una. |
| **Asistente** | Pregunta en español, escrita o dictada, con la evidencia abrible. Accesible desde cualquier pantalla. |
| **Guía** | Qué significa cada número y qué queda fuera de cada cálculo. |

### La fórmula del plan

```
margen = saldo − pendientes − compromisos confirmados − presupuesto variable − reserva
```

El próximo ingreso no se suma antes de recibirse. Las compras de tarjeta alimentan el análisis de
consumo; la cuenta solo registra el pago de tarjeta, así el mismo dinero no se cuenta dos veces.
La sugerencia de ahorro toma la mitad de la capacidad histórica y nunca supera el margen.

### Arquitectura

React + TypeScript → API Express en `127.0.0.1` → SQLite con fixtures sintéticos → motores
deterministas → hechos con su evidencia. Sobre esos hechos, QVAC clasifica la pregunta y elige qué
citar.

El contrato con el modelo está en `docs/ARQUITECTURA.md`. Su salida permitida contiene únicamente
una intención tipada y entre una y tres referencias de evidencia. **No redacta, no calcula, no
ejecuta consultas y no mueve dinero.**

---

## Cómo se leen los movimientos

Las cuatro reglas de dominio que hacen que las cuentas cuadren:

- **Gasto contra traslado.** Las veinte categorías declaran si el dinero se consumió o solo cambió
  de lugar. Traslados entre cuentas propias y retiros salen del saldo sin consumirlo: Chen los
  muestra aparte, con su importe, y no los suma al consumo del período.
- **Productos separados.** Las compras de tarjeta alimentan el análisis de consumo; la cuenta
  alimenta el flujo de efectivo. El pago de tarjeta aparece en la cuenta y no vuelve a contarse.
- **Pasivos y compromisos.** Se distinguen por naturaleza y por forma de pago. Un descuento directo
  de planilla no reduce el saldo de hoy: reduce el próximo ingreso, y así se muestra.
- **Pendiente.** Una compra autorizada que el comercio todavía no cobró en firme. Se resta del
  saldo disponible, pero no entra al gasto del período porque su importe final puede cambiar.

---

## Inferencia: qué es local y qué no

**Toda la inferencia corre en la máquina que sirve la aplicación**, con el SDK de QVAC de Tether.
Verificable en el código: los únicos puntos de entrada de inferencia del repositorio son
`server/qvac.ts` (texto) y `server/voice.ts` (voz), y una prueba falla si aparece otro. No hay
ninguna otra librería de inferencia en las dependencias y **no existe respaldo en la nube**: sin
modelo local, Chen lo dice y no responde.

El dictado se transcribe con Whisper en el mismo equipo, **no** con la API de voz del navegador,
que enviaría el audio del cliente al servidor de un tercero.

**Matiz honesto sobre los modelos:** los pesos (unos 2,6 GB entre los dos) los provisiona el SDK.
En una máquina nueva, la **primera** puesta en marcha los descarga por HTTP. Una vez en disco, ni
el arranque ni el uso vuelven a tocar la red.

Esto se comprueba en tres capas, porque ninguna sola alcanza:

| Qué se comprueba | Cómo | Alcance real |
|---|---|---|
| Que el código no puede pedir nada fuera | `npm test` → `tests/no-cloud.test.ts`, sobre `server/`, `src/` y `scripts/` | Falla si aparece una URL externa, si la inferencia entra por algo que no sea QVAC, o si se agrega otro motor de IA a las dependencias. Una sola excepción, con nombre y dirección exacta en la propia prueba: la sonda de conectividad. |
| Que responde de verdad sin red | `npm run qvac:check` con el Wi-Fi desconectado | El modelo carga desde caché y contesta. El artefacto guarda `network.reachable: false` junto a las respuestas. |
| Que no hubo salida **mientras el modelo pensaba** | `scripts/network-probe.ts`, dentro de los dos comandos anteriores | Doce intentos por corrida: **tres momentos** (antes de cargar, **durante la inferencia**, al terminar) por **cuatro destinos** que fallan por razones distintas (dos TCP directos a IP sin DNS, una petición HTTPS completa, una consulta DNS pura). |

La tercera capa existe porque las otras dos no la cubren. Un solo intento contra un solo host,
hecho cuando la inferencia ya terminó, prueba que ese host no contestó en ese instante por ese
camino, y nada más. La toma del medio corre **en paralelo** con la primera inferencia, que es
exactamente lo que el reto pregunta.

### Dónde correría en un banco de verdad

La pregunta que decide este reto no es qué modelo se usa, sino en qué máquina piensa.

| Dónde piensa | Quién lo hospeda | A favor | En contra |
|---|---|---|---|
| **Servidor del banco** | El banco, en su infraestructura | La banca en línea sigue siendo web; el dato nunca sale del perímetro; un solo lugar que actualizar | El banco paga el cómputo y dimensiona concurrencia |
| **Teléfono del cliente** | Nadie: la app lleva el modelo | El dato no sale ni del teléfono; costo cero para el banco | Exige app nativa; en un teléfono medio lo realista es un 2B, no un 4B |
| **Delegación entre pares** | Repartido, con Pears | Es lo que el reto valora explícitamente | Un banco no manda movimientos de un cliente a equipos de terceros |

Las bases permiten la nube para hospedar interfaz y autenticar, no para inferir: eso encaja con el
primer camino. El segundo es la evolución natural y el SDK ya lo contempla con su plugin de Expo
para React Native. Este prototipo es web porque un jurado necesita abrirlo sin instalar nada.

Lo que no cambia en ningún camino: el modelo solo clasifica y escoge evidencia, y los importes
salen de motores deterministas. Ese contrato hace que mover la inferencia de un servidor a un
teléfono sea una decisión de despliegue y no una reescritura.

---

## Hardware donde se midió

HP ProBook 450 G10 · Windows 11 · 16 GB. Todas las cifras de este README salen de esa máquina.

---

## Modelos, cuantizaciones y configuración exacta

| Uso | Modelo | Configuración medida |
|---|---|---|
| Clasificar la pregunta | `QWEN3_4B_INST_Q4_K_M` (2,5 GB) | `ctx_size: 4096`, `temp: 0`, esquema JSON con el enum de intenciones recortado por pregunta, un reintento con otra semilla |
| Voz a texto | `WHISPER_BASE_Q8_0` (78 MB) | `language: 'es'`, `translate: false`, `no_timestamps: true`, `initial_prompt` con el catálogo de rubros y comercios del cliente |

El modelo de texto se cambia con `CHEN_QVAC_MODEL`. Alternativa medida:
`GEMMA4_2B_MULTIMODAL_Q4_K_M`, más rápida y menos fiable (ver «Resultados medidos»).

Tres detalles del SDK que cuestan horas si no se conocen, y que ya están resueltos en el adaptador:

- El worker de QVAC tarda más de treinta segundos en arrancar en Windows en frío. Sin subir
  `QVAC_RPC_INIT_TIMEOUT_MS`, el SDK aborta con un timeout que parece un fallo de instalación.
- El contexto por defecto es de 1024 tokens y el bloque de hechos lo desborda.
- Cuando el worker muere, el mensaje del SDK habla de RPC. La causa real viaja en
  `cause.stderrTail`.

---

## Qué equipo hace falta

| Qué | Mínimo para ejecutarlo |
|---|---|
| Sistema | Windows 11 verificado. Linux y macOS deberían funcionar, pero no se han probado. |
| Node | **24 o superior**, con npm. Está declarado en `engines` del `package.json`; npm lo advierte pero no lo bloquea, así que conviene comprobarlo con `node --version`. |
| Memoria | **16 GB**, con al menos 4 GB libres al cargar el modelo. Con menos, `npm run fit:check` lo dice antes de descargar nada. |
| Disco | **8 GB**: unos 5 GB de `node_modules` (motores nativos del SDK, no pesos) y 2,6 GB de modelos en `%USERPROFILE%\.qvac`. |
| Red | Solo para `npm ci` y para la **primera** descarga de modelos. Después funciona desconectado. |
| Navegador | Cualquiera moderno. El dictado necesita permiso de micrófono. |

**Qué se instala y qué no.** Se instalan las dependencias de npm y, al encender la inferencia, los
dos modelos del catálogo de QVAC. **El repositorio no incluye pesos de modelos** y no hay nada que
instalar en el sistema: ni servicio, ni base de datos externa, ni clave de API. El SQLite de la
demostración se crea solo, en `data/`, la primera vez que se levanta.

## Instalación

En Windows conviene trabajar en un disco local, fuera de carpetas sincronizadas.

```bash
npm ci
npm run build
npm test
npm run demo
```

Abrir **http://127.0.0.1:4173** y elegir un cliente ficticio. En Windows también sirve hacer doble
clic en `Iniciar-Chen.cmd`.

`npm run demo` enciende la inferencia local. **`npm run dev` levanta la misma aplicación sin IA**,
que es el modo por defecto a propósito: encender QVAC descarga unos 2,5 GB la primera vez y eso no
se hace sin que la persona lo decida. Si el asistente aparece apagado, estás en ese modo y la
pantalla te dice el comando.

La instalación pesa unos 5 GB, casi todos del SDK de QVAC: son sus motores nativos, **no** pesos de
modelos. `node_modules` nunca se copia entre máquinas: se instala con `npm ci`.

Si el puerto 4173 está ocupado, el arranque lo dice y se detiene. No sigue en silencio dejándote
frente a otro servidor, que podría ser el que corre sin inferencia.

Con npm 11 puede aparecer un aviso de que el script de instalación de `esbuild` quedó bloqueado. Es
benigno y está comprobado: sin ese script, `npm run build` compila igual y las pruebas pasan. Si en
algún equipo el build fallara por eso, `npm approve-scripts` lo resuelve.

**Sin internet.** El SDK guarda los pesos en `%USERPROFILE%\.qvac` (`~/.qvac` fuera de Windows),
dentro de `models/` y con el índice en `registry-corestore/`. Para una máquina sin red se copia esa
carpeta desde otra donde la aplicación ya haya arrancado una vez. Hacen falta dos archivos: el de
Qwen3 4B y el de Whisper Base. Con la carpeta en su sitio, la aplicación arranca sin tocar la red.

---

## Cómo reproducir la verificación

```bash
npm test                   # la batería completa, sin modelos y sin abrir la app
npm run build              # tipos y compilación
npm run fit:check          # ¿cabe el modelo en este equipo? sin descargar un solo byte
npm run qvac:check         # nueve preguntas reales contra el modelo, con medición de red
npm run voice:check -- ./audio/consulta.wav ./audio/ahorro.wav
npm run ui:check           # el recorrido de interfaz, con el servidor levantado
```

`npm test` y `npm run build` corren en cualquier máquina y no necesitan ni la aplicación ni los
modelos: es lo mismo que corre CI en cada push, en Windows, que es la plataforma verificada.

`qvac:check` y `voice:check` necesitan la inferencia encendida:

```powershell
$env:CHEN_ENABLE_QVAC="1"
npm run qvac:check
```

`ui:check` necesita el servidor levantado en otra terminal (`npm run demo` o `npm run dev`).

**`qvac:check` falla si el modelo devuelve una intención equivocada.** Cada pregunta declara qué
intenciones serían correctas, escritas por lo que la pregunta significa y no por lo que el modelo
contestó la última vez. Escribirlo al revés convertiría la verificación en un espejo del
comportamiento actual: pasaría siempre y no detectaría nada.

### Todos los comandos

| Comando | Qué hace | Escribe archivos |
|---|---|---|
| `npm run dev` | La aplicación **sin** inferencia, en `127.0.0.1:4173` | no |
| `npm run demo` | La misma aplicación **con** inferencia local | `data/*.sqlite` |
| `npm run build` | Tipos y compilación de la interfaz | `dist/` |
| `npm test` | La batería completa, incluida la que prohíbe salir a la red | no |
| `npm run fit:check` | Si cada modelo candidato cabe en la memoria de este equipo | `artifacts/fit-check.json` |
| `npm run qvac:check` | Nueve preguntas reales contra el modelo, con intención esperada y sonda de red | `artifacts/qvac-check.json` |
| `npm run voice:check -- <wav...>` | El dictado local, con sonda de red | `artifacts/voice-check.json` |
| `npm run ui:check` | El recorrido de interfaz en escritorio y móvil, incluido el desbordamiento a 360 y 390 px | `artifacts/*.png`, `artifacts/ui-check.json` |
| `npm run preguntas` | Una batería más amplia de preguntas contra el modelo | `artifacts/bateria-preguntas.json` |

Las salidas no viajan en el repositorio: se regeneran corriendo los comandos.

---

## Resultados medidos

| Qué | Resultado |
|---|---|
| Batería de pruebas | 76 de 76 |
| Recorrido de interfaz, escritorio y móvil | 10 recorridos seguidos en verde, incluido el desbordamiento a 360 y 390 px en las ocho pestañas |
| Preguntas con la intención esperada | 9 de 9 |
| Dictado en español | 2 de 2 |
| Corrida sin red: intentos de salida que alcanzaron algo | 0 de 12 |
| Clon limpio desde GitHub: instalar, compilar y probar | sin vulnerabilidades, build y pruebas en verde |

### Comparativo de modelos

Ocho preguntas bancarias, la misma máquina, el mismo corpus sintético:

| | QWEN3 4B Q4_K_M | GEMMA4 2B Q4_K_M |
|---|---|---|
| Carga desde caché | 58,5 s | 36,6 s |
| Preguntas respondidas | 8 de 8 | 7 de 8 |
| Intención correcta | 8 de 8 | 6 de 8 |
| Evidencia correcta | 8 de 8 | 7 de 8 |
| Latencia mediana | 10,6 s | 6,6 s |
| Latencia máxima | 22,1 s | 7,4 s |

Queda Qwen3 4B por defecto: en banca importa más que la evidencia sostenga la respuesta que ganar
cuatro segundos. Gemma 2B queda documentado como alternativa para equipos con menos memoria, con la
advertencia de que confundió una pregunta de resumen con una de comparación y repitió una evidencia.

---

## Tiempos reales, arranque en frío

| Proceso | Medido |
|---|---|
| Carga del modelo de texto desde caché | 43 a 58 s |
| Carga de Whisper | ~17 s, la primera vez |
| Responder una pregunta | 15 a 22 s |
| Transcribir una frase dictada | 1,3 a 1,5 s |
| Guardar un plan o corregir una categoría | menos de 0,2 s |

Con el equipo bajo presión de memoria una respuesta llegó a 42 s. Para grabar o demostrar conviene
tener el modelo ya cargado y memoria libre.

---

## Limitaciones conocidas

- **El modelo se equivoca de intención si se le deja el menú abierto.** Está resuelto recortando el
  enum del esquema por pregunta, no insistiendo en el prompt: una instrucción se puede ignorar, una
  gramática no. Con el menú recortado acierta 9 de 9; la lógica que lo arma (`allowedIntentsFor`) es
  una función pura con siete pruebas deterministas.
- **Dos palabras cambian la clasificación.** «¿En qué se me fue el dinero?» se clasifica mal con el
  plan en su estado de partida; «¿En qué se me fue el dinero **este mes**?» acierta. Cuando falla,
  la aplicación muestra la negativa honesta en lugar de inventar. El video usa la forma larga.
- **Responder tarda de 15 a 22 segundos** en este equipo, y hasta 42 bajo presión de memoria. Es el
  costo de pensar en local y está a la vista en la interfaz, con el tiempo de cada respuesta.
- **Las preguntas de proyección no traen evidencia abrible**, porque su respuesta la produce el
  motor de proyección y no una selección de movimientos.
- **El acceso no valida credenciales**, y la pantalla lo dice con esas palabras. Es una demostración.
- **No es una integración bancaria.** Una de verdad exige identidad, TLS, autorización, retención y
  auditoría del banco.

---

## Trabajo futuro

Aplicación móvil con Expo, para que el modelo viva en el teléfono del cliente; delegación entre
pares con Pears para los equipos que no puedan cargar el modelo; y alertas por adelantado cuando la
proyección vea el saldo corto antes de que ocurra.

---

## Cumplimiento del reto

| Requisito | Cómo se cumple |
|---|---|
| Construir con el SDK de QVAC | `@qvac/sdk` 0.19.0 es dependencia declarada. Texto en `server/qvac.ts`, voz en `server/voice.ts`. Son los dos únicos puntos de entrada y una prueba lo verifica. |
| Inferencia en el dispositivo; la nube descalifica | Todo corre en la máquina que sirve la aplicación. Sin respaldo remoto: sin modelo local, Chen lo dice y no responde. Comprobado con el equipo desconectado. |
| Datos del cliente no salen del dispositivo | El servidor escucha solo en `127.0.0.1`. El dictado se transcribe con Whisper en el mismo equipo. |
| Solo datos sintéticos o públicos | Dos clientes ficticios generados en `server/fixtures.ts` y `server/planning-fixtures.ts`. Ninguna entidad ni credencial real. |
| Declarar toda base preexistente | Sección «Declaración de origen del trabajo», al final de este README, y `LICENSE`. El commit `57af18a` conserva esa base sin modificar. |
| Repositorio accesible al jurado | https://github.com/pixeltabletop/Narukami---Hackathon, público y clonable sin credenciales. |
| Video de máximo cinco minutos, sin credenciales | 3:47. Enlace en la cabecera de este README. |
| La propiedad intelectual permanece en el equipo | `LICENSE`: derechos reservados, con permiso de evaluación para la organización y el jurado. |

---

## Declaración de origen del trabajo

**Declaración obligatoria del reto.** Omitirla descalifica.

**Hay una base preexistente y está declarada.** Diego Laverde escribió **Rastro** y la entregó al
equipo el 9 de septiembre de 2026. Se importó **sin modificar** en el commit `57af18a`, que figura
a su nombre. Ese commit es una instantánea, no el historial previo de Rastro: comparar cualquier
commit posterior contra él muestra sin ambigüedad qué es base y qué se construyó encima. El
producto se renombró a **Chen** ese mismo día.

| | Qué |
|---|---|
| **Lo que traía la base** | El análisis de consumo de tarjeta, React con Vite, Express, SQLite, los fixtures sintéticos, las primeras pruebas y un adaptador de QVAC que nunca se había ejecutado contra un modelo. |
| **Lo que se construyó encima** | El dominio de cuenta con productos separados; planificación, escenarios y proyección día a día; las veinte categorías con la distinción entre gasto y traslado; el historial por rubro y por comercio; el asistente conversacional y su guía; el dictado local con Whisper; el contrato de intención tipada con redacción determinista, su guardián de coherencia y la gramática que impide inventar entidades; el veredicto de memoria antes de descargar; y toda la verificación, incluida la corrida sin red. |

El resto se construyó **durante el hackatón**. El `git log` lo refleja commit por commit.

### Lo que no escribimos nosotros, y va declarado

| Qué | De dónde | Cómo se usa |
|---|---|---|
| **SDK de QVAC** (`@qvac/sdk` 0.19.0) | Tether, Apache-2.0 | Toda la inferencia. Es la pieza que el reto pide usar. |
| **Modelos** `QWEN3_4B_INST_Q4_K_M` y `WHISPER_BASE_Q8_0` | Catálogo de QVAC, Apache-2.0 | Se descargan del catálogo. No están entrenados ni ajustados por nosotros. |
| **React, Vite, Express, express-session, Zod, tsx** | Sus proyectos, MIT | Interfaz, servidor, validación y herramientas. Fijados en `package-lock.json`. |
| **TypeScript** | Microsoft, Apache-2.0 | Tipos y compilación. |
| **Playwright** | Microsoft, Apache-2.0 | Solo para el recorrido de verificación de interfaz. No viaja en producción. |
| **Logotipo y video de marca de Caja de Ahorros** | Carpeta oficial del hackatón | Solo para identificar el reto. Ver «Identidad visual». |
| **Asistencia de IA** (Claude Code, Codex) | Anthropic, OpenAI | Asistente de programación durante todo el reto, con revisión humana de cada cambio. |

No se usó plantilla de interfaz, tema comprado ni librería de componentes: las tarjetas, las
barras y los iconos se dibujan a mano.

---

## Licencias

Código propio con derechos reservados y permiso de evaluación para la organización y el jurado, en
[`LICENSE`](LICENSE). El SDK y los modelos del catálogo de QVAC, bajo Apache-2.0. React, Vite,
Express y Zod, bajo MIT. TypeScript y Playwright, bajo Apache-2.0.

**Música del video.** «Inspired», de Kevin MacLeod (incompetech.com), bajo Creative Commons
Atribución 4.0. Su licencia pide este crédito, que aparece también en el último plano del video. No
forma parte de la aplicación: solo suena en el video de demostración.

### Identidad visual

El logotipo y el video de marca provienen de la carpeta oficial del hackatón, no de una descarga
pública ni de una reproducción del equipo:

| Archivo entregado | Formato real | Qué se hizo |
|---|---|---|
| `caja_de_ahorros_logo.png` | WebP 696×698 con alfa, con extensión `.png` | Convertido a PNG real en `public/brand/logo-ca.png`, más escalas de 512, 192, 64 y 32 px y `public/favicon.ico` |
| `Caja_de_Ahorros_transparente_solo_logo_30s.webm` | VP9 1080×1080 con canal alfa | Compuesto sobre el mismo `#0b1c30` que la hoja de estilo pone detrás, y transcodificado a H.264 720×720 en `public/brand/ca-loop.mp4` (360 KB), con su cuadro de espera |

El color institucional `#1858A0` se tomó del propio logotipo y define la barra lateral, los acentos
y `theme-color`. El video se reproduce mientras el modelo local carga. No se presupone aval de Caja
de Ahorros ni titularidad sobre su marca.

---

## Dónde está todo

| Qué | Dónde |
|---|---|
| Cómo está armado y el contrato con el modelo | [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) |
| Alcance de la licencia y propiedad intelectual | [`LICENSE`](LICENSE) |
| Audio de prueba para el dictado | [`audio/`](audio/) |
| Verificación que corre en cada push | [`.github/workflows/check.yml`](.github/workflows/check.yml) |
| Variables de entorno | [`.env.example`](.env.example) |

---

## El nombre

**Chen** viene de *chen chen*, la plata en panameño. El lema es **«Chen, tu pasiero financiero»**:
un pasiero es con quien uno anda, el que te acompaña. Bajo el logotipo se conserva *tu chen chen,
claro*, que explica de dónde sale el nombre.
