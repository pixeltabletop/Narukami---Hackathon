# Rastro — inteligencia local para entender y organizar el dinero

Prototipo para el Track 05 de Caja de Ahorros. Rastro une dos recorridos: explica el consumo de tarjeta con evidencia y ayuda a organizar el saldo disponible hasta el próximo ingreso. Los cálculos se realizan en el servidor local y QVAC se usa exclusivamente en el dispositivo para clasificar las preguntas del cliente.

**La inferencia está desactivada por defecto y el repositorio no incluye pesos de modelos.** Toda la demostración usa clientes y movimientos sintéticos.

## Ejecutar

Requiere Node 24 y npm. En Windows conviene trabajar en un disco local, fuera de carpetas sincronizadas.

```powershell
npm ci
npm run build
npm test
npm run dev
```

Abrir `http://127.0.0.1:4173` y seleccionar un cliente ficticio. Con el servidor activo, `npm run ui:check` recorre la experiencia en Edge para escritorio y móvil.

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
cambiar con `RASTRO_QVAC_MODEL`. Para habilitar la inferencia:

```powershell
$env:RASTRO_ENABLE_QVAC="1"
npm run qvac:check
npm run dev
```

`npm run qvac:check` carga el modelo, corre tres preguntas reales y escribe
`artifacts/qvac-check.json` con el modelo, el tiempo de carga, la latencia de cada respuesta y
si la máquina tenía salida a internet durante la prueba. `npm run model:bench` compara los dos
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

## Privacidad y límites

- No contiene datos reales ni solicita credenciales bancarias.
- El servidor escucha solo en `127.0.0.1` y limita el acceso de la demo a localhost.
- No es una aplicación oficial del banco ni una instrucción financiera.
- Una integración bancaria real requiere identidad, TLS, autorización, retención y auditoría del banco.
- La aplicación usa el logotipo de Caja de Ahorros solo para identificar el reto; no es una aplicación oficial del banco ni tiene su aval.

## Base preexistente declarada

La base de Rastro recibida de Diego el 9 de septiembre de 2026 se importó sin modificar en el commit `7c02033`. Incluía la experiencia de análisis de tarjeta, React/Vite, Express, SQLite, fixtures, pruebas y el adaptador inicial de QVAC. Este incremento agrega el dominio de cuenta, planificación y escenarios; endurece la validación de datos; y cambia la respuesta de QVAC a un contrato de intención tipada con redacción determinista.

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

- `blueprint.md`: arquitectura completa y criterios de aceptación.
- `AGENTS.md`: reglas de construcción para cualquier agente.
- `docs/ARQUITECTURA.md`: arquitectura de la base recibida.
- `docs/VALIDACION.md`: validación previa sin modelos.
- `scripts/ui-check.ts`: recorrido funcional reproducible.
