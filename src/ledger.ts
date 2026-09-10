// Vista unificada de movimientos. La tarjeta y las cuentas viven en motores
// distintos a proposito: el consumo se analiza en la tarjeta y el flujo de
// efectivo en la cuenta. Aqui se juntan solo para mirarlos, nunca para sumarlos.
import { contribution, isTransfer, type Category, type Movement } from "../server/domain";
import type { AccountMovement, Product } from "../server/planning-domain";

export type LedgerRow = {
  id: string;
  date: string;
  title: string;
  detail: string;
  amountCents: number;
  category: Category;
  product: Product;
  state: string;
  pending: boolean;
  // "−" resta del gasto del período (devolución, abono). "+" es dinero que
  // entra a la cuenta. Vacío es una salida normal.
  sign: "+" | "−" | "";
  credit: boolean;
  counts: boolean;
  editable: boolean;
};

const cardState = (m: Movement) =>
  m.status === "pending"
    ? "Pendiente"
    : m.status === "void"
      ? "Anulado"
      : m.type === "payment"
        ? "Pago de tarjeta"
        : m.type === "refund"
          ? "Devolución"
          : m.type === "reversal"
            ? "Reverso"
            : isTransfer(m.category)
              ? "Traslado"
              : "Compra";

export const fromCard = (m: Movement): LedgerRow => ({
  id: m.id,
  date: m.date,
  title: m.merchant,
  detail: m.description,
  amountCents: m.amountCents,
  category: m.category,
  product: "credit-card",
  state: cardState(m),
  pending: m.status === "pending",
  sign: ["refund", "reversal", "payment"].includes(m.type) ? "−" : "",
  credit: ["refund", "reversal", "payment"].includes(m.type),
  counts: contribution(m) !== 0,
  editable: true,
});

const accountState = (m: AccountMovement) =>
  m.status === "pending"
    ? "Pendiente"
    : m.kind === "salary"
      ? "Ingreso"
      : m.kind === "card-payment"
        ? "Pago de tarjeta"
        : m.kind === "transfer"
          ? "Traslado"
          : m.kind === "cash"
            ? "Retiro"
            : m.direction === "income"
              ? "Abono"
              : "Débito";

export const fromAccount = (m: AccountMovement): LedgerRow => ({
  id: m.id,
  date: m.date,
  title: m.description,
  detail: m.kind === "card-payment" ? "Abono a la tarjeta desde la cuenta" : "Movimiento de cuenta",
  amountCents: m.amountCents,
  category: m.category,
  product: m.product,
  state: accountState(m),
  pending: m.status === "pending",
  sign: m.direction === "income" ? "+" : "",
  credit: m.direction === "income",
  counts:
    m.direction === "expense" &&
    m.status === "posted" &&
    !isTransfer(m.category) &&
    m.kind !== "card-payment",
  editable: false,
});
