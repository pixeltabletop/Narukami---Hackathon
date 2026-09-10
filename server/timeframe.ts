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
const AMOUNT_HINTS = /\d|\b(cien|ciento|mil|doscientos|trescientos|quinientos)\b/;

export type Timeframe = "history" | "savings" | "unclear";

export const timeframeHint = (question: string): Timeframe => {
  // Sin quitar los acentos, "últimos" y "año" no coinciden con nada.
  const clean = question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (SAVINGS_HINTS.test(clean) && AMOUNT_HINTS.test(clean)) return "savings";
  return HISTORY_HINTS.test(clean) ? "history" : "unclear";
};
