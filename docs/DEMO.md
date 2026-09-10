# Guion de demostración — Chen (máximo cinco minutos)

Regla que no se rompe: no se graba ninguna respuesta preparada como si fuera inferencia.
Si el modelo local no responde en la toma, se corta y se vuelve a grabar. Nada se recita.

## Antes de grabar

1. `npm ci && npm run build && npm test` en verde.
2. `$env:CHEN_ENABLE_QVAC="1"` y `npm run qvac:check` con `artifacts/qvac-check.json` escrito en esta máquina.
3. `npm run dev` y el modelo ya cargado, para no gastar minutos de video en la carga.
4. Adaptador de red listo para desactivarse en cámara.
5. Cliente Ana Martínez seleccionado, período septiembre 2026.

## Minuto a minuto

**0:00 – 0:35 · El problema, con nombre y apellido**
El cliente ve el estado de cuenta y no entiende por qué gastó más. El banco tampoco puede
mandar esos movimientos a un modelo en la nube. Chen resuelve las dos cosas: explica el
consumo y organiza el saldo, sin que el dato salga del dispositivo.
En pantalla: la portada con el logo de Caja de Ahorros y la advertencia de datos ficticios.

**0:35 – 1:25 · Entiende, y lo que no es gasto**
Resumen: gasto neto contabilizado, período anterior comparable y pendiente de contabilizar.
Decir en una frase qué es un pendiente: compra autorizada que el comercio no ha cobrado en
firme; el banco retiene el dinero pero el importe puede cambiar, así que no entra al consumo.
Abrir el mapa de categorías y bajar al bloque «No es gasto»: el traspaso a ahorros y el retiro
de efectivo salieron de la cuenta sin consumirse. Esta es la frase que vende la idea: contar un
traspaso como gasto es el error que comete cualquier tablero, y Chen no lo comete.

**1:25 – 2:20 · La pregunta en lenguaje natural, con el modelo local**
Preguntar en vivo: «¿en qué se me fue el dinero?» y después «¿por qué gasté más?».
Decir lo que realmente hace el modelo: clasifica la intención y escoge entre una y tres
evidencias. La aplicación redacta la respuesta desde los hechos ya calculados. El modelo no
suma, no inventa cifras y no ejecuta consultas.
Abrir la evidencia de una respuesta para mostrar el movimiento exacto.

**2:20 – 2:50 · El asistente, dictado y con memoria de meses**
Tocar el micrófono y preguntar en voz alta: «¿en qué rubro se me ha ido más en los últimos tres
meses?». Decir que la voz también se transcribe aquí, con Whisper dentro de QVAC, porque la API
del navegador mandaría el audio a un servidor ajeno. Después preguntar por escrito «si aparto
cien dólares al mes, ¿cuánto junto hasta fin de año?» y abrir la evidencia de una respuesta.

**2:50 – 3:00 · Productos, recurrentes y correcciones**
En la bandeja de movimientos, cambiar el filtro de producto entre tarjeta de crédito, cuenta
corriente y cuenta de ahorros. Señalar que el pago de tarjeta aparece en la cuenta y no vuelve
a contarse como consumo. Mostrar los cargos que se repiten y uno que cambió de importe.
Corregir la categoría de un movimiento y recargar para probar que la corrección persiste.

**3:00 – 3:50 · Organiza y Escenarios**
Este es el diferenciador frente a un lector de estados de cuenta.
Margen hasta el próximo ingreso: saldo menos pendientes, menos compromisos de la cuenta,
menos gasto variable, menos reserva. Excluir un compromiso y ver el margen recalcularse.
Bajar a los descuentos directos de planilla y explicar por qué están separados: nunca tocan la
cuenta, el empleador los retiene antes de pagar, así que reducen el próximo ingreso y no el
saldo de hoy. Vaciar el presupuesto variable para llevarlo todo a ahorro y ver subir el margen.
Pasar a Escenarios: conservador, sugerido y ambicioso, con el dinero que queda en cada uno.
Decir la regla en voz alta: el próximo ingreso no se suma antes de recibirse.

**3:50 – 4:10 · La proyección, que es la pregunta del cliente**
Abrir Proyección. Chen reconoció que Ana cobra los 15 y los 30 y proyecta día por día.
Subir el gasto variable en Organiza y volver: el veredicto se pone en rojo, dice el día exacto
en que se queda corta y cuánto falta. Cambiar a Luis para mostrar el caso de ingresos
irregulares, donde el prorrateo y la autonomía sin cobrar sustituyen a la fecha fija.

**4:10 – 4:30 · La prueba que decide el reto**
Desactivar la red en cámara. Volver a preguntar. El modelo responde igual.
Mostrar `artifacts/qvac-check.json` con el modelo, el tiempo de carga y la latencia medida.
No hay respaldo en la nube: si QVAC no está, la aplicación lo dice y no responde.

**4:30 – 5:00 · Dónde viviría esto**
Decirlo sin rodeos: hoy el portátil es a la vez dispositivo y servidor. En un banco, la
inferencia corre en la infraestructura del banco y la web se sirve como hoy; el paso siguiente
es el teléfono, y el SDK ya trae el plugin de Expo para eso. Como el modelo solo clasifica y
elige evidencia, mover la inferencia es una decisión de despliegue, no una reescritura.
Aislamiento por cliente, sesión y CSRF ya están. Falta identidad del banco, TLS,
autorización, retención y auditoría. Cerrar con la base de Diego declarada y el repositorio.

## Lo que no se dice

- No se afirma que el modelo razone sobre finanzas ni que dé consejo financiero.
- No se presenta como producto oficial de Caja de Ahorros.
- No se muestran datos reales de ningún cliente de ninguna entidad.
