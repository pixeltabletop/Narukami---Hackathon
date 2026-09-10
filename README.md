# Chen — tu chen chen, claro

_Asistente local de Caja de Ahorros para entender y organizar el dinero._

Prototipo para el Track 05 de Caja de Ahorros. Chen une dos recorridos: explica el consumo de tarjeta con evidencia y ayuda a organizar el saldo disponible hasta el próximo ingreso. Los cálculos se realizan en el servidor local y QVAC se usa exclusivamente en el dispositivo para clasificar las preguntas del cliente.

**La inferencia está desactivada por defecto y el repositorio no incluye pesos de modelos.** Toda la demostración usa clientes y movimientos sintéticos.

## Ejecutar

Requiere Node 24 y npm. En Windows conviene trabajar en un disco local, fuera de carpetas sincronizadas.

```powershell
npm ci
npm run build
npm test
npm run demo
```

Abrir `http://127.0.0.1:4173` y seleccionar un cliente ficticio.

`npm run demo` enciende la inferencia local. `npm run dev` levanta la misma aplicación **sin
IA**, que es el modo por defecto a propósito: encender QVAC descarga 2.33 GB del modelo la
primera vez y eso no se hace sin que la persona lo decida. Si abres la aplicación y el asistente
aparece apagado, estás en ese modo y la pantalla te dice el comando.

Con el servidor activo, `npm run ui:check` recorre la experiencia en Edge para escritorio y móvil.

## Qué funciona

- **Entiende:** gasto neto, comparación de períodos, categorías, movimientos y posibles cargos recurrentes.
- **Organiza:** saldo explícito, pendientes, compromisos confirmables, presupuesto variable, reserva y margen hasta el próximo ingreso.
- **Escenarios:** alternativas conservadora, sugerida y ambiciosa, con el dinero que quedaría en cada caso.
- Correcciones de categoría y planes persistentes por cliente en SQLite.
- Dos clientes ficticios, sesiones separadas, CSRF y aislamiento de registros.
- Diseño adaptable, estados visibles y acceso desde cada resultado a su evidencia.

## Fórmula del plan

`margen = saldo − pendientes − compromisos confirmados − presupuesto variable − reserva`

El próximo ingreso no se suma antes de recibirse. Las compras de tarjeta pertenecen al análisis de consumo; el flujo de cuenta solo registra el pago de tarjeta, evitando contar el mismo dinero dos veces. La sugerencia de ahorro toma la mitad de la capacidad histórica y nunca supera el margen disponible.

## Arquitectura

React + TypeScript → API Express local → SQLite + fixtures sintéticos → motores deterministas.

QVAC recibe la pregunta y hechos ya calculados. Su salida permitida contiene únicamente una intención tipada y entre una y tres referencias de evidencia. La aplicación redacta la respuesta desde esos hechos; el modelo no redacta libremente, no calcula importes, no ejecuta SQL y no mueve dinero. No existe fallback de inferencia en nube.

## QVAC verificado localmente

El adaptador usa QVAC SDK 0.19.0. El modelo por defecto es `QWEN3_4B_INST_Q4_K_M` y se puede
cambiar con `CHEN_QVAC_MODEL`. Para habilitar la inferencia:

```powershell
$env:CHEN_ENABLE_QVAC="1"
npm run qvac:check
npm run dev
```

`npm run qvac:check` carga el modelo, corre cuatro preguntas reales (resumen, comparación,
recurrencias y traslados) y escribe `artifacts/qvac-check.json` con el modelo, el tiempo de
carga, la latencia de cada respuesta y si la máquina tenía salida a internet durante la prueba.
Con veinte categorías el bloque de hechos es más largo y la respuesta tarda entre 11 y 26
segundos, contra 9 a 14 del catálogo corto: más lenguaje cuesta tiempo, y para grabar conviene
tener el modelo ya cargado y memoria libre. `npm run model:bench` compara los dos
modelos candidatos sobre el mismo corpus y escribe `artifacts/model-bench.json`.

Tres detalles que cuestan horas si no se conocen, y que ya están resueltos en el adaptador:

- El worker de QVAC tarda más de treinta segundos en arrancar en Windows en frío. Sin subir
  `QVAC_RPC_INIT_TIMEOUT_MS` el SDK aborta con un timeout que parece un fallo de instalación.
