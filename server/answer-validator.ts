import { z } from "zod";
import type { Fact } from "./domain";
const schema = z
  .object({
    summary: z.string().min(1).max(900),
    factIds: z.array(z.string()).min(1).max(5),
  })
  .strict();
export const validateAnswer = (raw: string, facts: Fact[]) => {
  const cleaned = raw
    .trim()
    .replace(/^\x60\x60\x60(?:json)?\s*/, "")
    .replace(/\s*\x60\x60\x60$/, "");
  const answer = schema.parse(JSON.parse(cleaned));
  if (new Set(answer.factIds).size !== answer.factIds.length)
    throw new Error("Evidencias repetidas");
  const selected = answer.factIds.map((id) => facts.find((f) => f.id === id));
  if (selected.some((f) => !f)) throw new Error("Referencia inexistente");
  const summary = answer.summary.normalize("NFKC");
  const allowed = new Set(
    (selected as Fact[]).flatMap((f) => f.cents.map((c) => c / 100)),
  );
  const withoutAmounts = summary.replace(
    /(?:USD\s*|\$\s*)(-?\d[\d,]*\.\d{2})(?!\d)/g,
    (_match, amount: string) => {
      const parsed = Number(amount.replaceAll(",", ""));
      if (!allowed.has(parsed))
        throw new Error("Importe no sustentado por la evidencia seleccionada");
      return "";
    },
  );
  if (/[\p{N}%€£]/u.test(withoutAmounts))
    throw new Error("Cifra sin importe verificado");
  return { ...answer, summary, facts: selected as Fact[] };
};
