import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, unlinkSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MovementRepository } from "../server/repository";
test("las correcciones sobreviven al cierre y reapertura de SQLite", () => {
  const folder = mkdtempSync(join(tmpdir(), "rastro-persistence-")),
    file = join(folder, "corrections.sqlite");
  let repository: MovementRepository | undefined;
  try {
    repository = new MovementRepository(file);
    const movement = repository
      .list("ana")
      .find((m) => m.merchant === "Entrega Express")!;
    assert.equal(repository.correct("ana", movement.id, "Compras"), true);
    repository.close();
    repository = new MovementRepository(file);
    assert.ok(
      repository
        .list("ana")
        .filter((m) => m.merchant === "Entrega Express")
        .every((m) => m.category === "Compras"),
    );
    assert.ok(
      repository
        .list("luis")
        .filter((m) => m.merchant === "Entrega Express")
        .every((m) => m.category === "Restaurantes"),
    );
  } finally {
    repository?.close();
    unlinkSync(file);
    rmdirSync(folder);
  }
});
