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

## QVAC pendiente de validación

El adaptador usa QVAC SDK 0.19.0 y el modelo `QWEN3_4B_INST_Q4_K_M`. Para habilitarlo en el equipo de demostración:

```powershell
$env:RASTRO_ENABLE_QVAC="1"
npm run qvac:check
npm run dev
```

Antes de elegir el modelo final se debe medir un corpus fijo de preguntas bancarias, exactitud de intención, referencias válidas, latencia, memoria y ejecución sin red. La máquina usada para este incremento tenía menos de 1 GB libre, por lo que no se cargó el modelo para evitar una validación engañosa.

## Privacidad y límites

- No contiene datos reales ni solicita credenciales bancarias.
- El servidor escucha solo en `127.0.0.1` y limita el acceso de la demo a localhost.
- No es una aplicación oficial del banco ni una instrucción financiera.
- Una integración bancaria real requiere identidad, TLS, autorización, retención y auditoría del banco.
- La identidad visual oficial está pendiente; el sello superior es el punto reemplazable para el logo y la guía de Caja de Ahorros.

## Base preexistente declarada

La base de Rastro recibida de Diego el 9 de septiembre de 2026 se importó sin modificar en el commit `7c02033`. Incluía la experiencia de análisis de tarjeta, React/Vite, Express, SQLite, fixtures, pruebas y el adaptador inicial de QVAC. Este incremento agrega el dominio de cuenta, planificación y escenarios; endurece la validación de datos; y cambia la respuesta de QVAC a un contrato de intención tipada con redacción determinista.

Dependencias declaradas y fijadas en `package-lock.json`: QVAC SDK, React, Vite, Express, express-session, Zod, TypeScript, tsx y Playwright. Documentación de referencia del SDK: https://docs.qvac.tether.io/js-ts-sdk/ y https://docs.qvac.tether.io/ai-capabilities/text-generation/.

No se han usado logotipos oficiales ni se presupone aval de Caja de Ahorros.

## Archivos importantes

- `blueprint.md`: arquitectura completa y criterios de aceptación.
- `AGENTS.md`: reglas de construcción para cualquier agente.
- `docs/ARQUITECTURA.md`: arquitectura de la base recibida.
- `docs/VALIDACION.md`: validación previa sin modelos.
- `scripts/ui-check.ts`: recorrido funcional reproducible.
