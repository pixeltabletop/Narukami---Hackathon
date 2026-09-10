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
// El reto descalifica la inferencia en nube. Para que la evidencia sirva hay que
// registrar si la maquina tenia salida a internet mientras el modelo respondia.
async function probeNetwork() {
  const control = new AbortController(),
    timer = setTimeout(() => control.abort(), 4000);
  try {
    const response = await fetch("https://cloudflare.com/cdn-cgi/trace", {
      signal: control.signal,
    });
    return { reachable: response.ok, detail: "HTTP " + response.status };
  } catch (error) {
    return {
      reachable: false,
      detail: error instanceof Error ? error.message : "sin salida",
    };
  } finally {
    clearTimeout(timer);
  }
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
    { question: "¿Cuánto moví a mi cuenta de ahorros?", required: "transfers" },
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
  const network = await probeNetwork();
  console.log(
    network.reachable
      ? "Red disponible durante la prueba: " + network.detail
      : "Sin salida a internet durante la prueba: " + network.detail,
  );
  mkdirSync("artifacts", { recursive: true });
  writeFileSync(
    "artifacts/qvac-check.json",
    JSON.stringify(
      {
        passed: true,
        timestamp: new Date().toISOString(),
        model: MODEL_NAME,
        loadMs,
        network,
        latencyMs: {
          min: Math.min(...results.map((r) => r.elapsedMs)),
          max: Math.max(...results.map((r) => r.elapsedMs)),
        },
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