- El contexto por defecto es de 1024 tokens y el bloque de hechos lo desborda.
- Cuando el worker muere, el mensaje del SDK habla de RPC. La causa real viaja en
  `cause.stderrTail`.

Una intención que no cuadra con la evidencia elegida se rechaza antes de redactar y se
reintenta una vez con otra semilla. Si vuelve a fallar, la aplicación lo dice y no responde.

### Prueba sin red, 9 de septiembre de 2026

Con el Wi-Fi desconectado y `1.1.1.1:443` inalcanzable, el modelo cargó desde caché en 16.9 s y
respondió las tres preguntas con la intención y la evidencia correctas, entre 9.0 y 10.6 s cada
una. El artefacto `artifacts/qvac-check-offline.json` deja registrado `network.reachable: false`
junto a las respuestas. No hay respaldo en la nube que pudiera haber contestado por el modelo.

### Comparativo de modelos, 9 de septiembre de 2026

Ocho preguntas bancarias, la misma máquina, el mismo corpus sintético:

| | QWEN3 4B Q4_K_M | GEMMA4 2B Q4_K_M |
| --- | --- | --- |
| Carga desde caché | 58.5 s | 36.6 s |
| Preguntas respondidas | 8 de 8 | 7 de 8 |
| Intención correcta | 8 de 8 | 6 de 8 |
| Evidencia correcta | 8 de 8 | 7 de 8 |
| Latencia mediana | 10.6 s | 6.6 s |
| Latencia máxima | 22.1 s | 7.4 s |

Queda Qwen3 4B como modelo por defecto: en banca importa más que la evidencia sostenga la
respuesta que ganar cuatro segundos. Gemma 2B queda documentado como alternativa para equipos
con menos memoria, con la advertencia de que confundió una pregunta de resumen con una de
comparación y repitió una evidencia.

## Dónde corre el modelo y dónde está el cliente

La pregunta que decide este reto no es qué modelo se usa, sino en qué máquina piensa. QVAC
corre en el dispositivo. Chen no tiene ni puede tener un respaldo en la nube: si el modelo no
está cargado, la aplicación lo dice y no responde.

**En la demostración.** El portátil es a la vez el dispositivo y el servidor. Express escucha en
`127.0.0.1`, sirve la interfaz y carga QVAC dentro de su propio proceso. No hay nada hospedado
afuera, y por eso la prueba con el Wi-Fi apagado funciona. Para grabar el video basta con el
equipo: no hay que desplegar nada ni conectarse a ningún servicio.

**En un banco de verdad, tres caminos y lo que cuesta cada uno.**

| Dónde piensa | Quién lo hospeda | A favor | En contra |
| --- | --- | --- | --- |
| Servidor del banco | El banco, en su propia infraestructura | La banca en línea sigue siendo web; el dato nunca sale del perímetro del banco; un solo lugar que actualizar | El banco paga el cómputo; hay que dimensionar concurrencia |
| Teléfono del cliente | Nadie: la app lleva el modelo | El dato no sale ni siquiera del teléfono; costo de cómputo cero para el banco | Exige app nativa; un modelo de 2B es lo realista en un teléfono medio, no uno de 4B |
| Delegación entre pares | Repartido, con Pears | Es lo que el reto valora explícitamente | Un banco no manda movimientos de un cliente a equipos de terceros |

Las bases permiten la nube para hospedar la interfaz y autenticar, no para inferir. Eso encaja
con el primer camino: el banco sirve la web como hoy y la inferencia ocurre en su propio
hardware. El segundo camino es la evolución natural y el SDK ya lo contempla: expone un plugin
de Expo para React Native, así que el mismo dominio de Chen puede empaquetarse en una app
donde el modelo viva en el teléfono. Este prototipo es web porque un jurado necesita abrirlo
sin instalar nada, y porque el dominio y las reglas de cálculo se reutilizan tal cual en móvil.

Lo que no cambia en ningún camino: el modelo solo clasifica la intención y escoge evidencia. Los
importes salen de motores deterministas. Ese contrato es lo que hace que mover la inferencia de
un servidor a un teléfono sea una decisión de despliegue y no una reescritura.

## Que nada salga del equipo, comprobado

Tres capas, no una promesa:

