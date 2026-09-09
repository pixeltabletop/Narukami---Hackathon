# Arquitectura de Rastro
## Flujo
Navegador → API de sesión → movimientos del cliente → cálculos → hallazgos y evidencias.
Una etapa posterior habilitará QVAC local para interpretar preguntas y explicar esos hechos.

## Componentes
- React y TypeScript; componentes separados para navegación, resumen, actividad, recurrencias y preguntas.
- Express y express-session: sesiones seleccionables de demo, autorización por cliente y protección CSRF.
- Motor propio: centavos enteros, deduplicación, períodos equivalentes y estados de movimientos.
- SQLite: correcciones por cliente/comercio.
- QVAC SDK 0.19.0: importación dinámica; no se importa ni carga el motor en modo desactivado.
- Zod: solicitudes y respuestas estructuradas.
- Validador numérico: normalización Unicode y comparación de importes con evidencia seleccionada.

## Estado de IA
Inferencia desactivada por defecto. No se distribuyen modelos.
El endpoint de carga rechaza la operación en este modo.
El script de pruebas IA informa OMITIDO y no inicia descargas.
El adaptador conserva un candidato de modelo para que otra IA continúe después de autorización.
Los hallazgos visibles son cálculos, no respuestas simuladas de QVAC.

## Casos contables
Compras + comisiones - devoluciones - reversos, solo contabilizados.
Pagos de tarjeta no son compras. Pendientes y anulados no suman al gasto.
Solo USD. Ausencia de historial no se interpreta como cero.
Recurrencias requieren dos cargos de servicios con fechas cercanas; son posibilidades, no contratos confirmados.

## Límites de la entrega
Datos exclusivamente sintéticos. No hay core bancario ni identidad de producción.
Servidor restringido a localhost. Persistencia de sesión en memoria para demo.
La validación estructural no garantiza toda la semántica de una futura explicación.
Se requiere evaluación de hardware, rendimiento y salida de red en el equipo de destino.

## Decisiones
La copia de ejecución se creó en disco local por errores de Google Drive con npm.
El ZIP contiene código y documentación, sin dependencias, modelos ni caches.
No hay servicios de IA externos. La integración bancaria futura permanece dentro de infraestructura autorizada.
