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
