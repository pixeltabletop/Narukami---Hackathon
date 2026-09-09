# Rastro — estructura lista, modelos desactivados

Prototipo de análisis de gastos de tarjeta para el reto de Caja de Ahorros.
Interfaz, API, cálculos, sesiones de demo y correcciones funcionan sin cargar modelos.
**La inferencia está desactivada por defecto. Esta entrega no incluye pesos de IA.**

## Trasladar a otra laptop
1. Extraer este proyecto en un disco local, por ejemplo C:/Proyectos/rastro. Evitar instalar node_modules en Google Drive.
2. Instalar Node 24 y npm si faltan.
3. Desde la carpeta:
```powershell
npm ci
npm run build
npm test
npm run dev
```
4. Abrir http://127.0.0.1:4173 y elegir un cliente ficticio.
5. Entregar a la otra IA el archivo **HANDOFF_AI.md**.

npm ci descarga dependencias de software, pero la aplicación no solicita pesos ni carga modelos al arrancar.
No establecer RASTRO_ENABLE_QVAC=1 durante la revisión sin IA.
El script npm run qvac:check se omite explícitamente cuando la inferencia está desactivada.

## Qué funciona
- Resumen de gasto neto, categorías y comparación de períodos.
- Bandeja con búsqueda, filtros y movimientos de respaldo.
- Posibles cargos recurrentes y cambios de importe.
- Correcciones de categoría por cliente/comercio en SQLite.
- Dos clientes ficticios con sesiones separadas.
- Vista adaptable a escritorio y móvil.
- Hallazgos calculados identificados como tales, sin simular respuestas de IA.

## Qué queda pendiente
- Configurar y validar QVAC/modelo en la laptop de destino.
- Completar evaluación de preguntas en español y latencia.
- Verificar inferencia con la salida de red del sistema deshabilitada.
- Conectar sistemas reales del banco solo con autorización.
- Publicar repositorio y video accesibles al jurado.

## Arquitectura
React + TypeScript → API Express → repositorio de movimientos → motor determinista.
El adaptador QVAC y el validador de respuestas están preparados, pero desactivados.
Los cálculos usan enteros en centavos. El modelo no ejecuta SQL ni mueve dinero.
Las referencias e importes de una respuesta se verifican contra sus hechos seleccionados.
La comprobación estructural y numérica no garantiza toda la semántica de la IA.

## Reglas
Gasto neto = compras y comisiones contabilizadas menos devoluciones y reversos.
Pagos de tarjeta, pendientes y anulados se muestran separados.
Solo USD. Corte sintético: 9 de septiembre de 2026.
Septiembre 1–9 se compara con agosto 1–9; los meses anteriores son completos.
Si falta historial anterior, no se interpreta como gasto cero.
Recurrencias son heurísticas, no confirmaciones de suscripción.

## Límites y privacidad
Todos los clientes, comercios y movimientos son sintéticos.
No es una aplicación oficial del banco ni se solicitan credenciales bancarias.
El servidor escucha únicamente en localhost; las sesiones son de demostración.
En producción se requieren identidad bancaria, TLS, controles de retención y auditoría.
No hay proveedor de inferencia en nube ni fallback remoto.
No usar carpetas sincronizadas con terceros para datos bancarios reales.

## Base preexistente declarada
Código de Rastro creado para este prototipo con asistencia de Codex; sin fork de una app bancaria.
Dependencias: QVAC SDK 0.19.0, React, Vite, Express, express-session, Zod, TypeScript, tsx y herramientas de prueba. Versiones fijadas en package-lock.json.
El adaptador se desarrolló usando los ejemplos oficiales del SDK:
https://docs.qvac.tether.io/js-ts-sdk/
https://docs.qvac.tether.io/ai-capabilities/text-generation/
Se aplicó la skill personal software-architecture.
Se exploraron previamente Llama 3.2 1B y Qwen3 4B del catálogo QVAC en la laptop original.
Sus pesos no se incluyen y no son necesarios para esta entrega estructural. La evaluación final de IA quedó pendiente por decisión del usuario.
No se usaron logotipos oficiales ni se presupone aval de Caja de Ahorros.

## Archivos importantes
- HANDOFF_AI.md: instrucciones de continuación.
- docs/ARQUITECTURA.md: componentes y decisiones.
- docs/DEMO.md: guion futuro.
- docs/VALIDACION.md: resultados de esta entrega sin modelos.
