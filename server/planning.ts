import type { AccountMovement, Commitment, PlanInput, PlanningView, Scenario } from "./planning-domain";

const safeCents = (value: number, label: string) => {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(label + " inválido");
  return value;
};
const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value + "T00:00:00Z"))) throw new Error("Fecha inválida");
  const [year, month, day] = value.split("-").map(Number);
  if (new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) !== value) throw new Error("Fecha inválida");
  return value;
};

export const calculatePlanning = (input: {
  customerId: string;
  asOf?: string;
  balanceCents: number;
  grossNextIncomeCents: number;
  movements: AccountMovement[];
  commitments: Commitment[];
  plan: PlanInput;
}): PlanningView => {
  const asOf = validDate(input.asOf ?? "2026-09-09");
  validDate(input.plan.nextIncomeDate);
  if (input.plan.nextIncomeDate <= asOf) throw new Error("El próximo ingreso debe ser posterior al corte");
  const balanceCents = safeCents(input.balanceCents, "Saldo");
  const variableBudgetCents = safeCents(input.plan.variableBudgetCents, "Presupuesto variable");
  const reserveCents = safeCents(input.plan.reserveCents, "Reserva");
  for (const row of input.movements) {
    safeCents(row.amountCents, "Movimiento");
    validDate(row.date);
    if (row.customerId !== input.customerId) throw new Error("Movimiento de otro cliente");
  }
  for (const commitment of input.commitments) {
    safeCents(commitment.amountCents, "Compromiso");
    validDate(commitment.dueDate);
    if (commitment.customerId !== input.customerId) throw new Error("Compromiso de otro cliente");
  }
  const pendingCents = input.movements.filter((m) => m.status === "pending" && m.direction === "expense").reduce((n, m) => n + m.amountCents, 0);
  const active = input.commitments.filter((c) => c.state === "confirmed" && c.dueDate > asOf && c.dueDate <= input.plan.nextIncomeDate);
  // Solo lo que sale de la cuenta reduce el margen de hoy. Lo que el empleador
  // retiene del salario nunca llega a la cuenta: restarlo del saldo actual
  // seria cobrarlo dos veces.
  const committedCents = active
    .filter((c) => c.settlement === "cuenta")
    .reduce((n, c) => n + c.amountCents, 0);
  const payrollCommittedCents = active
    .filter((c) => c.settlement === "planilla")
    .reduce((n, c) => n + c.amountCents, 0);
  const expectedNextIncomeCents = Math.max(
    0,
    safeCents(input.grossNextIncomeCents, "Próximo ingreso") - payrollCommittedCents,
  );
  const availableCents = balanceCents - pendingCents - committedCents - variableBudgetCents - reserveCents;
  const historic = input.movements.filter((m) => m.status === "posted" && m.date < asOf && ["2026-06", "2026-07", "2026-08"].includes(m.date.slice(0, 7)));
  const expense = historic.filter((m) => m.direction === "expense").reduce((n, m) => n + m.amountCents, 0);
  const income = historic.filter((m) => m.direction === "income").reduce((n, m) => n + m.amountCents, 0);
  const monthlyAverageExpenseCents = Math.round(expense / 3);
  const averageMonthlyIncomeCents = Math.round(income / 3);
  const capacity = Math.max(0, Math.min(availableCents, averageMonthlyIncomeCents - monthlyAverageExpenseCents));
  const recommendedSavingCents = Math.floor(capacity * 0.5 / 100) * 100;
  const candidates: Array<[Scenario["id"], string, number]> = [
    ["conservative", "Conservador", Math.floor(recommendedSavingCents * 0.6 / 100) * 100],
    ["suggested", "Sugerido", recommendedSavingCents],
    ["ambitious", "Ambicioso", Math.floor(recommendedSavingCents * 1.35 / 100) * 100],
  ];
  const scenarios = candidates.map(([id, label, savingCents]) => ({ id, label, savingCents, remainingCents: availableCents - savingCents, feasible: availableCents - savingCents >= 0 }));
  return {
    asOf, balanceCents, pendingCents, nextIncomeDate: input.plan.nextIncomeDate,
    variableBudgetCents, reserveCents, commitments: input.commitments, committedCents,
    payrollCommittedCents, expectedNextIncomeCents,
    availableCents, recommendedSavingCents, monthlyAverageExpenseCents, averageMonthlyIncomeCents,
    coverageMonths: monthlyAverageExpenseCents ? Number((Math.max(0, balanceCents - pendingCents) / monthlyAverageExpenseCents).toFixed(1)) : 0,
    scenarios,
    accountMovements: input.movements.slice().sort((a, b) => b.date.localeCompare(a.date)),
    assumptions: [
      "El saldo es una instantánea sintética al 9 de septiembre de 2026.",
      "El próximo ingreso no se suma hasta que sea recibido.",
      "Las compras de tarjeta se analizan como consumo; aquí solo cuenta el pago de tarjeta como salida de efectivo.",
      "La recomendación reserva la mitad de la capacidad histórica y nunca supera el margen disponible.",
      "Un descuento directo de planilla no reduce el saldo de hoy: se retiene del próximo salario antes de que entre a la cuenta.",
      "Una transferencia entre cuentas propias o un retiro de efectivo no son gasto: el dinero sigue siendo tuyo en otro lugar.",
    ],
  };
};
