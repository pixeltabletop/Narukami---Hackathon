export const categories = [
  "Supermercado",
  "Restaurantes",
  "Transporte",
  "Servicios",
  "Compras",
  "Salud",
  "Sin clasificar",
] as const;
export type Category = (typeof categories)[number];
export type Movement = {
  id: string;
  customerId: string;
  cardId: string;
  date: string;
  description: string;
  merchant: string;
  amountCents: number;
  currency: "USD";
  type: "purchase" | "refund" | "payment" | "fee" | "reversal";
  status: "posted" | "pending" | "void";
  category: Category;
};
export type Fact = {
  id: string;
  text: string;
  cents: number[];
  movementIds: string[];
  category?: Category;
};
export type Dashboard = {
  period: string;
  previousPeriod: string;
  hasComparison: boolean;
  cutoff: number;
  total: number;
  previousTotal: number;
  difference: number;
  pending: number;
  purchases: number;
  refunds: number;
  payments: number;
  categories: {
    name: Category;
    current: number;
    previous: number;
    difference: number;
    movementIds: string[];
  }[];
  movements: Movement[];
  evidence: Movement[];
  facts: Fact[];
  recurring: {
    merchant: string;
    amount: number;
    previousAmount: number;
    movementIds: string[];
  }[];
};
export const money = (cents: number) =>
  new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
export const contribution = (m: Movement): number => {
  if (m.status !== "posted" || m.type === "payment") return 0;
  return ["refund", "reversal"].includes(m.type)
    ? -m.amountCents
    : m.amountCents;
};
