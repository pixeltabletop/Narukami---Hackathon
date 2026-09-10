import type { Category } from "./domain";

// El producto donde ocurrio el movimiento. La tarjeta vive en el motor de
// consumo; la cuenta corriente y la de ahorros viven aqui. Separarlos es lo
// que evita contar dos veces la misma plata.
export type Product = "credit-card" | "checking" | "savings";
export const productLabels: Record<Product, string> = {
  "credit-card": "Tarjeta de crédito",
  checking: "Cuenta corriente",
  savings: "Cuenta de ahorros",
};

export type AccountMovement = {
  id: string;
  customerId: string;
  date: string;
  description: string;
  amountCents: number;
  direction: "income" | "expense";
  status: "posted" | "pending";
  kind: "salary" | "transfer" | "cash" | "bill" | "card-payment" | "other";
  product: Exclude<Product, "credit-card">;
  category: Category;
};

// Un pasivo adquirido no es solo un monto con fecha: importa de donde sale el
// dinero. Un descuento directo de planilla nunca toca la cuenta, asi que
// restarlo del saldo disponible seria contarlo dos veces.
export type CommitmentKind =
  | "servicio"
  | "alquiler"
  | "prestamo"
  | "tarjeta"
  | "suscripcion"
  | "seguro"
  | "impuesto"
  | "otro";
export const commitmentKindLabels: Record<CommitmentKind, string> = {
  servicio: "Servicio",
  alquiler: "Alquiler",
  prestamo: "Préstamo",
  tarjeta: "Tarjeta",
  suscripcion: "Suscripción",
  seguro: "Seguro",
  impuesto: "Impuesto",
  otro: "Otro",
};
export type Settlement = "cuenta" | "planilla";

export type Commitment = {
  id: string;
  customerId: string;
  name: string;
  amountCents: number;
  dueDate: string;
  state: "confirmed" | "excluded";
  source: "detected" | "manual";
  kind: CommitmentKind;
  // "cuenta" sale del saldo actual. "planilla" se descuenta del próximo
  // ingreso antes de que llegue, y por eso no reduce el margen de hoy.
  settlement: Settlement;
  // Texto corto tipo "cuota 4 de 12". Vacío cuando no aplica.
  installment: string;
};

export type PlanInput = {
  nextIncomeDate: string;
  variableBudgetCents: number;
  reserveCents: number;
};

export type Scenario = {
  id: "conservative" | "suggested" | "ambitious";
  label: string;
  savingCents: number;
  remainingCents: number;
  feasible: boolean;
};

export type PlanningView = {
  asOf: string;
  balanceCents: number;
  pendingCents: number;
  nextIncomeDate: string;
  variableBudgetCents: number;
  reserveCents: number;
  commitments: Commitment[];
  committedCents: number;
  // Lo que se descuenta del próximo salario antes de que entre a la cuenta.
  payrollCommittedCents: number;
  expectedNextIncomeCents: number;
  availableCents: number;
  recommendedSavingCents: number;
  monthlyAverageExpenseCents: number;
  averageMonthlyIncomeCents: number;
  coverageMonths: number;
  scenarios: Scenario[];
  accountMovements: AccountMovement[];
  assumptions: string[];
};
