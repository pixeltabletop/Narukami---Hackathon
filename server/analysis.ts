import {
  categories,
  contribution,
  isTransfer,
  transferCategories,
  money,
  type Dashboard,
  type Movement,
  type Fact,
} from "./domain";
export const AS_OF = "2026-09-09";
export const uniqueMovements = (rows: Movement[]): Movement[] => {
  const seen = new Map<string, Movement>();
  for (const row of rows) {
    if (!Number.isSafeInteger(row.amountCents) || row.amountCents < 0)
      throw new Error("Importe inválido");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date) || Number.isNaN(Date.parse(row.date + "T00:00:00Z")))
      throw new Error("Fecha inválida");
    const [year, month, day] = row.date.split("-").map(Number);
    if (new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) !== row.date)
      throw new Error("Fecha inválida");
    if (!categories.includes(row.category)) throw new Error("Categoría inválida");
    const key = row.customerId + ":" + row.id,
      prior = seen.get(key);
    if (prior && JSON.stringify(prior) !== JSON.stringify(row))
      throw new Error("Identificador duplicado con datos distintos");
    seen.set(key, row);
  }
  return [...seen.values()];
};
export const analyze = (
  source: Movement[],
  customerId: string,
  period: string,
  asOf = AS_OF,
): Dashboard => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period) || period > asOf.slice(0, 7))
    throw new Error("Período inválido");
  const rows = uniqueMovements(
    source.filter((m) => m.customerId === customerId),
  );
  if (rows.some((m) => m.currency !== "USD"))
    throw new Error("Moneda no admitida");
  const [year, month] = period.split("-").map(Number);
  const previousPeriod = new Date(Date.UTC(year, month - 2, 1))
    .toISOString()
    .slice(0, 7);
  const cutoff = period === asOf.slice(0, 7) ? Number(asOf.slice(8)) : 31;
  const inMonth = (m: Movement, p: string) =>
    m.date.startsWith(p) && Number(m.date.slice(8)) <= cutoff && m.date <= asOf;
  const current = rows.filter((m) => inMonth(m, period)),
    previous = rows.filter((m) => inMonth(m, previousPeriod));
  const sum = (list: Movement[]) =>
    list.reduce((n, m) => n + contribution(m), 0);
  const total = sum(current),
    previousTotal = sum(previous);
  const hasComparison = previous.length > 0;
  const amounts = categories
    .filter((name) => !isTransfer(name))
    .map((name) => {
      const a = current.filter((m) => m.category === name),
        b = previous.filter((m) => m.category === name);
      return {
        name,
        current: sum(a),
        previous: sum(b),
        difference: sum(a) - sum(b),
        movementIds: [...a, ...b]
          .filter((m) => contribution(m) !== 0)
          .map((m) => m.id),
      };
    })
    .sort((a, b) => b.current - a.current);
  if (amounts.reduce((n, category) => n + category.current, 0) !== total)
    throw new Error("El total no coincide con sus categorías");
  const facts: Fact[] = [
    {
      id: "total",
      text:
        "Gasto neto contabilizado: " +
        money(total) +
        ". Período comparado: " +
        money(previousTotal) +
        ". Diferencia: " +
        money(total - previousTotal) +
        ".",
      cents: [total, previousTotal, total - previousTotal],
      movementIds: [...current, ...previous]
        .filter((m) => contribution(m) !== 0)
        .map((m) => m.id),
    },
  ];
  for (const cat of amounts)
    if (cat.current !== 0 || cat.previous !== 0)
      facts.push({
        id: "category-" + categories.indexOf(cat.name),
        text:
          cat.name +
          ": " +
          money(cat.current) +
          " frente a " +
          money(cat.previous) +
          ". Diferencia: " +
          money(cat.difference) +
          ".",
        cents: [cat.current, cat.previous, cat.difference],
        movementIds: cat.movementIds,
        category: cat.name,
      });
  if (!hasComparison) {
    for (const fact of facts) {
      fact.text =
        fact.text.split(" frente a ")[0].split(". Período comparado:")[0] +
        ". No hay datos anteriores suficientes para comparar.";
      fact.cents = fact.cents.slice(0, 1);
    }
  }
  const recurring: Dashboard["recurring"] = [];
  const merchants = [
    ...new Set(
      current
        .filter((m) => m.type === "purchase" && m.status === "posted")
        .map((m) => m.merchant),
    ),
  ];
  for (const merchant of merchants) {
    const a = current.filter(
      (m) =>
        m.merchant === merchant &&
        m.type === "purchase" &&
        m.status === "posted",
    );
    const b = previous.filter(
      (m) =>
        m.merchant === merchant &&
        m.type === "purchase" &&
        m.status === "posted",
    );
    if (
      a.length !== 1 ||
      b.length !== 1 ||
      Math.abs(Number(a[0].date.slice(8)) - Number(b[0].date.slice(8))) > 3
    )
      continue;
    if (!["Suscripciones", "Servicios básicos"].includes(a[0].category))
      continue;
    const item = {
      merchant,
      amount: a[0].amountCents,
      previousAmount: b[0].amountCents,
      movementIds: [a[0].id, b[0].id],
    };
    recurring.push(item);
    facts.push({
      id: "recurring-" + recurring.length,
      text:
        "Posible cargo recurrente de " +
        merchant +
        ": " +
        money(item.amount) +
        "; cargo anterior " +
        money(item.previousAmount) +
        ". Dos períodos no confirman una suscripción.",
      cents: [item.amount, item.previousAmount],
      movementIds: item.movementIds,
    });
  }
  const pending = current
    .filter((m) => m.status === "pending")
    .reduce((n, m) => n + m.amountCents, 0);
  const refunds = -current
    .filter((m) => ["refund", "reversal"].includes(m.type))
    .reduce((n, m) => n + contribution(m), 0);
  const payments = current
    .filter((m) => m.type === "payment" && m.status === "posted")
    .reduce((n, m) => n + m.amountCents, 0);
  if (pending)
    facts.push({
      id: "pending",
      text:
        money(pending) +
        " en movimientos pendientes, separados del gasto contabilizado.",
      cents: [pending],
      movementIds: current
        .filter((m) => m.status === "pending")
        .map((m) => m.id),
    });
  if (refunds)
    facts.push({
      id: "refunds",
      text:
        money(refunds) +
        " en devoluciones y reversos contabilizados reducen el gasto neto.",
      cents: [refunds],
      movementIds: current
        .filter(
          (m) =>
            ["refund", "reversal"].includes(m.type) && m.status === "posted",
        )
        .map((m) => m.id),
    });
  if (payments)
    facts.push({
      id: "payments",
      text: money(payments) + " en pagos de tarjeta. Son abonos y no compras.",
      cents: [payments],
      movementIds: current
        .filter((m) => m.type === "payment" && m.status === "posted")
        .map((m) => m.id),
    });
  // Los traslados se miden en bruto: su contribucion al gasto es cero, asi que
  // sumarlos con contribution() daria siempre cero y el cliente no los veria.
  const transfers = transferCategories
    .map((name) => {
      const rows = current.filter(
        (m) =>
          m.category === name && m.status === "posted" && m.type !== "payment",
      );
      return {
        name,
        amount: rows.reduce((n, m) => n + m.amountCents, 0),
        movementIds: rows.map((m) => m.id),
      };
    })
    .filter((row) => row.amount > 0);
  const transfersTotal = transfers.reduce((n, row) => n + row.amount, 0);
  if (transfersTotal)
    facts.push({
      id: "transfers",
      text:
        money(transfersTotal) +
        " se movió entre cuentas propias o salió como efectivo. No es gasto: es dinero tuyo en otro lugar.",
      cents: [transfersTotal],
      movementIds: transfers.flatMap((row) => row.movementIds),
    });
  return {
    transfers,
    transfersTotal,
    period,
    previousPeriod,
    hasComparison,
    cutoff,
    total,
    previousTotal,
    difference: total - previousTotal,
    pending,
    refunds,
    payments,
    purchases: current
      .filter((m) => ["purchase", "fee"].includes(m.type))
      .reduce((n, m) => n + contribution(m), 0),
    categories: amounts,
    movements: current.sort((a, b) => b.date.localeCompare(a.date)),
    evidence: [...current, ...previous],
    facts,
    recurring,
  };
};
