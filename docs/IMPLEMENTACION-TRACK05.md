# Implementación Track 05 — corte 2026-09-09

## Incremento funcional

Chen ya integra análisis de consumo y planificación del dinero disponible en una sola experiencia:

1. **Entiende:** movimientos de tarjeta, gasto neto, categorías, comparación y recurrencias.
2. **Organiza:** saldo, pendientes, compromisos, gasto variable, reserva y fecha del próximo ingreso.
3. **Escenarios:** ahorro conservador, sugerido y ambicioso con saldo remanente.

El caso sintético principal produce un margen auditable de USD 169.51:

| Concepto | Importe |
|---|---:|
| Saldo | USD 650.00 |
| Pendientes | − USD 32.00 |
| Compromisos | − USD 208.49 |
| Variable y reserva | − USD 240.00 |
| **Margen** | **USD 169.51** |

## Decisiones aplicadas

- El saldo es una instantánea explícita; no se reconstruye desde un historial incompleto.
- El próximo ingreso no se anticipa en el saldo.
- Las compras de tarjeta miden consumo y el pago de tarjeta mide flujo de efectivo; no se suman ambos.
- Los importes se calculan en centavos enteros y las fechas se validan como fechas reales.
- Los compromisos pueden confirmarse o excluirse y el cambio persiste por cliente.
- QVAC devuelve solo intención y referencias. El servidor redacta desde hechos verificables.
- La identidad oficial de Caja de Ahorros se integrará cuando se reciban logo y guía; el punto de reemplazo ya está visible.

## Evidencia de validación

- `npm test`: 19/19 pruebas aprobadas.
- `npm run build`: TypeScript y Vite aprobados.
- `npm run ui:check`: escritorio, móvil, planificación, persistencia, escenarios, CSRF y aislamiento aprobados.
- Capturas: `artifacts/organiza-desktop.png`, `artifacts/escenarios-desktop.png`, `artifacts/organiza-mobile.png`.

## Próximo bloqueo técnico

Falta la prueba real del modelo QVAC y la comparación Qwen/Gemma con el corpus bancario. No se ejecutó con menos de 1 GB de RAM libre. Esta validación requiere liberar memoria de forma controlada o usar el equipo definitivo de demostración; no debe sustituirse por una API de inferencia en nube.
