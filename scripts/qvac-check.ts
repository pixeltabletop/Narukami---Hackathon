import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { LocalQvac, MODEL_NAME, inferenceEnabled } from "../server/qvac";
import { analyze } from "../server/analysis";
import { createFixtures } from "../server/fixtures";
if (!inferenceEnabled()) {
  console.log(
    "OMITIDO: inferencia desactivada. No se cargó ni descargó ningún modelo.",
  );
  process.exit(0);
}
const model = new LocalQvac(),
  started = Date.now();
try {
  console.log("Cargando QVAC. La primera ejecución puede descargar el modelo.");
  await model.load();
  const loadMs = Date.now() - started;
  console.log("Modelo cargado en", loadMs, "ms");
  const dashboard = analyze(createFixtures(), "ana", "2026-09");
  const scenarios = [
    { question: "¿En qué se me fue el dinero?", required: "category-1" },
    { question: "¿Por qué gasté más?", required: "category-1" },
    { question: "¿Qué me cobran seguido?", required: "recurring-" },
  ];
  const results = [];
  for (const scenario of scenarios) {
    const answer = await model.explain(scenario.question, dashboard);
    assert.ok(
      answer.factIds.some((id) => id.startsWith(scenario.required)),
      "Falta evidencia relevante: " + scenario.question,
    );
    assert.ok(
      !answer.summary.includes("?"),
      "La explicación no debe repetir una pregunta",
    );
    results.push({ question: scenario.question, ...answer });
    console.log(
      JSON.stringify(
        {
          question: scenario.question,
          summary: answer.summary,
          factIds: answer.factIds,
          elapsedMs: answer.elapsedMs,
        },
        null,
        2,
      ),
    );
  }
  mkdirSync("artifacts", { recursive: true });
  writeFileSync(
    "artifacts/qvac-check.json",
    JSON.stringify(
      {
        passed: true,
        timestamp: new Date().toISOString(),
        model: MODEL_NAME,
        loadMs,
        results,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await model.close();
}
