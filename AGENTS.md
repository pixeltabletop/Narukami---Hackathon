# Chen — reglas de construcción

- El Track 05 Caja de Ahorros es un subproyecto independiente del Track 01 Philips.
- La inferencia bancaria se ejecuta localmente con QVAC; una API de inferencia en nube descalifica la entrega.
- Solo se usan datos sintéticos o públicos. Nunca agregar datos reales de clientes.
- El servidor calcula importes en centavos enteros. El modelo no calcula saldos, márgenes ni escenarios.
- Consumo de tarjeta y flujo de cuenta son dominios separados. Una compra de tarjeta no vuelve a contarse cuando se registra el pago de la tarjeta.
- Toda recomendación debe mostrar sus supuestos y permitir abrir la evidencia que la respalda.
- La identidad de Caja de Ahorros ya está integrada: logotipo oficial, azul `#1858A0` tomado del propio logotipo y el loop de marca como espera de toda la aplicación. No sustituirla ni presentar la aplicación como producto oficial del banco.
- La voz también es un dato del cliente: el dictado se transcribe con Whisper dentro de QVAC, nunca con la API de voz del navegador.
- El modelo clasifica y llena campos tipados. No calcula, no redacta libre y no puede nombrar un rubro o comercio que no exista en los datos de ese cliente.

## Criterios de aceptación

1. Entender: el cliente puede consultar y auditar su gasto.
2. Organizar: ve saldo, pendientes, compromisos y margen hasta su próximo ingreso.
3. Escenarios: compara ahorro conservador, sugerido y ambicioso sin alterar sus datos.
4. Privacidad: la interfaz identifica el procesamiento local y el repositorio no contiene secretos ni datos bancarios reales.
5. Calidad: `npm test` y `npm run build` deben pasar; la demostración debe funcionar en escritorio y móvil.
