import { z } from "zod";
import type { Fact } from "./domain";

export const intentNames = ["spending_summary", "largest_categories", "changes", "recurring", "pending", "transfers", "unavailable"] as const;
const intentSchema = z.object({
  intent: z.enum(intentNames),
  factIds: z.array(z.string()).min(1).max(3),
}).strict();

export const renderIntent = (raw: string, facts: Fact[]) => {
  const cleaned = raw.trim().replace(/^\x60\x60\x60(?:json)?\s*/, "").replace(/\s*\x60\x60\x60$/, "");
  const parsed = intentSchema.parse(JSON.parse(cleaned));
  if (new Set(parsed.factIds).size !== parsed.factIds.length) throw new Error("Evidencias repetidas");
  const selected = parsed.factIds.map((id) => facts.find((fact) => fact.id === id));
  if (selected.some((fact) => !fact)) throw new Error("Referencia inexistente");
  const evidence = selected as Fact[];
  // El modelo acierta la evidencia y falla la etiqueta con mas frecuencia de la
  // que parece: en la corrida del 2026-09-09 respondio "pending" a una pregunta
  // de comparacion y el encabezado contradijo los hechos que el mismo eligio.
  // La etiqueta solo se acepta si la evidencia la sostiene.
  const holds = (prefix: string) =>
    parsed.factIds.some((id) => id === prefix || id.startsWith(prefix + "-"));
  const coherent: Record<(typeof intentNames)[number], boolean> = {
    spending_summary: true,
    largest_categories: holds("category"),
    changes: holds("category") || holds("total"),
    recurring: parsed.factIds.every((id) => id.startsWith("recurring-")),
    pending: holds("pending"),
    transfers: holds("transfers"),
    unavailable: holds("total"),
  };
  if (!coherent[parsed.intent])
    throw new Error(
      "La intención " + parsed.intent + " no coincide con la evidencia elegida",
    );
  const prefix: Record<(typeof intentNames)[number], string> = {
    spending_summary: "Este es el resumen verificable de tu gasto:",
    largest_categories: "Estas categorías explican la mayor parte de tu gasto:",
    changes: "Estos son los cambios que muestran tus movimientos:",
    recurring: "Estos cargos podrían ser recurrentes; dos períodos no confirman una suscripción:",
    pending: "Esto permanece pendiente y está separado del gasto contabilizado:",
    transfers: "Esto no es gasto: es dinero tuyo que cambió de lugar:",
    unavailable: "Los datos disponibles no permiten responder eso. Sí podemos confirmar:",
  };
  return { intent: parsed.intent, factIds: parsed.factIds, summary: prefix[parsed.intent] + " " + evidence.map((fact) => fact.text).join(" "), facts: evidence };
};