1. **Auditoría del código.** Ningún archivo de `server/` ni de `src/` contacta un host externo.
   Las únicas llamadas del navegador son a rutas relativas del propio servidor, que escucha solo
   en `127.0.0.1`. No hay claves de API en el repositorio ni en el ejemplo de entorno.
2. **Una prueba que lo mantiene así.** `tests/no-cloud.test.ts` falla si aparece una URL externa
   en código de ejecución, si la inferencia entra por algo que no sea el SDK de QVAC, o si se
   agrega otro motor de IA a las dependencias. Es una cerca, no una declaración.
3. **La corrida sin red, con todo encendido.** Con el Wi-Fi desconectado y `1.1.1.1:443`
   inalcanzable: el modelo de texto carga desde caché en 36 s y responde las siete preguntas,
   incluidas las tres de historial, entre 14 y 19 s cada una; Whisper carga en 17 s y transcribe
   dos frases dictadas en español en 1.4 s. Los artefactos guardan `network.reachable: false`
   junto a las respuestas. Ni el texto ni la voz necesitan internet.

Lo único que sí necesita red es la **descarga inicial del modelo**, que ocurre una sola vez y no
es inferencia. Después de eso la aplicación funciona con el equipo desconectado, y eso es
justamente lo que demuestra la corrida de arriba.

## El nombre

**Chen** viene de *chen chen*, la plata en panameño. Es corto, se dice fácil y suena a alguien
que te ayuda con lo tuyo, no a un tablero. La aplicación se llamaba Rastro cuando se recibió la
base de Diego; el cambio de nombre está declarado más abajo junto con esa base.

## Proyección: ¿llegas al próximo pago?

La pregunta se decide en un día concreto, así que la proyección simula día por día en vez de
promediar el mes. Un promedio mensual esconde justo la fecha en que la cuenta se queda corta.

- **Reconoce cómo cobras.** A partir de tus propios ingresos clasifica el patrón en mensual,
  quincenal o irregular, con el nivel de confianza a la vista. Si son irregulares, reparte el
  ingreso por día en lugar de apostar a una fecha, y lo dice.
- **Coloca lo que se repite.** Compromisos en su fecha de vencimiento y gastos recurrentes en el
  día del mes en que suelen ocurrir. Un compromiso confirmado manda sobre la serie detectada con
  el mismo nombre, para no descontar el mismo recibo dos veces.
- **Deja fuera lo que no sale de la cuenta.** Los descuentos de planilla no aparecen como salida
  porque el empleador los retiene antes de pagar.
- **Responde con un veredicto.** Si el saldo aguanta, dice con cuánto llegas. Si no, dice el día
  en que te quedas corto, cuánto falta y qué mover para cruzar el tramo.
- **Autonomía sin cobrar.** Cuántos días aguanta lo que ya está en la cuenta si no entra ningún
  cobro más. Para un ingreso irregular esa es la pregunta real, y el prorrateo por sí solo la
  esconde.

## Asistente

Chen vive en su propia pestaña y en una burbuja disponible desde cualquier pantalla. Mantiene el
mismo contrato de siempre: el modelo clasifica la pregunta y elige entre una y tres evidencias,
la aplicación redacta con importes ya calculados, y cada afirmación se abre hasta los movimientos
que la sostienen. Mientras piensa se reproduce el loop oficial de Caja de Ahorros, que es también
la espera al cargar el modelo y al guardar cambios.

## Preguntas que responde

Además del mes en curso, Chen responde sobre varios meses. El modelo nunca calcula: clasifica y
llena huecos tipados, y la aplicación hace la aritmética.

| Lo que pregunta el cliente | Lo que devuelve |
| --- | --- |
| ¿Cuánto llevo gastado en Restaurantes? | Total del período, porcentaje del gasto y promedio mensual |
| ¿Cuánto he gastado en Nube Música? | Total, número de cargos, promedio mensual y su rubro |
| ¿En qué rubro se me ha ido más en los últimos tres meses? | Los tres rubros que más pesan, con importe y porcentaje |
| Si aparto cien dólares al mes, ¿cuánto junto hasta fin de año? | El acumulado, los meses de aporte y qué porcentaje de un mes representa |

Dos detalles que sostienen la honestidad de esas respuestas. La ventana declara el mes parcial:
si septiembre va por el día 9, se dice, porque promediar sin avisar haría parecer que el cliente
gasta menos. Y la gramática solo admite rubros y comercios que existen en sus datos, así que el
modelo no puede inventar uno.

