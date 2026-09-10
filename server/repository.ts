import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { createFixtures } from "./fixtures";
import type { Category, Movement } from "./domain";
export class MovementRepository {
  private db: DatabaseSync;
  private rows = createFixtures();
  constructor(path = "data/chen.sqlite") {
    if (path !== ":memory:") mkdirSync("data", { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(
      "CREATE TABLE IF NOT EXISTS corrections (customer TEXT NOT NULL, merchant TEXT NOT NULL, category TEXT NOT NULL, PRIMARY KEY(customer,merchant))",
    );
  }
  list(customerId: string): Movement[] {
    const corrections = this.db
      .prepare("SELECT merchant,category FROM corrections WHERE customer=?")
      .all(customerId) as { merchant: string; category: Category }[];
    const map = new Map(corrections.map((c) => [c.merchant, c.category]));
    return this.rows
      .filter((m) => m.customerId === customerId)
      .map((m) => ({ ...m, category: map.get(m.merchant) ?? m.category }));
  }
  correct(customerId: string, id: string, category: Category): boolean {
    const movement = this.rows.find(
      (m) => m.id === id && m.customerId === customerId,
    );
    if (!movement) return false;
    this.db
      .prepare(
        "INSERT INTO corrections(customer,merchant,category) VALUES(?,?,?) ON CONFLICT(customer,merchant) DO UPDATE SET category=excluded.category",
      )
      .run(customerId, movement.merchant, category);
    return true;
  }
  close() {
    this.db.close();
  }
}
