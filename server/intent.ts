import { z } from "zod";
import { categories, type Category, type Fact, type Movement } from "./domain";
import {
  buildHistory,
  renderCategoryHistory,
  renderMerchantHistory,
  renderSavingsProjection,
  renderTopCategories,
  type History,
} from "./history";

// Intenciones del período en curso: el modelo elige evidencia ya calculada.
export const periodIntents = [
  "spending_summary",
  "largest_categories",
  "changes",
  "recurring",
  "pending",
  "transfers",
  "unavailable",
] as const;

// Intenciones sobre el historial: el modelo no elige evidencia, llena huecos
// tipados (rubro, comercio, meses, monto) y la aplicación hace la aritmética.
// Así el modelo sigue sin calcular nada, que es la regla que sostiene todo.
export const analyticIntents = [
  "category_history",
  "merchant_history",
  "top_categories_history",
  "savings_projection",
] as const;

export const intentNames = [...periodIntents, ...analyticIntents] as const;
export type IntentName = (typeof intentNames)[number];

export const savingsHorizons = [
  "fin_de_ano",
  "tres_meses",
  "seis_meses",
  "doce_meses",
] as const;

const intentSchema = z
  .object({
    intent: z.enum(intentNames),
    factIds: z.array(z.string()).max(3).default([]),
    category: z.enum(categories).optional(),
    merchant: z.string().max(80).optional(),
    months: z.number().int().min(1).max(24).optional(),
    monthlySavingCents: z.number().int().min(0).max(100_000_000).optional(),
    horizon: z.enum(savingsHorizons).optional(),
  })
  .strict();

export type AnalyticContext = {
  movements: Movement[];
  customerId: string;
  asOf: string;
};

const periodPrefix: Record<(typeof periodIntents)[number], string> = {
  spending_summary: "Este es el resumen verificable de tu gasto:",
  largest_categories: "Estas categorías explican la mayor parte de tu gasto:",
  changes: "Estos son los cambios que muestran tus movimientos:",
  recurring:
    "Estos cargos podrían ser recurrentes; dos períodos no confirman una suscripción:",
  pending: "Esto permanece pendiente y está separado del gasto contabilizado:",
  transfers: "Esto no es gasto: es dinero tuyo que cambió de lugar:",
  unavailable:
    "Los datos disponibles no permiten responder eso. Sí podemos confirmar:",
};

const parse = (raw: string) => {
  const cleaned = raw
    .trim()
    .replace(/^\x60\x60\x60(?:json)?\s*/, "")
    .replace(/\s*\x60\x60\x60$/, "");
  return intentSchema.parse(JSON.parse(cleaned));
};

export const renderIntent = (
  raw: string,
  facts: Fact[],
  context?: AnalyticContext,
) => {
  const parsed = parse(raw);

  if ((analyticIntents as readonly string[]).includes(parsed.intent)) {
    if (!context)
      throw new Error(
        "La intención " + parsed.intent + " necesita el historial del cliente",
      );
    const history: History = buildHistory(
      context.movements,
      context.customerId,
      context.asOf,
      parsed.months ?? 3,
    );
    const answer =
      parsed.intent === "category_history"
        ? parsed.category
          ? renderCategoryHistory(history, parsed.category as Category)
          : null
        : parsed.intent === "merchant_history"
          ? parsed.merchant
            ? renderMerchantHistory(history, parsed.merchant)
            : null
          : parsed.intent === "top_categories_history"
            ? renderTopCategories(history)
            : parsed.monthlySavingCents !== undefined
              ? renderSavingsProjection(
                  context.asOf,
                  parsed.monthlySavingCents,
                  parsed.horizon ?? "fin_de_ano",
                  history,
                )
              : null;
    if (!answer)
      throw new Error(
        "La intención " + parsed.intent + " llegó sin el dato que necesita",
      );
    // La evidencia de una pregunta de historial son sus propios movimientos,
    // no un hecho del período: se arma un hecho sintético para poder abrirla.
    const evidence: Fact[] =
      answer.movementIds.length > 0
        ? [
            {
              id: "history",
              // Etiqueta corta: repetir la respuesta completa dentro de su
              // propio botón de evidencia no aporta nada y estorba.
              text:
                answer.movementIds.length +
                (answer.movementIds.length === 1
                  ? " movimiento sostiene este cálculo"
                  : " movimientos sostienen este cálculo"),
              cents: [],
              movementIds: answer.movementIds,
            },
          ]
        : [];
    return {
      intent: parsed.intent,
      factIds: evidence.map((fact) => fact.id),
      summary: answer.summary,
      facts: evidence,
    };
  }

  if (parsed.factIds.length < 1)
    throw new Error("Falta la evidencia de la respuesta");
  if (new Set(parsed.factIds).size !== parsed.factIds.length)
    throw new Error("Evidencias repetidas");
  const selected = parsed.factIds.map((id) =>
    facts.find((fact) => fact.id === id),
  );
  if (selected.some((fact) => !fact))
    throw new Error("Referencia inexistente");
  const evidence = selected as Fact[];
  // El modelo acierta la evidencia y falla la etiqueta con mas frecuencia de la
  // que parece: en la corrida del 2026-09-09 respondio "pending" a una pregunta
  // de comparacion y el encabezado contradijo los hechos que el mismo eligio.
  // La etiqueta solo se acepta si la evidencia la sostiene.
  const holds = (prefix: string) =>
    parsed.factIds.some((id) => id === prefix || id.startsWith(prefix + "-"));
  const coherent: Record<(typeof periodIntents)[number], boolean> = {
    spending_summary: true,
    largest_categories: holds("category"),
    changes: holds("category") || holds("total"),
    recurring: parsed.factIds.every((id) => id.startsWith("recurring-")),
    pending: holds("pending"),
    transfers: holds("transfers"),
    unavailable: holds("total"),
  };
  const intent = parsed.intent as (typeof periodIntents)[number];
  if (!coherent[intent])
    throw new Error(
      "La intención " + intent + " no coincide con la evidencia elegida",
    );
  return {
    intent,
    factIds: parsed.factIds,
    summary:
      periodPrefix[intent] +
      " " +
      evidence.map((fact) => fact.text).join(" "),
    facts: evidence,
  };
};
