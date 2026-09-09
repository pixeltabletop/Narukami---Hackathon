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
