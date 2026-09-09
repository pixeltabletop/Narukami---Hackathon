import test from "node:test";
import assert from "node:assert/strict";
import { LocalQvac } from "../server/qvac";
test("bloquea la carga de IA en el modo de entrega sin modelos", async () => {
  const prior = process.env.RASTRO_ENABLE_QVAC;
  process.env.RASTRO_ENABLE_QVAC = "0";
  try {
    const adapter = new LocalQvac();
    assert.equal(adapter.status, "disabled");
    await assert.rejects(adapter.load(), /Inferencia desactivada/);
    assert.equal(adapter.status, "disabled");
  } finally {
    if (prior === undefined) delete process.env.RASTRO_ENABLE_QVAC;
    else process.env.RASTRO_ENABLE_QVAC = prior;
  }
});
