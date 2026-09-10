// Batería de preguntas reales, hacia el pasado y hacia el futuro.
//
// `qvac:check` es una puerta: siete preguntas con la intención que deben
// devolver, y falla si alguna no cuadra. Esto es otra cosa. Es un barrido
// exploratorio con las preguntas que haría una persona de verdad sobre su
// dinero, para ver qué contesta Chen y, sobre todo, qué NO contesta.
//
// Por eso aquí no se declaran intenciones esperadas: inventarlas para una
// pregunta que el producto todavía no cubre sería decidir el resultado antes de
// medirlo. El comando registra lo que salió y el juicio se hace leyendo el
// artefacto.
//
// El artefacto se escribe después de cada respuesta, no al final: la máquina se
// quedó sin memoria a mitad de corrida más de una vez y perder veinte minutos de
// inferencia por eso es evitable.
import { mkdirSync, writeFileSync } from "node:fs";
import { LocalQvac, MODEL_NAME, inferenceEnabled } from "../server/qvac";
import { analyze } from "../server/analysis";
import { createFixtures } from "../server/fixtures";
import { probeNetwork, summarize, describe } from "./network-probe";

if (!inferenceEnabled()) {
  console.log("OMITIDO: inferencia desactivada. Definir CHEN_ENABLE_QVAC=1.");
  process.exit(0);
}

// Hacia atrás: lo que ya pasó con el dinero.
const pasado = [
  "¿Cuánto gasté este mes?",
  "¿En qué categoría se me va más el dinero?",
  "¿Gasté más que el mes pasado?",
  "¿Qué me están cobrando todos los meses?",
  "¿Cuánto llevo gastado en Supermercado?",
  "¿Cuánto he gastado en Restaurantes en los últimos tres meses?",
  "¿Cuál es mi promedio de gasto mensual?",
  "¿Qué compras tengo pendientes de que me las cobren?",
  "¿Cuánto saqué en efectivo?",
  "¿Qué porcentaje de mi gasto se va en comida?",
  "¿Cuánto he pagado de préstamo en lo que va del año?",
  "¿Hay algún cobro que me haya subido de precio?",
];

// Hacia adelante: lo que va a pasar con el dinero.
const futuro = [
  "¿Me alcanza hasta el próximo pago?",
  "Si aparto cincuenta dólares al mes, ¿cuánto tengo en seis meses?",
  "¿Cuánto puedo ahorrar este mes sin quedarme corto?",
  "Si sigo gastando así, ¿cómo termino el mes?",
  "¿Cuánto me queda disponible después de mis compromisos?",
  "Si aparto doscientos dólares al mes, ¿cuánto junto en un año?",
  "¿Qué compromisos me quedan por pagar este mes?",
  "Si dejo de pagar una suscripción, ¿cuánto ahorro al año?",
  "¿Puedo permitirme un gasto de trescientos dólares esta quincena?",
  "Si ahorro cien dólares al mes, ¿cuánto junto hasta fin de año?",
  "¿Cuándo se me acaba el dinero si no cobro?",
  "¿Cuánto tendría en tres meses si guardo ochenta dólares al mes?",
];

const model = new LocalQvac();
const resultados: unknown[] = [];
const samples = [];
const escribir = (loadMs: number, red: unknown) => {
  mkdirSync("artifacts", { recursive: true });
  writeFileSync(
    "artifacts/bateria-preguntas.json",
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        model: MODEL_NAME,
        loadMs,
        network: red,
        total: pasado.length + futuro.length,
        respondidas: resultados.length,
        resultados,
      },
      null,
      2,
    ),
  );
};

try {
  const antes = await probeNetwork("antes de cargar el modelo");
  console.log(describe(antes));
  samples.push(antes);
  const inicio = Date.now();
  await model.load();
  const loadMs = Date.now() - inicio;
  console.log("Modelo cargado en", loadMs, "ms\n");

  const movements = createFixtures();
  const dashboard = analyze(movements, "ana", "2026-09");
  const context = { movements, customerId: "ana", asOf: "2026-09-09" };

  for (const [horizonte, preguntas] of [
    ["pasado", pasado],
    ["futuro", futuro],
  ] as const) {
    console.log("=== " + horizonte.toUpperCase() + " ===");
    for (const question of preguntas) {
      try {
        const answer = await model.explain(question, dashboard, context);
        resultados.push({ horizonte, question, ...answer, error: null });
        console.log(
          "[" + answer.intent + "] " + question + "\n    " + answer.summary,
        );
      } catch (error) {
        const detalle = error instanceof Error ? error.message : "error";
        resultados.push({ horizonte, question, error: detalle });
        console.log("[FALLA] " + question + "\n    " + detalle);
      }
      escribir(loadMs, summarize(samples));
    }
    console.log("");
  }

  const despues = await probeNetwork("al terminar la batería");
  console.log(describe(despues));
  samples.push(despues);
  escribir(loadMs, summarize(samples));

  const porIntencion = new Map<string, number>();
  for (const r of resultados as { intent?: string; error: string | null }[]) {
    const clave = r.error ? "FALLA" : (r.intent ?? "sin intención");
    porIntencion.set(clave, (porIntencion.get(clave) ?? 0) + 1);
  }
  console.log("Reparto de intenciones:");
  for (const [clave, veces] of [...porIntencion].sort((a, b) => b[1] - a[1]))
    console.log("  " + clave + ": " + veces);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await model.close();
  const { close } = await import("@qvac/sdk");
  await close();
}
