import test from "node:test";
import assert from "node:assert/strict";
import { buildHistory, describeWindow, renderCategoryHistory, renderMerchantHistory, renderSavingsProjection, renderTopCategories } from "../server/history";
import { createFixtures } from "../server/fixtures";
import { renderIntent } from "../server/intent";

const asOf = "2026-09-09";
const movements = createFixtures();
const context = { movements, customerId: "ana", asOf };
const history = buildHistory(movements, "ana", asOf, 3);

test("la ventana declara el mes parcial en vez de disimularlo", () => {
  assert.deepEqual(history.monthsCovered, ["2026-07", "2026-08", "2026-09"]);
  assert.equal(history.partialMonth, "2026-09");
  // Promediar tres meses cuando el último va por el día 9 haría parecer que el
  // cliente gasta menos de lo que gasta. Se dice, no se esconde.
  assert.match(describeWindow(history), /va hasta el día 9/);
});

test("el historial por rubro cuadra con el total y reparte porcentajes", () => {
  const suma = history.byCategory.reduce((n, c) => n + c.cents, 0);
  assert.equal(suma, history.totalCents);
  const share = history.byCategory.reduce((n, c) => n + c.share, 0);
  assert.ok(Math.abs(share - 100) < 1.5, "los porcentajes suman aproximadamente 100");
  const traslados = history.byCategory.some((c) => c.name === "Transferencia entre cuentas");
  assert.equal(traslados, false, "un traslado no es gasto y no entra al historial");
});

test("responde cuánto se lleva gastado en un rubro con promedio y porcentaje", () => {
  const answer = renderCategoryHistory(history, "Restaurantes");
  assert.match(answer.summary, /Restaurantes/);
  assert.match(answer.summary, /promedio de/);
  assert.match(answer.summary, /% de tu gasto/);
  assert.ok(answer.movementIds.length > 0);
  const vacio = renderCategoryHistory(history, "Viajes");
  assert.match(vacio.summary, /No hay gasto registrado/);
  assert.equal(vacio.movementIds.length, 0);
});

test("responde por comercio y admite que no existe", () => {
  const answer = renderMerchantHistory(history, "Nube Música");
  assert.match(answer.summary, /Nube Música/);
  assert.match(answer.summary, /cargos/);
  assert.match(renderMerchantHistory(history, "Netflix").summary, /No encuentro cargos/);
});

test("dice en qué rubros se concentró el gasto del período", () => {
  const answer = renderTopCategories(history);
  assert.match(answer.summary, /se concentra en/);
  assert.ok(answer.movementIds.length > 0);
});

test("proyecta un ahorro fijo sin prometer rendimiento", () => {
  const answer = renderSavingsProjection(asOf, 10000, "fin_de_ano", history);
  // De septiembre a diciembre quedan tres meses completos.
  assert.match(answer.summary, /300\.00/);
  assert.match(answer.summary, /no una promesa de rendimiento/);
});

test("el modelo llena huecos tipados y la aplicación hace la aritmética", () => {
  const rubro = renderIntent(
    JSON.stringify({ intent: "category_history", factIds: [], category: "Supermercado", months: 3 }),
    [],
    context,
  );
  assert.match(rubro.summary, /Supermercado/);
  assert.equal(rubro.facts.length, 1, "la evidencia se arma con sus propios movimientos");
  const ahorro = renderIntent(
    JSON.stringify({ intent: "savings_projection", factIds: [], monthlySavingCents: 10000, horizon: "tres_meses" }),
    [],
    context,
  );
  assert.match(ahorro.summary, /300\.00/);
  // Sin el dato que necesita, la intención se rechaza en vez de responder algo.
  assert.throws(
    () => renderIntent(JSON.stringify({ intent: "category_history", factIds: [] }), [], context),
    /llegó sin el dato/,
  );
  assert.throws(
    () => renderIntent(JSON.stringify({ intent: "merchant_history", factIds: [], merchant: "Nube Música" }), []),
    /necesita el historial/,
  );
});
