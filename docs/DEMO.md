# Guion de demostración — Rastro (máximo cinco minutos)

Regla que no se rompe: no se graba ninguna respuesta preparada como si fuera inferencia.
Si el modelo local no responde en la toma, se corta y se vuelve a grabar. Nada se recita.

## Antes de grabar

1. `npm ci && npm run build && npm test` en verde.
2. `$env:RASTRO_ENABLE_QVAC="1"` y `npm run qvac:check` con `artifacts/qvac-check.json` escrito en esta máquina.
3. `npm run dev` y el modelo ya cargado, para no gastar minutos de video en la carga.
4. Adaptador de red listo para desactivarse en cámara.
5. Cliente Ana Martínez seleccionado, período septiembre 2026.

## Minuto a minuto

**0:00 – 0:35 · El problema, con nombre y apellido**
El cliente ve el estado de cuenta y no entiende por qué gastó más. El banco tampoco puede
mandar esos movimientos a un modelo en la nube. Rastro resuelve las dos cosas: explica el
consumo y organiza el saldo, sin que el dato salga del dispositivo.
En pantalla: la portada con el logo de Caja de Ahorros y la advertencia de datos ficticios.

**0:35 – 1:20 · Entiende**
Resumen: gasto neto contabilizado, período anterior comparable y pendiente de contabilizar.
Señalar que el pendiente se muestra aparte y no se mezcla con el gasto cerrado.
Abrir el mapa de categorías y bajar a los movimientos que lo sostienen.

**1:20 – 2:20 · La pregunta en lenguaje natural, con el modelo local**
Preguntar en vivo: «¿en qué se me fue el dinero?» y después «¿por qué gasté más?».
Decir lo que realmente hace el modelo: clasifica la intención y escoge entre una y tres
evidencias. La aplicación redacta la respuesta desde los hechos ya calculados. El modelo no
suma, no inventa cifras y no ejecuta consultas.
Abrir la evidencia de una respuesta para mostrar el movimiento exacto.

**2:20 – 2:55 · Recurrentes y correcciones**
Mostrar los cargos que se repiten y uno que cambió de importe. Corregir la categoría de un
movimiento y recargar para probar que la corrección persiste por cliente.

**2:55 – 3:50 · Organiza y Escenarios**
Este es el diferenciador frente a un lector de estados de cuenta.
Margen hasta el próximo ingreso: saldo menos pendientes, menos compromisos confirmados,
menos gasto variable, menos reserva. Excluir un compromiso y ver el margen recalcularse.
Pasar a Escenarios: conservador, sugerido y ambicioso, con el dinero que queda en cada uno.
Decir la regla en voz alta: el próximo ingreso no se suma antes de recibirse.

**3:50 – 4:30 · La prueba que decide el reto**
Desactivar la red en cámara. Volver a preguntar. El modelo responde igual.
Mostrar `artifacts/qvac-check.json` con el modelo, el tiempo de carga y la latencia medida.
No hay respaldo en la nube: si QVAC no está, la aplicación lo dice y no responde.

**4:30 – 5:00 · Qué falta para que esto sea del banco**
Aislamiento por cliente, sesión y CSRF ya están. Falta identidad del banco, TLS,
autorización, retención y auditoría. Cerrar con la base de Diego declarada y el repositorio.

## Lo que no se dice

- No se afirma que el modelo razone sobre finanzas ni que dé consejo financiero.
- No se presenta como producto oficial de Caja de Ahorros.
- No se muestran datos reales de ningún cliente de ninguna entidad.