Decidir si una pregunta abarca varios meses es trivial con una regla y el modelo de 4B lo
fallaba, porque se ancla en los hechos del mes que tiene delante. La regla resuelve la
temporalidad y recorta el enum del esquema; el modelo sigue haciendo lo difícil, que es elegir
la intención exacta y extraer el rubro o el comercio. Una instrucción se puede ignorar, una
gramática no.

## Dictado, también local

El micrófono del asistente transcribe con Whisper dentro de QVAC, en el mismo equipo. La API de
voz del navegador manda el audio a un servidor del fabricante, y eso sacaría del dispositivo un
dato del cliente, que es exactamente lo que el reto prohíbe.

El navegador captura a WAV PCM de 16 bits, 16 kHz y mono, que es lo que Whisper espera, y lo
envía crudo al servidor local. Medido en esta máquina: el modelo carga en 17 s y transcribe una
frase en 1.5 s. Lo dictado se deja en el campo para que el cliente lo revise antes de enviar; no
se corrige en silencio, porque colapsar sinónimos cambia la pregunta.

```powershell
npm run voice:check -- rutaludio.wav
```

## Guía dentro de la aplicación

La pestaña Guía explica, sección por sección, qué entra en cada cálculo, qué queda fuera a
propósito y qué la aplicación no hace. Son definiciones cortas, no un manual: veintinueve
términos con salto directo a la pantalla que describen.

## Cómo se leen tus movimientos

- **Categorías.** Veinte categorías que cubren el gasto doméstico y el de quien además factura
  por su cuenta: proveedores, servicios profesionales, marketing, alquileres, seguros, impuestos.
- **Lo que no es gasto.** Una transferencia entre cuentas propias y un retiro de efectivo mueven
  saldo sin consumirlo. Chen los muestra aparte, con su importe, y no los suma al consumo del
  período. Contarlos como gasto es el error clásico de cualquier tablero bancario.
- **Productos separados.** La bandeja de movimientos filtra por tarjeta de crédito, cuenta
  corriente y cuenta de ahorros. Las compras de tarjeta alimentan el análisis de consumo; la
  cuenta alimenta el flujo de efectivo. El pago de tarjeta aparece en la cuenta y no vuelve a
  contarse como gasto.
- **Pasivos y compromisos.** Se distinguen por naturaleza (servicio, préstamo, seguro, tarjeta) y
  por forma de pago. Un descuento directo de planilla no reduce el saldo de hoy porque el
  empleador lo retiene antes de pagar: reduce el próximo ingreso, y así se muestra.
- **Pendiente.** Una compra autorizada que el comercio todavía no cobró en firme. El banco
  retiene el dinero, así que se resta del saldo disponible, pero no entra al gasto del período
  porque su importe final puede cambiar.

## Cumplimiento del reto

Cada requisito del Track 05, y dónde se cumple.

| Requisito | Cómo se cumple |
| --- | --- |
| Construir con el SDK de QVAC | `@qvac/sdk` 0.19.0 es dependencia declarada. Texto en `server/qvac.ts`, voz en `server/voice.ts`. Son los dos únicos puntos de entrada de inferencia y una prueba lo verifica. |
| Inferencia en el dispositivo; la nube descalifica | Todo corre en la máquina que sirve la aplicación. No hay respaldo remoto: sin modelo local, Chen lo dice y no responde. Comprobado con el equipo desconectado. |
| Datos del cliente no salen del dispositivo | El servidor escucha solo en `127.0.0.1`. El dictado se transcribe con Whisper en el mismo equipo, no con la API de voz del navegador, que enviaría el audio a un tercero. |
| Solo datos sintéticos o públicos | Dos clientes ficticios generados en `server/fixtures.ts` y `server/planning-fixtures.ts`. No hay datos reales de ninguna entidad ni credenciales bancarias. |
| Declarar toda base preexistente | Sección «Base preexistente declarada», más abajo, y el archivo `LICENSE`. El commit `7c02033` conserva esa base sin modificar. |
| Repositorio accesible al jurado | Pendiente de publicar. Ver «Entrega». |
| Video de máximo cinco minutos, sin credenciales | Pendiente de grabar. Guion minuto a minuto en `docs/DEMO.md`. |
| La propiedad intelectual permanece en el equipo | `LICENSE`: derechos reservados, con permiso de evaluación para la organización y el jurado. |

