// Decidir "¿esta pregunta abarca varios meses?" es trivial con una regla y un
// modelo de 4B lo falla, porque se ancla en la lista de hechos del mes que
// tiene delante. La regla resuelve la temporalidad; el modelo sigue haciendo lo
// difícil, que es elegir la intención exacta y extraer el rubro o el comercio.
//
// La pista no se le sugiere al modelo: recorta el enum del esquema. Una
// instrucción se puede ignorar, una gramática no.
const HISTORY_HINTS =
  /\b(ultimo|ultimos|ultima|ultimas|meses|mensual|mensuales|promedio|porcentaje|llevo|llevas|acumulad\w*|historic\w*|trimestre|semestre)\b|en lo que va|este ano|del ano/;
const SAVINGS_HINTS = /\b(ahorr\w*|apart\w*|guard\w*|junt\w*|separ\w*)\b/;
// La lista corta se quedaba en "cien" y "mil": "si aparto cincuenta dolares al
// mes" no se reconocia como cantidad, la pregunta caia en historial y el modelo
// contestaba el gasto de un rubro en vez de la proyeccion de ahorro. Salio en la
// bateria de preguntas reales del 2026-09-10.
const AMOUNT_HINTS =
  /\d|\b(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|quince|veinte|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|cien|ciento|cientos|doscientos|trescientos|cuatrocientos|quinientos|seiscientos|setecientos|ochocientos|novecientos|mil|miles)\b/;

// La intencion "changes" responde por que el gasto subio o bajo contra el mes
// anterior. Sin una marca de comparacion en la pregunta no hay nada que
// comparar, y sin embargo el 4B la elegia igual: "¿en que se me fue el dinero?"
// devolvia "changes" y contestaba otra cosa. El resto de la corrida salia bien,
// asi que el error paso desapercibido hasta que la verificacion empezo a exigir
// la intencion esperada, el 2026-09-10.
//
// Mismo remedio que con la temporalidad: la regla decide y el enum se recorta.
// Una instruccion se puede ignorar, una gramatica no.
const COMPARISON_HINTS =
  /\b(por que|porque|subio|bajo|aumento|disminuyo|comparad\w*|diferencia|creci\w*)\b|\b(mas|menos|igual)\s+que\b|mes pasado|mes anterior|periodo anterior|que antes/;

// Sin quitar los acentos, "últimos", "año" y "más" no coinciden con nada.
//
// "Todos los meses" se neutraliza antes de mirar nada: significa que un cobro se
// repite, no que la pregunta abarque varios meses. Sin esto, "¿qué me están
// cobrando todos los meses?" caía en historial y el modelo contestaba con el
// gasto por comercio en vez de con los cargos recurrentes. Detectado el
// 2026-09-10 con la batería de preguntas reales.
const normalize = (question: string) =>
  question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/todos los meses|cada mes/g, " se repite ");

export type Timeframe = "history" | "savings" | "unclear";

export const timeframeHint = (question: string): Timeframe => {
  const clean = normalize(question);
  if (SAVINGS_HINTS.test(clean) && AMOUNT_HINTS.test(clean)) return "savings";
  return HISTORY_HINTS.test(clean) ? "history" : "unclear";
};

/** ¿La pregunta compara dos períodos? Decide si "changes" entra en el enum. */
export const comparesPeriods = (question: string): boolean =>
  COMPARISON_HINTS.test(normalize(question));
