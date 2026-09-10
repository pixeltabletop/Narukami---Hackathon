import test from "node:test";
import assert from "node:assert/strict";
import { calculatePlanning } from "../server/planning";
import { createAccountMovements, createCommitments, currentBalance, defaultPlan, grossNextIncome } from "../server/planning-fixtures";
import { PlanningRepository } from "../server/planning-repository";

test("calcula margen sin sumar el próximo ingreso ni duplicar compras de tarjeta", () => {
  const view = calculatePlanning({ customerId: "ana", balanceCents: currentBalance("ana"), grossNextIncomeCents: grossNextIncome("ana"), movements: createAccountMovements("ana"), commitments: createCommitments("ana"), plan: defaultPlan("ana") });
  assert.equal(view.balanceCents, 65000);
  assert.equal(view.pendingCents, 3200);
  assert.equal(view.committedCents, 24649);
  assert.equal(view.availableCents, 13151);
  assert.ok(view.recommendedSavingCents <= view.availableCents);
  assert.equal(view.accountMovements.filter((m) => m.kind === "card-payment" && m.date.startsWith("2026-09")).length, 1);
});

test("escenarios son trazables y ordenados", () => {
  const view = calculatePlanning({ customerId: "ana", balanceCents: currentBalance("ana"), grossNextIncomeCents: grossNextIncome("ana"), movements: createAccountMovements("ana"), commitments: createCommitments("ana"), plan: defaultPlan("ana") });
  assert.deepEqual(view.scenarios.map((s) => s.id), ["conservative", "suggested", "ambitious"]);
  assert.ok(view.scenarios[0].savingCents <= view.scenarios[1].savingCents);
  assert.ok(view.scenarios[1].savingCents <= view.scenarios[2].savingCents);
  for (const scenario of view.scenarios) assert.equal(scenario.remainingCents, view.availableCents - scenario.savingCents);
});

test("rechaza fechas imposibles, centavos fraccionarios y mezcla de clientes", () => {
  const base = { customerId: "ana", balanceCents: 65000, grossNextIncomeCents: grossNextIncome("ana"), movements: createAccountMovements("ana"), commitments: createCommitments("ana"), plan: defaultPlan("ana") };
  assert.throws(() => calculatePlanning({ ...base, plan: { ...base.plan, nextIncomeDate: "2026-09-31" } }));
  assert.throws(() => calculatePlanning({ ...base, plan: { ...base.plan, reserveCents: 1.2 } }));
  assert.throws(() => calculatePlanning({ ...base, movements: [{ ...base.movements[0], customerId: "luis" }] }));
});

test("plan y exclusión de compromiso persisten por cliente", () => {
  const repo = new PlanningRepository(":memory:");
  try {
    const first = repo.get("ana");
    const saved = repo.savePlan("ana", { nextIncomeDate: "2026-09-18", variableBudgetCents: 12000, reserveCents: 8000 });
    assert.equal(saved.nextIncomeDate, "2026-09-18");
    const changed = repo.setCommitment("ana", first.commitments[0].id, "excluded")!;
    assert.equal(changed.commitments[0].state, "excluded");
    assert.equal(repo.get("luis").commitments.every((c) => c.state === "confirmed"), true);
  } finally { repo.close(); }
});

test("un descuento de planilla no reduce el saldo de hoy sino el próximo salario", () => {
  const view = calculatePlanning({ customerId: "ana", balanceCents: currentBalance("ana"), grossNextIncomeCents: grossNextIncome("ana"), movements: createAccountMovements("ana"), commitments: createCommitments("ana"), plan: defaultPlan("ana") });
  const planilla = view.commitments.filter((c) => c.settlement === "planilla" && c.state === "confirmed");
  assert.ok(planilla.length >= 2, "los fixtures deben traer descuentos de planilla");
  const suma = planilla.reduce((n, c) => n + c.amountCents, 0);
  assert.equal(view.payrollCommittedCents, suma);
  // El error que se evita: restar del saldo actual un dinero que el empleador
  // ya retuvo y que nunca va a entrar a la cuenta.
  assert.equal(
    view.availableCents,
    view.balanceCents - view.pendingCents - view.committedCents - view.variableBudgetCents - view.reserveCents,
  );
  assert.equal(view.expectedNextIncomeCents, grossNextIncome("ana") - suma);
  assert.ok(view.committedCents > 0 && !view.commitments.some((c) => c.settlement === "planilla" && view.committedCents === c.amountCents));
});
