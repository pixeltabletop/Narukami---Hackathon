export type AccountMovement = {
  id: string;
  customerId: string;
  date: string;
  description: string;
  amountCents: number;
  direction: "income" | "expense";
  status: "posted" | "pending";
  kind: "salary" | "transfer" | "cash" | "bill" | "card-payment" | "other";
};

export type Commitment = {
  id: string;
  customerId: string;
  name: string;
  amountCents: number;
  dueDate: string;
  state: "confirmed" | "excluded";
  source: "detected" | "manual";
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
  availableCents: number;
  recommendedSavingCents: number;
  monthlyAverageExpenseCents: number;
  averageMonthlyIncomeCents: number;
  coverageMonths: number;
  scenarios: Scenario[];
  accountMovements: AccountMovement[];
  assumptions: string[];
};
