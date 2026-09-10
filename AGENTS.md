# Chen — reglas de construcción

- El Track 05 Caja de Ahorros es un subproyecto independiente del Track 01 Philips.
- La inferencia bancaria se ejecuta localmente con QVAC; una API de inferencia en nube descalifica la entrega.
- Solo se usan datos sintéticos o públicos. Nunca agregar datos reales de clientes.
- El servidor calcula importes en centavos enteros. El modelo no calcula saldos, márgenes ni escenarios.
- Consumo de tarjeta y flujo de cuenta son dominios separados. Una compra de tarjeta no vuelve a contarse cuando se registra el pago de la tarjeta.
- Toda recomendación debe mostrar sus supuestos y permitir abrir la evidencia que la respalda.
- Mantener la identidad visual actual de Chen hasta recibir el logo y la guía de Caja de Ahorros. Dejar la integración de marca reemplazable.

## Criterios de aceptación

1. Entender: el cliente puede consultar y auditar su gasto.
2. Organizar: ve saldo, pendientes, compromisos y margen hasta su próximo ingreso.
3. Escenarios: compara ahorro conservador, sugerido y ambicioso sin alterar sus datos.
4. Privacidad: la interfaz identifica el procesamiento local y el repositorio no contiene secretos ni datos bancarios reales.
5. Calidad: `npm test` y `npm run build` deben pasar; la demostración debe funcionar en escritorio y móvil.
