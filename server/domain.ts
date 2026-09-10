// Una categoria no solo agrupa: declara si el dinero se consumio o solo cambio
// de lugar. Una transferencia entre cuentas propias o un retiro de efectivo
// mueven saldo sin que exista un gasto, y sumarlos infla el consumo del mes.
export const categoryCatalog = {
  Supermercado: "gasto",
  Restaurantes: "gasto",
  Transporte: "gasto",
  "Servicios básicos": "gasto",
  Suscripciones: "gasto",
  Compras: "gasto",
  Salud: "gasto",
  Educación: "gasto",
  Hogar: "gasto",
  "Alquiler y arriendos": "gasto",
  Seguros: "gasto",
  "Impuestos y tasas": "gasto",
  Proveedores: "gasto",
  "Servicios profesionales": "gasto",
  "Marketing y publicidad": "gasto",
  Viajes: "gasto",
  "Pago de préstamo": "gasto",
  "Transferencia entre cuentas": "traslado",
  "Retiro de efectivo": "traslado",
  "Sin clasificar": "gasto",
} as const satisfies Record<string, "gasto" | "traslado">;
export const categories = Object.keys(categoryCatalog) as unknown as readonly [
  Category,
  ...Category[],
];
export type Category = keyof typeof categoryCatalog;
export type CategoryNature = (typeof categoryCatalog)[Category];
export const natureOf = (category: Category): CategoryNature =>
  categoryCatalog[category];
export const isTransfer = (category: Category) =>
  categoryCatalog[category] === "traslado";
export const transferCategories = (
  Object.keys(categoryCatalog) as Category[]
).filter(isTransfer);
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
  // Movidas que salieron de la cuenta sin ser consumo. Se muestran aparte para
  // que el cliente vea que no se perdieron, solo cambiaron de lugar.
  transfers: {
    name: Category;
    amount: number;
    movementIds: string[];
  }[];
  transfersTotal: number;
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
  // El traslado sale de la cuenta pero no se consumio: sigue siendo dinero del
  // cliente en otro lugar. Contarlo como gasto es el error clasico.
  if (isTransfer(m.category)) return 0;
  return ["refund", "reversal"].includes(m.type)
    ? -m.amountCents
    : m.amountCents;
};
