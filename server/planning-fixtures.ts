import type {
  AccountMovement,
  Commitment,
  CommitmentKind,
  PlanInput,
  Settlement,
} from "./planning-domain";
import type { Category } from "./domain";

const customerFactor = (id: string) => (id === "ana" ? 1 : 0.72);
export const currentBalance = (id: string) => Math.round(65000 * customerFactor(id));

export const defaultPlan = (id: string): PlanInput => ({
  nextIncomeDate: "2026-09-15",
  variableBudgetCents: Math.round(14000 * customerFactor(id)),
  reserveCents: Math.round(10000 * customerFactor(id)),
});

// El salario bruto del que se descuenta lo de planilla antes de llegar.
export const grossNextIncome = (id: string) => Math.round(125000 * customerFactor(id));

type CommitmentSeed = [
  string,
  string,
  number,
  string,
  CommitmentKind,
  Settlement,
  string,
];

export const createCommitments = (customerId: string): Commitment[] => {
  const f = customerFactor(customerId);
  const seeds: CommitmentSeed[] = [
    ["electricity", "Electricidad", 4850, "2026-09-11", "servicio", "cuenta", ""],
    ["internet", "Internet residencial", 3999, "2026-09-12", "servicio", "cuenta", ""],
    ["card", "Pago de tarjeta", 12000, "2026-09-14", "tarjeta", "cuenta", ""],
    ["insurance", "Seguro vehicular Delta", 3800, "2026-09-14", "seguro", "cuenta", "cuota 7 de 12"],
    // Estos dos nunca tocan la cuenta: el empleador los retiene del salario.
    ["payroll-loan", "Préstamo personal por planilla", 18500, "2026-09-15", "prestamo", "planilla", "cuota 9 de 24"],
    ["payroll-coop", "Aporte a cooperativa", 6000, "2026-09-15", "otro", "planilla", ""],
  ];
  return seeds.map(([id, name, cents, dueDate, kind, settlement, installment]) => ({
    id: customerId + "-" + id,
    customerId,
    name,
    amountCents: Math.round(cents * f),
    dueDate,
    state: "confirmed" as const,
    source: "detected" as const,
    kind,
    settlement,
    installment,
  }));
};

export const createAccountMovements = (customerId: string): AccountMovement[] => {
  const f = customerFactor(customerId);
  const rows: AccountMovement[] = [];
  const add = (
    date: string,
    description: string,
    cents: number,
    direction: AccountMovement["direction"],
    kind: AccountMovement["kind"],
    product: AccountMovement["product"],
    category: Category,
    status: AccountMovement["status"] = "posted",
  ) =>
    rows.push({
      id: customerId + "-acct-" + (rows.length + 1),
      customerId,
      date,
      description,
      amountCents: Math.round(cents * f),
      direction,
      kind,
      product,
      category,
      status,
    });
  for (const month of ["06", "07", "08"]) {
    add(`2026-${month}-15`, "Salario neto", 125000, "income", "salary", "checking", "Sin clasificar");
    add(`2026-${month}-02`, "Alquiler", 42000, "expense", "bill", "checking", "Alquiler y arriendos");
    add(`2026-${month}-05`, "Servicios del hogar", 11800, "expense", "bill", "checking", "Servicios básicos");
    add(`2026-${month}-08`, "Pago de tarjeta", month === "08" ? 46500 : 42000, "expense", "card-payment", "checking", "Sin clasificar");
    add(`2026-${month}-12`, "Retiro en cajero", 9500, "expense", "cash", "checking", "Retiro de efectivo");
    add(`2026-${month}-16`, "Traspaso a ahorros", 15000, "expense", "transfer", "checking", "Transferencia entre cuentas");
    add(`2026-${month}-16`, "Traspaso desde cuenta corriente", 15000, "income", "transfer", "savings", "Transferencia entre cuentas");
  }
  add("2026-09-01", "Saldo transferido del período anterior", 65000, "income", "other", "checking", "Sin clasificar");
  add("2026-09-02", "Alquiler", 42000, "expense", "bill", "checking", "Alquiler y arriendos");
  add("2026-09-04", "Pago de tarjeta", 50000, "expense", "card-payment", "checking", "Sin clasificar");
  add("2026-09-05", "Traspaso a ahorros", 20000, "expense", "transfer", "checking", "Transferencia entre cuentas");
  add("2026-09-05", "Traspaso desde cuenta corriente", 20000, "income", "transfer", "savings", "Transferencia entre cuentas");
  add("2026-09-07", "Retiro en cajero", 8000, "expense", "cash", "checking", "Retiro de efectivo");
  add("2026-09-08", "Intereses ganados", 420, "income", "other", "savings", "Sin clasificar");
  add("2026-09-09", "Retención de comercio", 3200, "expense", "other", "checking", "Sin clasificar", "pending");
  return rows;
};