## Entrega

Lo que falta antes del cierre, en orden:

1. **Publicar el repositorio** y confirmar que el jurado puede clonarlo y ejecutarlo.
2. **Grabar el video** siguiendo `docs/DEMO.md`, con el modelo ya cargado y memoria libre, y
   publicar el enlace aquí: _(pendiente)_.
3. **Leer los Términos y Condiciones generales**, en particular pertenencia simultánea a equipos.
4. **Confirmar el canal y el horario de entrega** con la organización.

Para reproducir la evaluación completa desde cero:

```powershell
npm ci
npm run build
npm test
npm run demo
npm run qvac:check
```

## Privacidad y límites

- No contiene datos reales ni solicita credenciales bancarias.
- El servidor escucha solo en `127.0.0.1` y limita el acceso de la demo a localhost.
- No es una aplicación oficial del banco ni una instrucción financiera.
- Una integración bancaria real requiere identidad, TLS, autorización, retención y auditoría del banco.
- La aplicación usa el logotipo de Caja de Ahorros solo para identificar el reto; no es una aplicación oficial del banco ni tiene su aval.

## Base preexistente declarada

La base recibida de Diego el 9 de septiembre de 2026, llamada **Rastro**, se importó sin modificar en el commit `7c02033`. El producto se renombró a **Chen** el 9 de septiembre de 2026; el código original conserva su autoría y su historia en ese commit.

**Lo que traía esa base:** la experiencia de análisis de tarjeta, React con Vite, Express,
SQLite, los fixtures sintéticos, las primeras pruebas y un adaptador inicial de QVAC que nunca
se había ejecutado contra un modelo.

**Lo que se construyó encima:** el dominio de cuenta con productos separados; planificación,
escenarios y proyección día a día; el catálogo de veinte categorías con la distinción entre
gasto y traslado; el historial por rubro y por comercio; el asistente conversacional con su
burbuja y su guía; el dictado local con Whisper; la identidad de Caja de Ahorros; el contrato
de intención tipada con redacción determinista, su guardián de coherencia y la gramática que
impide inventar entidades; y la validación real de QVAC, incluida la corrida sin red.

Dependencias declaradas y fijadas en `package-lock.json`: QVAC SDK, React, Vite, Express, express-session, Zod, TypeScript, tsx y Playwright. Documentación de referencia del SDK: https://docs.qvac.tether.io/js-ts-sdk/ y https://docs.qvac.tether.io/ai-capabilities/text-generation/.

### Identidad visual

El logotipo y el video de marca provienen de la carpeta oficial del hackatón (`Hackathon 2026` en Drive), no de una descarga pública ni de una reproducción hecha por el equipo:

| Archivo entregado | Formato real | Qué se hizo |
| --- | --- | --- |
| `caja_de_ahorros_logo.png` | WebP 696×698 con alfa, con extensión `.png` | Convertido a PNG real en `public/brand/logo-ca.png` más escalas de 512, 192, 64 y 32 px y `public/favicon.ico` |
| `caja-de-ahorros-panama-30s-loop.webm` | VP9 720×720, 872 cuadros, sin duración ni fps en el contenedor | Metadatos reparados y transcodificado a H.264 en `public/brand/ca-loop.mp4` (659 KB frente a 8.9 MB), con `ca-loop-poster.png` |

El color institucional `#1858A0` se tomó del propio logotipo y define la barra lateral, los acentos primarios y `theme-color`. El video se reproduce mientras el modelo local se carga.

No se presupone aval de Caja de Ahorros ni titularidad sobre su marca.

## Archivos importantes

- `LICENSE`: propiedad intelectual, permiso de evaluación y declaración de la base preexistente.
- `AGENTS.md`: reglas de construcción para cualquier agente que toque este repositorio.
- `docs/ARQUITECTURA.md`: cómo está armado y cuál es el contrato con el modelo.
- `docs/VALIDACION.md`: qué se verificó, con qué resultado y qué falta.
- `docs/DEMO.md`: guion de cinco minutos, minuto a minuto.
- `docs/BLUEPRINT.md`: el diseño original, congelado antes de escribir código. Documento histórico.
