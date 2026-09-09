import type { AccountMovement, Commitment, PlanInput } from "./planning-domain";

const customerFactor = (id: string) => (id === "ana" ? 1 : 0.72);
export const currentBalance = (id: string) => Math.round(65000 * customerFactor(id));

export const defaultPlan = (id: string): PlanInput => ({
  nextIncomeDate: "2026-09-15",
  variableBudgetCents: Math.round(14000 * customerFactor(id)),
  reserveCents: Math.round(10000 * customerFactor(id)),
});

export const createCommitments = (customerId: string): Commitment[] => {
  const f = customerFactor(customerId);
  return [
    ["electricity", "Electricidad", 4850, "2026-09-11"],
    ["internet", "Internet residencial", 3999, "2026-09-12"],
    ["card", "Pago de tarjeta", 12000, "2026-09-14"],
  ].map(([id, name, cents, dueDate]) => ({
    id: customerId + "-" + id,
    customerId,
    name: String(name),
    amountCents: Math.round(Number(cents) * f),
    dueDate: String(dueDate),
    state: "confirmed" as const,
    source: "detected" as const,
  }));
};

export const createAccountMovements = (customerId: string): AccountMovement[] => {
  const f = customerFactor(customerId);
  const rows: AccountMovement[] = [];
  const add = (date: string, description: string, cents: number, direction: AccountMovement["direction"], kind: AccountMovement["kind"], status: AccountMovement["status"] = "posted") =>
    rows.push({ id: customerId + "-acct-" + (rows.length + 1), customerId, date, description, amountCents: Math.round(cents * f), direction, kind, status });
  for (const month of ["06", "07", "08"]) {
    add(`2026-${month}-15`, "Salario", 125000, "income", "salary");
    add(`2026-${month}-02`, "Alquiler", 42000, "expense", "bill");
    add(`2026-${month}-05`, "Servicios del hogar", 11800, "expense", "bill");
    add(`2026-${month}-08`, "Pago de tarjeta", month === "08" ? 46500 : 42000, "expense", "card-payment");
    add(`2026-${month}-12`, "Retiro y transferencias", 9500, "expense", "cash");
  }
  add("2026-09-01", "Saldo transferido del período anterior", 65000, "income", "other");
  add("2026-09-04", "Pago de tarjeta", 50000, "expense", "card-payment");
  add("2026-09-09", "Retención de comercio", 3200, "expense", "other", "pending");
  return rows;
};
