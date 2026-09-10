import test from "node:test";
import assert from "node:assert/strict";
import { buildForecast, detectIncomePattern, detectRecurringExpenses } from "../server/forecast";
import { createAccountMovements, createCommitments, currentBalance, defaultPlan } from "../server/planning-fixtures";

const asOf = "2026-09-09";

test("reconoce un cobro quincenal y uno irregular", () => {
  const ana = detectIncomePattern(createAccountMovements("ana"), asOf);
  assert.equal(ana.shape, "quincenal");
  assert.deepEqual(ana.daysOfMonth, [15, 30]);
  assert.equal(ana.confidence, "alta");
  const luis = detectIncomePattern(createAccountMovements("luis"), asOf);
  // Mismo número de cobros por mes, pero fechas y montos que se mueven: eso no
  // es una quincena, y tratarlo como tal pondría un ingreso en un día falso.
  assert.equal(luis.shape, "irregular");
  assert.deepEqual(luis.daysOfMonth, []);
  assert.ok(luis.variation > 0.2);
  assert.ok(luis.dailyProrationCents > 0);
});

test("sin historial suficiente no inventa ingresos futuros", () => {
  const pattern = detectIncomePattern([], asOf);
  assert.equal(pattern.shape, "desconocido");
  assert.equal(pattern.dailyProrationCents, 0);
  assert.match(pattern.explanation, /no supone ningún ingreso futuro/i);
});

test("detecta gastos recurrentes con su día habitual", () => {
  const rows = detectRecurringExpenses(createAccountMovements("ana"), asOf);
  const alquiler = rows.find((r) => r.label === "Alquiler");
  assert.ok(alquiler, "el alquiler se repite todos los meses");
  assert.equal(alquiler!.dayOfMonth, 2);
  assert.equal(alquiler!.amountCents, 42000);
});

test("la proyección avanza día a día y cuadra con sus eventos", () => {
  const f = buildForecast({
    asOf,
    balanceCents: currentBalance("ana"),
    pendingCents: 3200,
    variableBudgetCents: defaultPlan("ana").variableBudgetCents,
    movements: createAccountMovements("ana"),
    commitments: createCommitments("ana"),
  });
  assert.equal(f.startingCents, currentBalance("ana") - 3200);
  assert.equal(f.nextIncomeDate, "2026-09-15");
  assert.equal(f.horizon, "2026-09-30");
  assert.equal(f.days.length, 21);
  // Cada día tiene que cerrar exactamente donde lo dejan sus propios eventos.
  let running = f.startingCents;
  for (const d of f.days) {
    assert.equal(d.openingCents, running);
    for (const e of d.events)
      running += e.direction === "income" ? e.amountCents : -e.amountCents;
    assert.equal(d.closingCents, running);
  }
  assert.equal(f.balanceAtEndOfMonthCents, f.days[f.days.length - 1].closingCents);
  assert.ok(f.reachesNextIncome);
  assert.match(f.verdict, /llegas al próximo pago/);
});

test("un descuento de planilla no aparece como salida de la cuenta", () => {
  const f = buildForecast({
    asOf,
    balanceCents: currentBalance("ana"),
    pendingCents: 0,
    variableBudgetCents: 0,
    movements: createAccountMovements("ana"),
    commitments: createCommitments("ana"),
  });
  const labels = f.days.flatMap((d) => d.events.map((e) => e.label));
  assert.equal(labels.includes("Préstamo personal por planilla"), false);
  assert.equal(labels.includes("Aporte a cooperativa"), false);
  assert.ok(labels.includes("Electricidad"));
});

test("un compromiso confirmado no se cobra dos veces con su serie detectada", () => {
  const f = buildForecast({
    asOf,
    balanceCents: currentBalance("ana"),
    pendingCents: 0,
    variableBudgetCents: 0,
    movements: createAccountMovements("ana"),
    commitments: createCommitments("ana"),
  });
  const pagos = f.days.flatMap((d) =>
    d.events.filter((e) => e.label.toLowerCase().includes("pago de tarjeta")),
  );
  assert.equal(pagos.length, 1, "el pago de tarjeta se descuenta una sola vez");
});

test("un gasto variable alto empuja la cuenta a números rojos y lo dice", () => {
  const f = buildForecast({
    asOf,
    balanceCents: currentBalance("ana"),
    pendingCents: 3200,
    variableBudgetCents: 120000,
    movements: createAccountMovements("ana"),
    commitments: createCommitments("ana"),
  });
  assert.equal(f.reachesNextIncome, false);
  assert.ok(f.firstNegativeDate);
  assert.ok(f.shortfallCents > 0);
  assert.match(f.verdict, /Conviene tomar previsiones/);
  assert.match(f.advice, /días para acomodarlo/);
});

test("la autonomía sin cobrar no supone ningún ingreso", () => {
  const f = buildForecast({
    asOf,
    balanceCents: currentBalance("ana"),
    pendingCents: 3200,
    variableBudgetCents: defaultPlan("ana").variableBudgetCents,
    movements: createAccountMovements("ana"),
    commitments: createCommitments("ana"),
  });
  assert.ok(f.runwayDays >= 0);
  // Con ingresos previstos llega al próximo pago; sin ellos tiene que aguantar
  // menos días que el horizonte completo.
  assert.ok(f.reachesNextIncome);
  assert.ok(f.runwayDays < f.days.length, "sin cobrar no puede cubrir el mes");
});
