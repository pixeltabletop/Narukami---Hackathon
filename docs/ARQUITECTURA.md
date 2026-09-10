# Arquitectura de Chen

## Flujo

Navegador → API local de sesión → movimientos del cliente → motores deterministas → hechos con
su evidencia. Sobre esos hechos, QVAC clasifica la pregunta y elige qué citar; la aplicación
redacta con importes ya calculados.

Todo ocurre en la misma máquina. El servidor escucha solo en `127.0.0.1` y no existe fallback a
un servicio remoto: si el modelo local no está, la aplicación lo dice y no responde.

## Componentes

- **React y TypeScript.** Componentes separados por pantalla: resumen, movimientos, recurrentes,
  organiza, proyección, escenarios, asistente y guía.
- **Express y express-session.** Sesiones de demostración seleccionables, autorización por
  cliente y protección CSRF.
- **Motores deterministas.** Centavos enteros en todo el recorrido.
  - `analysis.ts`: gasto del período, categorías, comparación y recurrencias.
  - `planning.ts`: margen hasta el próximo ingreso, compromisos y escenarios.
  - `forecast.ts`: proyección día a día, patrón de cobro y autonomía sin ingresos.
  - `history.ts`: acumulados por rubro y por comercio sobre varios meses.
- **SQLite.** Correcciones de categoría y planes, por cliente.
- **QVAC SDK 0.19.0.** Importación dinámica: en modo desactivado el motor no se importa ni se
  carga. `qvac.ts` para texto, `voice.ts` para dictado con Whisper.
- **Zod.** Valida las solicitudes de la API y la salida del modelo.

## El contrato con el modelo

El modelo devuelve un único objeto JSON restringido por gramática: una intención de una lista
cerrada y, según el caso, hasta tres referencias de evidencia o campos tipados como el rubro, el
comercio, los meses o el monto a apartar.

Tres reglas sostienen todo lo demás:

1. **No calcula.** Ni importes, ni promedios, ni porcentajes. La aritmética es del servidor.
2. **No inventa entidades.** La gramática solo admite rubros y comercios que existan en los datos
   de ese cliente.
3. **La etiqueta tiene que cuadrar con la evidencia.** Si la intención no la sostiene, la
   respuesta se rechaza y se reintenta una vez con otra semilla.

Cuando una parte de la decisión es trivial por regla, como saber si la pregunta abarca varios
meses, se resuelve en código y se usa para recortar el enum del esquema. Una instrucción se
puede ignorar; una gramática no.

## Separación de dominios

El consumo de tarjeta y el flujo de la cuenta son motores distintos a propósito. Una compra de
tarjeta pertenece al análisis de consumo; el pago de esa tarjeta es una salida de la cuenta. Sin
esa separación el mismo dinero se cuenta dos veces.

Por la misma razón, una transferencia entre cuentas propias o un retiro de efectivo salen de la
cuenta pero no son gasto: se muestran aparte con su importe.
