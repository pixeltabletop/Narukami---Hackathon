import test from "node:test";
import assert from "node:assert/strict";
import { analyze } from "../server/analysis";
import { createFixtures } from "../server/fixtures";
import { renderIntent } from "../server/intent";

const facts = analyze(createFixtures(), "ana", "2026-09").facts;
test("el modelo solo selecciona intención y la aplicación redacta desde hechos", () => {
  const answer = renderIntent(JSON.stringify({ intent: "largest_categories", factIds: ["category-0", "category-1"] }), facts);
  assert.match(answer.summary, /Supermercado/);
  assert.match(answer.summary, /Restaurantes/);
  assert.equal(answer.facts.length, 2);
});
test("rechaza prosa, intenciones y evidencias no permitidas", () => {
  assert.throws(() => renderIntent(JSON.stringify({ intent: "salary", factIds: ["total"] }), facts));
  assert.throws(() => renderIntent(JSON.stringify({ intent: "unavailable", factIds: ["inventado"] }), facts));
  assert.throws(() => renderIntent(JSON.stringify({ intent: "unavailable", factIds: ["total"], summary: "Perdiste el empleo" }), facts));
});
test("rechaza una etiqueta que la evidencia elegida no sostiene", () => {
  // Caso real de la corrida del 2026-09-09: el modelo respondio "pending" a una
  // pregunta de comparacion y eligio el total y dos categorias. El encabezado
  // decia "esto permanece pendiente" sobre hechos ya contabilizados.
  assert.throws(
    () =>
      renderIntent(
        JSON.stringify({ intent: "pending", factIds: ["total", "category-1"] }),
        facts,
      ),
    /no coincide con la evidencia/,
  );
  assert.throws(
    () =>
      renderIntent(
        JSON.stringify({ intent: "recurring", factIds: ["recurring-1", "total"] }),
        facts,
      ),
    /no coincide con la evidencia/,
  );
  assert.throws(
    () =>
      renderIntent(
        JSON.stringify({ intent: "largest_categories", factIds: ["total"] }),
        facts,
      ),
    /no coincide con la evidencia/,
  );
  const ok = renderIntent(
    JSON.stringify({ intent: "changes", factIds: ["total", "category-1"] }),
    facts,
  );
  assert.match(ok.summary, /cambios/);
});

test("un traslado tiene encabezado propio y exige su propia evidencia", () => {
  const ok = renderIntent(
    JSON.stringify({ intent: "transfers", factIds: ["transfers"] }),
    facts,
  );
  assert.match(ok.summary, /no es gasto/i);
  assert.throws(
    () =>
      renderIntent(
        JSON.stringify({ intent: "transfers", factIds: ["total"] }),
        facts,
      ),
    /no coincide con la evidencia/,
  );
});

test("la temporalidad se decide por regla y recorta lo que el modelo puede elegir", async () => {
  const { timeframeHint } = await import("../server/timeframe");
  // Estas frases no admiten discusión: son de varios meses.
  for (const q of [
    "¿Cuánto llevo gastado en Restaurantes?",
    "¿En qué rubro he gastado más en los últimos tres meses?",
    "¿Cuál es mi promedio mensual en suscripciones?",
    "¿Cuánto he gastado en lo que va del año?",
  ])
    assert.equal(timeframeHint(q), "history", q);
  assert.equal(
    timeframeHint("Si aparto cien dólares al mes, ¿cuánto junto hasta fin de año?"),
    "savings",
  );
  // Una pregunta del mes no puede quedar atrapada en el historial.
  for (const q of ["¿Por qué gasté más?", "¿Qué me cobran seguido?"])
    assert.equal(timeframeHint(q), "unclear", q);
});

test("sin algo que comparar, 'changes' sale del menu del modelo", async () => {
  const { comparesPeriods } = await import("../server/timeframe");
  // Preguntas que si comparan dos periodos.
  for (const q of [
    "¿Por qué gasté más?",
    "¿Gasté menos que el mes pasado?",
    "¿Por qué subió mi consumo?",
    "¿Cuál es la diferencia con el periodo anterior?",
  ])
    assert.equal(comparesPeriods(q), true, q);
  // Preguntas del periodo que NO comparan nada. Antes el modelo contestaba
  // "changes" a la primera de estas y el resto de la verificacion no lo veia.
  for (const q of [
    "¿En qué se me fue el dinero?",
    "¿Qué me cobran seguido?",
    "¿Cuánto moví a mi cuenta de ahorros?",
    "¿Qué tengo pendiente por cobrar?",
  ])
    assert.equal(comparesPeriods(q), false, q);
});

test("una cantidad escrita con letras tambien es una pregunta de ahorro", async () => {
  const { timeframeHint } = await import("../server/timeframe");
  // La lista corta se quedaba en "cien" y "mil". "Cincuenta" caia en historial y
  // el modelo contestaba el gasto de un rubro en vez de la proyeccion.
  for (const q of [
    "Si aparto cincuenta dólares al mes, ¿cuánto tengo en seis meses?",
    "Si guardo ochenta dólares al mes, ¿cuánto junto en tres meses?",
    "Si aparto doscientos dólares al mes, ¿cuánto junto en un año?",
    "Si ahorro cien dólares al mes, ¿cuánto junto hasta fin de año?",
  ])
    assert.equal(timeframeHint(q), "savings", q);
});
