import test from "node:test";
import assert from "node:assert/strict";
import { analyze, uniqueMovements } from "../server/analysis";
import { createFixtures } from "../server/fixtures";
import { MovementRepository } from "../server/repository";
import { validateAnswer } from "../server/answer-validator";
const source = createFixtures();
test("gasto neto y comparación MTD con importes conocidos", () => {
  const d = analyze(source, "ana", "2026-09");
  assert.equal(d.total, 35398);
  assert.equal(d.previousTotal, 21193);
  assert.equal(d.difference, 14205);
  assert.equal(d.pending, 3200);
  assert.equal(d.payments, 50000);
  assert.equal(d.refunds, 4000);
  assert.equal(
    d.categories.reduce((sum, c) => sum + c.current, 0),
    d.total,
  );
});
test("no cuenta pendientes, anulados ni pagos como compras", () => {
  const d = analyze(source, "ana", "2026-09");
  const excluded = new Set(
    d.movements
      .filter((m) => m.status !== "posted" || m.type === "payment")
      .map((m) => m.id),
  );
  assert.ok(
    d.facts
      .find((f) => f.id === "total")!
      .movementIds.every((id) => !excluded.has(id)),
  );
});
test("comparación de mes completo y aislamiento por cliente", () => {
  const d = analyze(source, "luis", "2026-08");
  assert.equal(d.cutoff, 31);
  assert.ok(d.evidence.every((m) => m.customerId === "luis"));
  assert.ok(d.evidence.some((m) => m.date.endsWith("-27")));
  const ana = analyze(source, "ana", "2026-09");
  assert.ok(ana.evidence.every((m) => m.customerId === "ana"));
  assert.notEqual(ana.total, d.total);
});
test("deduplica registros idénticos y rechaza duplicados contradictorios", () => {
  assert.equal(uniqueMovements([source[0], source[0]]).length, 1);
  assert.throws(() =>
    uniqueMovements([source[0], { ...source[0], amountCents: 2 }]),
  );
  assert.throws(() => uniqueMovements([{ ...source[0], amountCents: 1.1 }]));
});
test("rechaza períodos inválidos y futuros", () => {
  for (const p of ["2026-13", "2026-9", "2026-10", "otro"])
    assert.throws(() => analyze(source, "ana", p));
});
test("rechaza fechas imposibles y categorías fuera del catálogo", () => {
  assert.throws(() => uniqueMovements([{ ...source[0], date: "2026-08-00" }]));
  assert.throws(() => uniqueMovements([{ ...source[0], category: "Inventada" as never }]));
});
test("recurrencias conservan evidencia de ambos períodos y cambios de importe", () => {
  const d = analyze(source, "ana", "2026-09"),
    r = d.recurring.find((r) => r.merchant === "Cine en casa")!;
  assert.equal(r.amount, 1599);
  assert.equal(r.previousAmount, 1299);
  assert.equal(r.movementIds.length, 2);
  assert.ok(!d.recurring.some((r) => r.merchant === "Mercado del barrio"));
});
test("corrección persiste, respeta cliente y no cambia gasto total", () => {
  const repo = new MovementRepository(":memory:");
  try {
    const original = repo.list("ana"),
      movement = original.find((m) => m.merchant === "Entrega Express")!;
    assert.equal(repo.correct("luis", movement.id, "Compras"), false);
    assert.equal(repo.correct("ana", movement.id, "Compras"), true);
    assert.ok(
      repo
        .list("ana")
        .filter((m) => m.merchant === "Entrega Express")
        .every((m) => m.category === "Compras"),
    );
    assert.ok(
      repo
        .list("luis")
        .filter((m) => m.merchant === "Entrega Express")
        .every((m) => m.category === "Restaurantes"),
    );
    assert.equal(analyze(repo.list("ana"), "ana", "2026-09").total, 35398);
  } finally {
    repo.close();
  }
});
test("respuesta de IA requiere evidencia existente y prosa sin cifras inventadas", () => {
  const facts = analyze(source, "ana", "2026-09").facts;
  assert.equal(
    validateAnswer(
      '{"summary":"Los restaurantes concentran el aumento.","factIds":["category-1"]}',
      facts,
    ).facts.length,
    1,
  );
  assert.throws(() =>
    validateAnswer('{"summary":"Gastaste $99999","factIds":["total"]}', facts),
  );
  assert.throws(() =>
    validateAnswer('{"summary":"Explicación","factIds":["inventado"]}', facts),
  );
  assert.throws(() =>
    validateAnswer('{"summary":"Explicación","factIds":[]}', facts),
  );
  assert.throws(() => validateAnswer("Texto inválido", facts));
});

test("no presenta ausencia de historial como gasto anterior cero", () => {
  const d = analyze(source, "ana", "2026-07");
  assert.equal(d.hasComparison, false);
  assert.ok(d.facts[0].text.includes("No hay datos anteriores"));
});

test("normaliza dígitos Unicode y valida importes contra evidencias", () => {
  const facts = analyze(source, "ana", "2026-09").facts;
  const valid = validateAnswer(
    JSON.stringify({
      summary: "Restaurantes aumentó USD ９３.０５.",
      factIds: ["category-1"],
    }),
    facts,
  );
  assert.equal(valid.summary, "Restaurantes aumentó USD 93.05.");
  assert.throws(() =>
    validateAnswer(
      JSON.stringify({
        summary: "Gastaste USD ９９９９.００.",
        factIds: ["category-1"],
      }),
      facts,
    ),
  );
  assert.throws(() =>
    validateAnswer(
      JSON.stringify({ summary: "Gastaste ۹۹۹۹.", factIds: ["category-1"] }),
      facts,
    ),
  );
});
