import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { createAccountMovements, createCommitments, currentBalance, defaultPlan, grossNextIncome } from "./planning-fixtures";
import { calculatePlanning } from "./planning";
import type { Commitment, PlanInput, PlanningView } from "./planning-domain";

export class PlanningRepository {
  private db: DatabaseSync;
  constructor(path = "data/rastro.sqlite") {
    if (path !== ":memory:") mkdirSync("data", { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS plans (
        customer TEXT PRIMARY KEY,
        next_income_date TEXT NOT NULL,
        variable_budget_cents INTEGER NOT NULL,
        reserve_cents INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS commitments (
        id TEXT PRIMARY KEY,
        customer TEXT NOT NULL,
        name TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        due_date TEXT NOT NULL,
        state TEXT NOT NULL,
        source TEXT NOT NULL
      );
    `);
    // Bases creadas antes de que el compromiso tuviera naturaleza y forma de
    // pago. Se agregan las columnas si faltan; SQLite falla si ya existen.
    for (const column of [
      "kind TEXT NOT NULL DEFAULT 'otro'",
      "settlement TEXT NOT NULL DEFAULT 'cuenta'",
      "installment TEXT NOT NULL DEFAULT ''",
    ])
      try {
        this.db.exec("ALTER TABLE commitments ADD COLUMN " + column);
      } catch {
        // La columna ya existe. No hay nada que migrar.
      }
  }
  private seed(customerId: string) {
    const plan = defaultPlan(customerId);
    this.db.prepare("INSERT OR IGNORE INTO plans(customer,next_income_date,variable_budget_cents,reserve_cents,updated_at) VALUES(?,?,?,?,?)")
      .run(customerId, plan.nextIncomeDate, plan.variableBudgetCents, plan.reserveCents, new Date().toISOString());
    // Se insertan los nuevos y se refresca la descripcion de los que ya
    // existian, sin tocar el estado que el cliente haya elegido.
    const insert = this.db.prepare(
      "INSERT INTO commitments(id,customer,name,amount_cents,due_date,state,source,kind,settlement,installment) VALUES(?,?,?,?,?,?,?,?,?,?)" +
        " ON CONFLICT(id) DO UPDATE SET name=excluded.name, amount_cents=excluded.amount_cents, due_date=excluded.due_date, kind=excluded.kind, settlement=excluded.settlement, installment=excluded.installment",
    );
    for (const c of createCommitments(customerId))
      insert.run(c.id, c.customerId, c.name, c.amountCents, c.dueDate, c.state, c.source, c.kind, c.settlement, c.installment);
  }
  get(customerId: string): PlanningView {
    this.seed(customerId);
    const row = this.db.prepare("SELECT next_income_date,variable_budget_cents,reserve_cents FROM plans WHERE customer=?").get(customerId) as { next_income_date: string; variable_budget_cents: number; reserve_cents: number };
    const commitments = this.db.prepare("SELECT id,customer AS customerId,name,amount_cents AS amountCents,due_date AS dueDate,state,source,kind,settlement,installment FROM commitments WHERE customer=? ORDER BY due_date").all(customerId) as Commitment[];
    return calculatePlanning({
      customerId,
      balanceCents: currentBalance(customerId),
      grossNextIncomeCents: grossNextIncome(customerId),
      movements: createAccountMovements(customerId),
      commitments,
      plan: { nextIncomeDate: row.next_income_date, variableBudgetCents: row.variable_budget_cents, reserveCents: row.reserve_cents },
    });
  }
  savePlan(customerId: string, plan: PlanInput): PlanningView {
    calculatePlanning({ customerId, balanceCents: currentBalance(customerId), grossNextIncomeCents: grossNextIncome(customerId), movements: createAccountMovements(customerId), commitments: this.get(customerId).commitments, plan });
    this.db.prepare("UPDATE plans SET next_income_date=?,variable_budget_cents=?,reserve_cents=?,updated_at=? WHERE customer=?")
      .run(plan.nextIncomeDate, plan.variableBudgetCents, plan.reserveCents, new Date().toISOString(), customerId);
    return this.get(customerId);
  }
  setCommitment(customerId: string, id: string, state: Commitment["state"]): PlanningView | null {
    this.seed(customerId);
    const result = this.db.prepare("UPDATE commitments SET state=? WHERE id=? AND customer=?").run(state, id, customerId);
    return result.changes ? this.get(customerId) : null;
  }
  close() { this.db.close(); }
}
