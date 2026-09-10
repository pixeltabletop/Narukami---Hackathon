import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { LocalQvac, MODEL_NAME, inferenceEnabled } from "../server/qvac";
import { analyze } from "../server/analysis";
import { createFixtures } from "../server/fixtures";
import {
  probeNetwork,
  summarize,
  describe,
  type ProbeSample,
} from "./network-probe";
if (!inferenceEnabled()) {
  console.log(
    "OMITIDO: inferencia desactivada. No se cargó ni descargó ningún modelo.",
  );
  process.exit(0);
}
const model = new LocalQvac(),
  started = Date.now();
const samples: ProbeSample[] = [];
try {
  // Antes de tocar el modelo: si aquí ya hay red, la corrida no sirve como
  // prueba de ejecución sin conexión y el artefacto lo dirá.
  const antes = await probeNetwork("antes de cargar el modelo");
  console.log(describe(antes));
  samples.push(antes);

  console.log("Cargando QVAC. La primera ejecución puede descargar el modelo.");
  await model.load();
  const loadMs = Date.now() - started;
  console.log("Modelo cargado en", loadMs, "ms");
  const movements = createFixtures();
  const dashboard = analyze(movements, "ana", "2026-09");
  const context = { movements, customerId: "ana", asOf: "2026-09-09" };
  // `intents` es lo que una respuesta correcta puede ser, no lo que el modelo
  // devolvió la última vez. Escribirlo al revés convertiría la prueba en un
  // espejo del comportamiento actual y dejaría de detectar una clasificación
  // equivocada. Cuando la pregunta admite dos lecturas legítimas, se listan las
  // dos; cuando no, se lista una sola.
  const scenarios = [
    {
      // Dos lecturas legitimas y dos evidencias legitimas: el total, si contesta
      // el gasto global, o una categoria, si contesta en que pesa mas. Antes
      // aqui se exigia "category-1", que es lo que elige "changes": la
      // expectativa estaba calibrada contra el defecto, no contra la respuesta
      // correcta.
      question: "¿En qué se me fue el dinero?",
      required: ["total", "category-"],
      intents: ["spending_summary", "largest_categories"],
    },
    {
      question: "¿Por qué gasté más?",
      required: ["category-"],
      intents: ["changes"],
    },
    {
      question: "¿Qué me cobran seguido?",
      required: ["recurring-"],
      intents: ["recurring"],
    },
    {
      question: "¿Cuánto moví a mi cuenta de ahorros?",
      required: ["transfers"],
      intents: ["transfers"],
    },
    // Historial: la evidencia se arma con los movimientos del propio rubro.
    {
      question: "¿Cuánto llevo gastado en Restaurantes?",
      required: ["history"],
      expect: /Restaurantes/,
      intents: ["category_history"],
    },
    {
      question: "¿En qué rubro he gastado más en los últimos tres meses?",
      required: ["history"],
      expect: /se concentra en/,
      intents: ["top_categories_history"],
    },
    {
      question: "Si aparto cien dólares al mes, ¿cuánto junto hasta fin de año?",
      required: [],
      expect: /Apartando/,
      intents: ["savings_projection"],
    },
  ];
  const results = [];
  const fallos: string[] = [];
  for (const [indice, scenario] of scenarios.entries()) {
    // La toma "durante" viaja en paralelo con la primera inferencia: es la
    // única que demuestra que no había salida mientras el modelo pensaba.
    const [answer, durante] = await Promise.all([
      model.explain(scenario.question, dashboard, context),
      indice === 0
        ? probeNetwork("mientras el modelo respondía la primera pregunta")
        : Promise.resolve(null),
    ]);
    if (durante) {
      console.log(describe(durante));
      samples.push(durante);
    }
    if (scenario.required.length)
      assert.ok(
        answer.factIds.some((id) =>
          scenario.required.some((prefijo) => id.startsWith(prefijo)),
        ),
        "Falta evidencia relevante: " +
          scenario.question +
          " (devolvió " +
          JSON.stringify(answer.factIds) +
          ", se esperaba alguna de " +
          JSON.stringify(scenario.required) +
          ")",
      );
    if ("expect" in scenario && scenario.expect)
      assert.match(
        answer.summary,
        scenario.expect as RegExp,
        "La respuesta no habla de lo que se preguntó: " + scenario.question,
      );
    assert.ok(
      !answer.summary.includes("?"),
      "La explicación no debe repetir una pregunta",
    );
    // La intención se acumula en vez de cortar en la primera: interesa el
    // cuadro completo de la corrida, no solo el primer tropiezo.
    if (!scenario.intents.includes(answer.intent))
      fallos.push(
        scenario.question +
          " -> devolvió '" +
          answer.intent +
          "', se esperaba " +
          scenario.intents.map((i) => "'" + i + "'").join(" o "),
      );
    results.push({ question: scenario.question, expected: scenario.intents, ...answer });
    console.log(
      JSON.stringify(
        {
          question: scenario.question,
          intent: answer.intent,
          summary: answer.summary,
          factIds: answer.factIds,
          elapsedMs: answer.elapsedMs,
        },
        null,
        2,
      ),
    );
  }
  const despues = await probeNetwork("al terminar todas las respuestas");
  console.log(describe(despues));
  samples.push(despues);
  const network = summarize(samples);
  console.log(
    network.reachable
      ? "AVISO: hubo salida a internet en algún momento de la prueba."
      : "Sin salida a internet en ninguna de las tomas.",
  );
  const intentOk = fallos.length === 0;
  if (!intentOk) {
    console.error("\nIntenciones que no cuadran:");
    for (const f of fallos) console.error("  " + f);
  }
  mkdirSync("artifacts", { recursive: true });
  writeFileSync(
    "artifacts/qvac-check.json",
    JSON.stringify(
      {
        passed: intentOk,
        timestamp: new Date().toISOString(),
        model: MODEL_NAME,
        loadMs,
        network,
        intents: {
          correctas: scenarios.length - fallos.length,
          total: scenarios.length,
          fallos,
        },
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
  assert.equal(
    fallos.length,
    0,
    fallos.length + " pregunta(s) con la intención equivocada",
  );
  console.log(
    "\n" + scenarios.length + " de " + scenarios.length + " con la intención esperada.",
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  // `close()` del adaptador solo descarga el modelo. Sin cerrar tambien el
  // cliente del SDK el worker puede quedar vivo y el proceso no termina, que es
  // lo peor que puede pasarle a un comando que el jurado va a ejecutar.
  await model.close();
  const { close } = await import("@qvac/sdk");
  await close();
}
