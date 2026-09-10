import test from "node:test";
import assert from "node:assert/strict";
import { allowedIntentsFor } from "../server/qvac";

// Lo que el modelo puede elegir lo decide una regla, no una instrucción. Esta
// prueba fija esa regla sin cargar ningún modelo: es determinista y corre en
// milisegundos, mientras que comprobarla contra QVAC cuesta minutos y memoria.
const comercios = ["Nube Música", "Supermercado La Estrella"];

test("una pregunta del mes no puede contestarse con el historial", () => {
  const menu = allowedIntentsFor(
    "¿En qué se me fue el dinero?",
    comercios,
    "unclear",
    true,
  );
  assert.ok(menu.includes("spending_summary"));
  assert.ok(menu.includes("largest_categories"));
  for (const historia of [
    "category_history",
    "merchant_history",
    "top_categories_history",
  ])
    assert.ok(!menu.includes(historia), historia + " no debería estar");
});

test("sin algo que comparar, la intención de comparación no está en el menú", () => {
  const sinComparar = allowedIntentsFor(
    "¿En qué se me fue el dinero?",
    comercios,
    "unclear",
    true,
  );
  assert.ok(!sinComparar.includes("changes"));
  const comparando = allowedIntentsFor(
    "¿Por qué gasté más?",
    comercios,
    "unclear",
    true,
  );
  assert.ok(comparando.includes("changes"));
});

test("nombrar un comercio del cliente abre el historial por comercio", () => {
  const menu = allowedIntentsFor(
    "¿Cuánto he gastado en Nube Música?",
    comercios,
    "unclear",
    true,
  );
  assert.ok(menu.includes("merchant_history"));
  // Pero solo ese: sigue sin poder contestar con el historial por rubro.
  assert.ok(!menu.includes("category_history"));
});

test("el comercio se reconoce sin depender de los acentos", () => {
  const menu = allowedIntentsFor(
    "cuanto he gastado en nube musica",
    comercios,
    "unclear",
    true,
  );
  assert.ok(menu.includes("merchant_history"));
});

test("una pregunta de varios meses solo admite intenciones de historial", () => {
  const menu = allowedIntentsFor(
    "¿Cuánto llevo gastado en Restaurantes?",
    comercios,
    "history",
    true,
  );
  assert.deepEqual(menu, [
    "category_history",
    "merchant_history",
    "top_categories_history",
  ]);
});

test("la proyección de ahorro no deja elegir otra cosa", () => {
  assert.deepEqual(
    allowedIntentsFor("Si aparto cien dólares al mes", comercios, "savings", true),
    ["savings_projection"],
  );
});

test("sin historial cargado no se ofrece ninguna intención de varios meses", () => {
  const menu = allowedIntentsFor("¿En qué gasté?", [], "unclear", false);
  for (const historia of [
    "category_history",
    "merchant_history",
    "top_categories_history",
    "savings_projection",
  ])
    assert.ok(!menu.includes(historia), historia + " no debería estar");
});

// Los tres casos siguientes salieron de la bateria de preguntas reales del
// 2026-09-10, no de la imaginacion: el modelo fallo en los tres y la regla que
// lo permitia estaba escrita demasiado ancha.

test("un superlativo dentro del mes no es una comparacion entre meses", () => {
  const menu = allowedIntentsFor(
    "¿En qué categoría se me va más el dinero?",
    comercios,
    "unclear",
    true,
  );
  // "mas" a secas no compara nada: aqui la respuesta correcta es cual pesa mas.
  assert.ok(menu.includes("largest_categories"));
  assert.ok(!menu.includes("changes"));
});

test("comparar de verdad sigue abriendo la intencion de comparacion", () => {
  for (const q of [
    "¿Gasté más que el mes pasado?",
    "¿Por qué gasté más?",
    "¿Gasté menos que antes?",
  ])
    assert.ok(
      allowedIntentsFor(q, comercios, "unclear", true).includes("changes"),
      q,
    );
});

test("\"todos los meses\" es repeticion, no historial de varios meses", async () => {
  const { timeframeHint } = await import("../server/timeframe");
  const q = "¿Qué me están cobrando todos los meses?";
  assert.equal(timeframeHint(q), "unclear", q);
  const menu = allowedIntentsFor(q, comercios, timeframeHint(q), true);
  assert.ok(menu.includes("recurring"));
  assert.ok(!menu.includes("merchant_history"));
});

test("un historial de verdad sigue siendo historial", async () => {
  const { timeframeHint } = await import("../server/timeframe");
  for (const q of [
    "¿Cuánto he gastado en Restaurantes en los últimos tres meses?",
    "¿Cuál es mi promedio de gasto mensual?",
    "¿Cuánto llevo gastado en Supermercado?",
  ])
    assert.equal(timeframeHint(q), "history", q);
});
