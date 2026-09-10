import test from "node:test";
import assert from "node:assert/strict";
import { buildForecast, renderPaydayForecast } from "../server/forecast";
import { calculatePlanning, renderAvailableMargin } from "../server/planning";
import { timeframeHint } from "../server/timeframe";
import { allowedIntentsFor } from "../server/qvac";
import { renderIntent } from "../server/intent";
import {
  createAccountMovements,
  createCommitments,
  currentBalance,
  defaultPlan,
  grossNextIncome,
} from "../server/planning-fixtures";

// El asistente no tenia como contestar la pregunta mas natural que existe
// sobre dinero: si alcanza hasta el proximo pago. Los motores ya estaban
// construidos y probados; lo que faltaba era la palabra con la que pedirlos.
// Estas pruebas fijan ese cableado sin cargar ningun modelo.

const asOf = "2026-09-09";
const planningDe = (cliente: string) =>
  calculatePlanning({
    customerId: cliente,
    asOf,
    balanceCents: currentBalance(cliente),
    grossNextIncomeCents: grossNextIncome(cliente),
    movements: createAccountMovements(cliente),
    commitments: createCommitments(cliente),
    plan: defaultPlan(cliente),
  });
const forecastDe = (cliente: string) => {
  const view = planningDe(cliente);
  return buildForecast({
    asOf,
    balanceCents: view.balanceCents,
    pendingCents: view.pendingCents,
    variableBudgetCents: view.variableBudgetCents,
    movements: createAccountMovements(cliente),
    commitments: view.commitments,
  });
};

test("las preguntas que miran adelante caen en el marco de proyección", () => {
  for (const q of [
    "¿Me alcanza hasta el próximo pago?",
    "Si sigo gastando así, ¿cómo termino el mes?",
    "¿Cuánto me queda disponible después de mis compromisos?",
    "¿Cuándo se me acaba el dinero si no cobro?",
    "¿Puedo permitirme un gasto de trescientos dólares esta quincena?",
    "¿Cuánto puedo ahorrar este mes sin quedarme corto?",
  ])
    assert.equal(timeframeHint(q), "forecast", q);
});

test("una pregunta del pasado no se convierte en proyección", () => {
  for (const q of [
    "¿Cuánto gasté este mes?",
    "¿Por qué gasté más?",
    "¿Qué me cobran seguido?",
    "¿Cuánto llevo gastado en Supermercado?",
  ])
    assert.notEqual(timeframeHint(q), "forecast", q);
});

test("el ahorro con monto sigue ganándole a la proyección", () => {
  // "Si aparto cien al mes" tambien mira al futuro, pero ya tiene su intencion.
  assert.equal(
    timeframeHint("Si aparto cien dólares al mes, ¿cuánto junto hasta fin de año?"),
    "savings",
  );
});

test("en el marco de proyección el modelo solo tiene dos opciones", () => {
  const menu = allowedIntentsFor(
    "¿Me alcanza hasta el próximo pago?",
    [],
    "forecast",
    true,
  );
  assert.deepEqual(menu, ["payday_forecast", "available_margin"]);
});

test("la respuesta de proyección repite el veredicto de la pestaña", () => {
  const forecast = forecastDe("ana");
  const { summary } = renderPaydayForecast(forecast);
  // No redacta su propia version: arranca con el mismo veredicto, para que el
  // chat y la pestaña no digan cosas distintas del mismo saldo.
  assert.ok(summary.startsWith(forecast.verdict), summary);
  assert.match(summary, /aguanta \d+ d[ií]as?/);
  assert.ok(summary.endsWith(forecast.advice));
});

test("el margen se responde con la resta completa, no con el número solo", () => {
  const view = planningDe("ana");
  const { summary } = renderAvailableMargin(view);
  for (const parte of [
    "disponibles",
    "pendientes",
    "compromisos",
    "presupuesto variable",
    "reserva",
  ])
    assert.ok(summary.includes(parte), parte + " falta en: " + summary);
  assert.ok(summary.includes(view.nextIncomeDate));
});

test("el descuento de planilla se explica aparte del saldo de hoy", () => {
  const view = planningDe("ana");
  const { summary } = renderAvailableMargin(view);
  if (view.payrollCommittedCents > 0)
    assert.match(summary, /planilla no tocan este saldo/);
});

test("una intención de proyección sin plan del cliente no se inventa nada", () => {
  assert.throws(
    () =>
      renderIntent(
        JSON.stringify({ intent: "payday_forecast", factIds: [] }),
        [],
        { movements: [], customerId: "ana", asOf },
      ),
    /necesita el plan del cliente/,
  );
});

test("con el plan delante, la intención responde y no elige evidencia", () => {
  const salida = renderIntent(
    JSON.stringify({ intent: "available_margin", factIds: [] }),
    [],
    {
      movements: [],
      customerId: "ana",
      asOf,
      planning: planningDe("ana"),
      forecast: forecastDe("ana"),
    },
  );
  assert.equal(salida.intent, "available_margin");
  // Sin evidencia abrible a proposito: es una simulacion, no una seleccion de
  // movimientos. Prometer un boton que no lleva a ningun lado seria peor.
  assert.deepEqual(salida.factIds, []);
  assert.ok(salida.summary.length > 40);
});
