# Continuación para otra IA
## Solicitud del usuario
Dejar la estructura de Rastro lista SIN descargar ni ejecutar modelos ahora.
Continuar en otra laptop con otra IA. No reactivar la inferencia sin una nueva indicación del usuario.

## Objetivo
Módulo de banca en línea que explica en qué gastó el cliente usando movimientos de tarjeta.
La laptop representa infraestructura del banco. Los datos y QVAC deben permanecer en esa infraestructura.
Las APIs de IA en nube descalifican el reto. SDK QVAC obligatorio. Pears opcional.
Solo datos sintéticos o públicos; ninguna credencial ni movimiento real.

## Estado de entrega
Aplicación web, API, motor determinista, SQLite de correcciones y pruebas implementados.
Adaptador QVAC preparado, desactivado por RASTRO_ENABLE_QVAC ausente o distinto de 1.
No se incluyen modelos, node_modules, caches ni base de datos con estado de uso.
El motor entrega hallazgos calculados y la interfaz los etiqueta claramente.
La IA no está declarada terminada ni lista para el concurso.

## Primero
1. Leer README.md y docs/ARQUITECTURA.md.
2. Trabajar desde disco local. La unidad G: de Google Drive falló al descomprimir dependencias.
3. npm ci; npm run build; npm test; npm run dev.
4. Revisar http://127.0.0.1:4173.
5. Verificar hardware y requisitos de QVAC de la otra laptop antes de seleccionar un modelo.
6. Mantener inferencia desactivada durante esta revisión.

## Cuando el usuario autorice continuar con IA
Revisar server/qvac.ts, server/answer-validator.ts y scripts/qvac-check.ts.
El adaptador usa SDK 0.19.0 y QWEN3_4B_INST_Q4_K_M como candidato, no como elección obligatoria.
La variable RASTRO_ENABLE_QVAC=1 habilita la carga explícita. Esta carga puede descargar pesos.
No existe fallback a nube y no debe añadirse.
No usar las pruebas exploratorias de la laptop anterior como validación de la nueva.
Evaluar las tres preguntas, el aislamiento entre usuarios, importes y referencias, rechazo de instrucciones maliciosas, tiempos y cancelación.
La salida JSON está restringida con JSON Schema y validada con Zod.
El validador normaliza Unicode y solo permite cifras monetarias sustentadas en los hechos seleccionados.
Revisar casos con importes negativos, devoluciones y preguntas fuera del período.

## Observaciones previas
Llama 3.2 1B cargó pero no produjo explicaciones suficientemente fiables.
Qwen3 4B produjo una explicación pertinente; la validación completa se interrumpió a pedido del usuario.
Se detectaron cifras Unicode; se añadió normalización y pruebas.
No se completó una prueba de aislamiento de red a nivel del sistema operativo.
La autenticación actual es exclusivamente demostrativa (clientes seleccionables); no es banca real.

## Organización
server/domain.ts: tipos y contribución de movimientos.
server/analysis.ts: análisis determinista.
server/fixtures.ts: datos sintéticos.
server/repository.ts: correcciones por cliente.
server/qvac.ts: adaptador IA.
server/answer-validator.ts: contrato de respuestas.
server/index.ts: API y sesiones.
src/: componentes de interfaz y useRastro.
tests/: pruebas del dominio y aislamiento.
scripts/ui-check.ts: interfaz/API con Edge headless instalado.
scripts/qvac-check.ts: futuro chequeo de IA, omitido por defecto.

## Concurso
Repositorio accesible durante evaluación, README con toda base preexistente declarada.
Video máximo cinco minutos con enlace sin credenciales.
El usuario indicó cierre el 11 de septiembre a las 8:00 de Panamá.
No se publicó ni presentó la entrega. Preparar eso después de validar QVAC.
