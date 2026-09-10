// Compara los dos modelos candidatos sobre el mismo corpus de preguntas
// bancarias. Mide lo que el cliente vive: si la intencion cuadra, si la
// evidencia es la correcta y cuanto tarda. No mide perplejidad ni tokens.
import { mkdirSync, writeFileSync } from "node:fs";
import { LocalQvac, MODEL_KEYS, inferenceEnabled, type ModelKey } from "../server/qvac";
import { analyze } from "../server/analysis";
import { createFixtures } from "../server/fixtures";

if (!inferenceEnabled()) {
  console.log("OMITIDO: inferencia desactivada. Definir CHEN_ENABLE_QVAC=1.");
  process.exit(0);
}

// Varias preguntas admiten mas de una intencion honesta. Se acepta cualquiera
// de las listadas; lo que no se acepta es que la evidencia no venga al caso.
const corpus = [
  { question: "¿En qué se me fue el dinero?", intents: ["spending_summary", "largest_categories"], evidence: "category-" },
  { question: "¿Por qué gasté más este mes?", intents: ["changes", "spending_summary"], evidence: "category-" },
  { question: "¿Cuáles son mis categorías más altas?", intents: ["largest_categories"], evidence: "category-" },
  { question: "¿Qué me cobran todos los meses?", intents: ["recurring"], evidence: "recurring-" },
  { question: "¿Hay algún cargo que se repita?", intents: ["recurring"], evidence: "recurring-" },
  { question: "¿Qué compras todavía no se han contabilizado?", intents: ["pending"], evidence: "pending" },
  { question: "¿Cuánto gasté en total?", intents: ["spending_summary", "changes"], evidence: "total" },
  { question: "¿Cómo va a estar el clima mañana?", intents: ["unavailable"], evidence: "total" },
];

const dashboard = analyze(createFixtures(), "ana", "2026-09");
const report: Record<string, unknown> = {
  timestamp: new Date().toISOString(),
  corpusSize: corpus.length,
  models: {},
};

for (const key of MODEL_KEYS as readonly ModelKey[]) {
  console.log("\n=== " + key + " ===");
  const model = new LocalQvac(key);
  const startedLoad = Date.now();
  const rows = [];
  try {
    await model.load();
    const loadMs = Date.now() - startedLoad;
    console.log("cargado en " + loadMs + " ms");
    for (const item of corpus) {
      try {
        const answer = await model.explain(item.question, dashboard);
        const intentOk = item.intents.includes(answer.intent);
        const evidenceOk = answer.factIds.some(
          (id) => id === item.evidence || id.startsWith(item.evidence),
        );
        rows.push({ ...item, intent: answer.intent, factIds: answer.factIds, intentOk, evidenceOk, ms: answer.elapsedMs });
        console.log(
          [
            intentOk ? "intencion ok" : "intencion " + answer.intent,
            evidenceOk ? "evidencia ok" : "evidencia " + answer.factIds.join("+"),
            answer.elapsedMs + " ms",
            item.question,
          ].join(" · "),
        );
      } catch (error) {
        rows.push({ ...item, error: error instanceof Error ? error.message : String(error) });
        console.log("SIN RESPUESTA · " + item.question);
      }
    }
    const answered = rows.filter((r) => !("error" in r));
    const times = answered.map((r) => (r as { ms: number }).ms).sort((a, b) => a - b);
    (report.models as Record<string, unknown>)[key] = {
      loadMs,
      answered: answered.length,
      intentOk: rows.filter((r) => (r as { intentOk?: boolean }).intentOk).length,
      evidenceOk: rows.filter((r) => (r as { evidenceOk?: boolean }).evidenceOk).length,
      medianMs: times.length ? times[Math.floor(times.length / 2)] : null,
      maxMs: times.length ? times[times.length - 1] : null,
      rows,
    };
  } catch (error) {
    console.error("No se pudo evaluar " + key + ": " + (error instanceof Error ? error.message : error));
    (report.models as Record<string, unknown>)[key] = {
      error: error instanceof Error ? error.message : String(error),
      rows,
    };
  } finally {
    await model.close().catch(() => {});
  }
}

mkdirSync("artifacts", { recursive: true });
writeFileSync("artifacts/model-bench.json", JSON.stringify(report, null, 2));
console.log("\nartifacts/model-bench.json escrito");
