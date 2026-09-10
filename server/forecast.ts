// Proyección de saldo día a día. No se usan cubos mensuales a propósito: la
// pregunta "¿llego al próximo pago?" se decide en un día concreto, y un
// promedio mensual esconde exactamente el día en que la cuenta se queda corta.
import type { AccountMovement, Commitment } from "./planning-domain";
import { money } from "./domain";

export type IncomeShape = "mensual" | "quincenal" | "irregular" | "desconocido";

export type IncomePattern = {
  shape: IncomeShape;
  // Días del mes en que suele entrar el dinero. Vacío si es irregular.
  daysOfMonth: number[];
  eventsObserved: number;
  monthsObserved: number;
  averageEventCents: number;
  monthlyAverageCents: number;
  // Solo para ingresos irregulares: cuánto entra por día en promedio.
  dailyProrationCents: number;
  variation: number;
  confidence: "alta" | "media" | "baja";
  explanation: string;
};

export type ForecastEvent = {
  label: string;
  amountCents: number;
  direction: "income" | "expense";
  origin: "ingreso" | "compromiso" | "recurrente" | "variable";
};

export type ForecastDay = {
  date: string;
  openingCents: number;
  closingCents: number;
  events: ForecastEvent[];
};

export type Forecast = {
  asOf: string;
  startingCents: number;
  income: IncomePattern;
  nextIncomeDate: string | null;
  nextIncomeCents: number;
  endOfMonth: string;
  horizon: string;
  days: ForecastDay[];
  dailyVariableCents: number;
  lowestCents: number;
  lowestDate: string;
  firstNegativeDate: string | null;
  shortfallCents: number;
  reachesNextIncome: boolean;
  reachesEndOfMonth: boolean;
  balanceAtNextIncomeCents: number | null;
  balanceAtEndOfMonthCents: number;
  // Días que aguanta el saldo si no entra ni un cobro más. Para un ingreso
  // irregular esta es la pregunta real; el prorrateo por sí solo la esconde.
  runwayDays: number;
  runwayEndsDate: string | null;
  verdict: string;
  advice: string;
  assumptions: string[];
};

const day = 86400000;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const parse = (date: string) => Date.parse(date + "T00:00:00Z");
const lastDayOfMonth = (date: string) => {
  const [year, month] = date.split("-").map(Number);
  return iso(Date.UTC(year, month, 0));
};
const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

/** Clasifica cómo cobra la persona a partir de lo que ya ocurrió. */
export const detectIncomePattern = (
  movements: AccountMovement[],
  asOf: string,
): IncomePattern => {
  const events = movements
    .filter(
      (m) =>
        m.direction === "income" &&
        m.kind === "salary" &&
        m.status === "posted" &&
        m.date < asOf,
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const months = [...new Set(events.map((m) => m.date.slice(0, 7)))];
  if (events.length < 2 || months.length === 0)
    return {
      shape: "desconocido",
      daysOfMonth: [],
      eventsObserved: events.length,
      monthsObserved: months.length,
      averageEventCents: 0,
      monthlyAverageCents: 0,
      dailyProrationCents: 0,
      variation: 0,
      confidence: "baja",
      explanation:
        "No hay suficientes ingresos registrados para reconocer un patrón. La proyección no supone ningún ingreso futuro.",
    };
  const total = events.reduce((n, m) => n + m.amountCents, 0);
  const averageEventCents = Math.round(total / events.length);
  const monthlyAverageCents = Math.round(total / months.length);
  const perMonth = months.map(
    (month) => events.filter((m) => m.date.startsWith(month)).length,
  );
  const amounts = events.map((m) => m.amountCents);
  // Cuánto se aparta cada pago del promedio. Un sueldo fijo ronda cero; una
  // facturación por proyecto se dispara.
  const variation =
    averageEventCents === 0
      ? 0
      : Math.round(
          (Math.sqrt(
            amounts.reduce(
              (n, value) => n + (value - averageEventCents) ** 2,
              0,
            ) / amounts.length,
          ) /
            averageEventCents) *
            100,
        ) / 100;
  const days = [...new Set(events.map((m) => Number(m.date.slice(8))))].sort(
    (a, b) => a - b,
  );
  const sameCount = perMonth.every((count) => count === perMonth[0]);
  // Fechas parejas: dos pagos al mes que caen siempre cerca de los mismos días.
  const tightDays = days.length <= perMonth[0] + 1;
  const regularAmount = variation <= 0.18;
  let shape: IncomeShape = "irregular";
  if (sameCount && tightDays && regularAmount)
    shape = perMonth[0] === 1 ? "mensual" : "quincenal";
  const spanDays =
    Math.round(
      (parse(events[events.length - 1].date) - parse(events[0].date)) / day,
    ) || 1;
  const dailyProrationCents = Math.round(total / Math.max(spanDays, 1));
  const confidence =
    shape === "irregular"
      ? months.length >= 3
        ? "media"
        : "baja"
      : months.length >= 3
        ? "alta"
        : "media";
  const explanation =
    shape === "quincenal"
      ? "Cobras dos veces al mes, alrededor de los días " +
        days.join(" y ") +
        ", por " +
        money(averageEventCents) +
        " en promedio."
      : shape === "mensual"
        ? "Cobras una vez al mes, alrededor del día " +
          days[0] +
          ", por " +
          money(averageEventCents) +
          " en promedio."
        : "Tus ingresos son irregulares: varían " +
          Math.round(variation * 100) +
          "% entre un pago y otro. La proyección los reparte como " +
          money(dailyProrationCents) +
          " por día en lugar de apostar a una fecha.";
  return {
    shape,
    daysOfMonth: shape === "irregular" ? [] : days,
    eventsObserved: events.length,
    monthsObserved: months.length,
    averageEventCents,
    monthlyAverageCents,
    dailyProrationCents,
    variation,
    confidence,
    explanation,
  };
};

type Recurring = { label: string; dayOfMonth: number; amountCents: number };

/** Gastos de cuenta que se repiten mes a mes, con su día y su importe típico. */
export const detectRecurringExpenses = (
  movements: AccountMovement[],
  asOf: string,
): Recurring[] => {
  const past = movements.filter(
    (m) => m.direction === "expense" && m.status === "posted" && m.date < asOf,
  );
  const groups = new Map<string, AccountMovement[]>();
  for (const row of past) {
    const key = normalize(row.description);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const out: Recurring[] = [];
  for (const rows of groups.values()) {
    const months = new Set(rows.map((m) => m.date.slice(0, 7)));
    if (months.size < 2) continue;
    out.push({
      label: rows[0].description,
      dayOfMonth: median(rows.map((m) => Number(m.date.slice(8)))),
      amountCents: median(rows.map((m) => m.amountCents)),
    });
  }
  return out.sort((a, b) => a.dayOfMonth - b.dayOfMonth);
};

export const buildForecast = (input: {
  asOf: string;
  balanceCents: number;
  pendingCents: number;
  variableBudgetCents: number;
  movements: AccountMovement[];
  commitments: Commitment[];
  horizon?: string;
}): Forecast => {
  const { asOf } = input;
  const endOfMonth = lastDayOfMonth(asOf);
  const income = detectIncomePattern(input.movements, asOf);
  const recurring = detectRecurringExpenses(input.movements, asOf);
  // Un compromiso confirmado manda sobre la serie detectada con el mismo
  // nombre: si no, el mismo recibo se descuenta dos veces en el mismo mes.
  const activeCommitments = input.commitments.filter(
    (c) => c.state === "confirmed" && c.settlement === "cuenta" && c.dueDate > asOf,
  );
  const committedNames = new Set(
    activeCommitments.map((c) => normalize(c.name)),
  );
  const overlaps = (label: string) => {
    const key = normalize(label);
    for (const name of committedNames)
      if (key.includes(name) || name.includes(key)) return true;
    return false;
  };

  // El horizonte llega al menos a fin de mes y, si el próximo pago cae después,
  // hasta ese pago: la pregunta del cliente es siempre una de las dos.
  const incomeDatesIn = (from: string, to: string) => {
    if (income.shape === "irregular" || income.shape === "desconocido") return [];
    const dates: string[] = [];
    for (let ms = parse(from) + day; ms <= parse(to); ms += day) {
      const date = iso(ms);
      const dom = Number(date.slice(8));
      const isLast = date === lastDayOfMonth(date);
      // Un pago fijado al 30 o al 31 cae el último día en los meses cortos.
      if (
        income.daysOfMonth.includes(dom) ||
        (isLast && income.daysOfMonth.some((d) => d > dom))
      )
        dates.push(date);
    }
    return dates;
  };
  const lookahead = iso(parse(endOfMonth) + 45 * day);
  const upcoming = incomeDatesIn(asOf, lookahead);
  const nextIncomeDate = upcoming[0] ?? null;
  const horizon =
    input.horizon ??
    (nextIncomeDate && nextIncomeDate > endOfMonth ? nextIncomeDate : endOfMonth);
  const totalDays = Math.max(
    1,
    Math.round((parse(horizon) - parse(asOf)) / day),
  );
  // El presupuesto variable se estira hasta el próximo pago, que es el tramo que
  // tiene que cubrir. Si no hay pago a la vista, se estira hasta el horizonte.
  const variableSpan = Math.max(
    1,
    Math.round(
      (parse(nextIncomeDate ?? horizon) - parse(asOf)) / day,
    ),
  );
  const dailyVariableCents = Math.round(
    input.variableBudgetCents / variableSpan,
  );

  const days: ForecastDay[] = [];
  let balance = input.balanceCents - input.pendingCents;
  let lowestCents = balance;
  let lowestDate = asOf;
  let firstNegativeDate: string | null = balance < 0 ? asOf : null;
  for (let i = 1; i <= totalDays; i += 1) {
    const date = iso(parse(asOf) + i * day);
    const opening = balance;
    const events: ForecastEvent[] = [];
    if (income.shape === "irregular" && income.dailyProrationCents > 0)
      events.push({
        label: "Ingreso prorrateado",
        amountCents: income.dailyProrationCents,
        direction: "income",
        origin: "ingreso",
      });
    if (upcoming.includes(date))
      events.push({
        label: "Ingreso previsto",
        amountCents: income.averageEventCents,
        direction: "income",
        origin: "ingreso",
      });
    for (const commitment of activeCommitments)
      if (commitment.dueDate === date)
        events.push({
          label: commitment.name,
          amountCents: commitment.amountCents,
          direction: "expense",
          origin: "compromiso",
        });
    for (const item of recurring)
      if (Number(date.slice(8)) === item.dayOfMonth && !overlaps(item.label))
        events.push({
          label: item.label,
          amountCents: item.amountCents,
          direction: "expense",
          origin: "recurrente",
        });
    if (dailyVariableCents > 0 && (!nextIncomeDate || date <= nextIncomeDate))
      events.push({
        label: "Gasto variable del día",
        amountCents: dailyVariableCents,
        direction: "expense",
        origin: "variable",
      });
    for (const event of events)
      balance +=
        event.direction === "income" ? event.amountCents : -event.amountCents;
    if (balance < lowestCents) {
      lowestCents = balance;
      lowestDate = date;
    }
    if (balance < 0 && !firstNegativeDate) firstNegativeDate = date;
    days.push({ date, openingCents: opening, closingCents: balance, events });
  }

  // Segunda pasada sin ningún ingreso: mide hasta dónde alcanza lo que ya está
  // en la cuenta, que es lo único seguro.
  let dry = input.balanceCents - input.pendingCents;
  let runwayDays = totalDays;
  let runwayEndsDate: string | null = null;
  for (const entry of days) {
    for (const event of entry.events)
      if (event.direction === "expense") dry -= event.amountCents;
    if (dry < 0) {
      runwayDays = Math.round((parse(entry.date) - parse(asOf)) / day) - 1;
      runwayEndsDate = entry.date;
      break;
    }
  }

  const at = (date: string | null) =>
    date === null
      ? null
      : (days.find((d) => d.date === date)?.closingCents ??
        days[days.length - 1]?.closingCents ??
        input.balanceCents - input.pendingCents);
  const balanceAtNextIncomeCents = at(nextIncomeDate);
  const balanceAtEndOfMonthCents =
    at(endOfMonth) ?? input.balanceCents - input.pendingCents;
  const reachesNextIncome =
    nextIncomeDate === null
      ? false
      : !days.some((d) => d.date <= nextIncomeDate && d.closingCents < 0);
  const reachesEndOfMonth = !days.some(
    (d) => d.date <= endOfMonth && d.closingCents < 0,
  );
  const shortfallCents = lowestCents < 0 ? -lowestCents : 0;
  const verdict = !nextIncomeDate
    ? reachesEndOfMonth
      ? "Llegas a fin de mes con " + money(balanceAtEndOfMonthCents) + "."
      : "No llegas a fin de mes: te faltan " + money(shortfallCents) + "."
    : reachesNextIncome
      ? "Llegas al próximo pago del " +
        nextIncomeDate +
        " con " +
        money(balanceAtNextIncomeCents ?? 0) +
        "."
      : "No llegas al próximo pago del " +
        nextIncomeDate +
        ": el " +
        firstNegativeDate +
        " te quedas corto y el punto más bajo es " +
        money(lowestCents) +
        ".";
  const advice = reachesNextIncome || (!nextIncomeDate && reachesEndOfMonth)
    ? "El margen aguanta el tramo. Si quieres apretar más, súbelo en Escenarios."
    : "Para cruzar el tramo necesitas " +
      money(shortfallCents) +
      ": baja el gasto variable diario, excluye un compromiso que puedas mover o adelanta un cobro.";
  const assumptions = [
    income.explanation,
    "El gasto variable se reparte parejo: " +
      money(dailyVariableCents) +
      " por día hasta " +
      (nextIncomeDate ?? horizon) +
      ".",
    "Los gastos recurrentes se colocan en el día del mes en que suelen ocurrir, tomado de tu historial.",
    "Un compromiso confirmado manda sobre la serie detectada con el mismo nombre para no descontar el mismo recibo dos veces.",
    "Los pendientes ya están restados del saldo de partida porque el banco los tiene retenidos.",
    "Un traspaso a tu cuenta de ahorros se proyecta como sale del historial, aunque es lo primero que podrías posponer.",
    "La autonomía sin ingresos mide cuánto aguantaría la cuenta si no entrara ningún cobro más en el horizonte.",
  ];
  return {
    runwayDays: Math.max(0, runwayDays),
    runwayEndsDate,
    asOf,
    startingCents: input.balanceCents - input.pendingCents,
    income,
    nextIncomeDate,
    nextIncomeCents: income.averageEventCents,
    endOfMonth,
    horizon,
    days,
    dailyVariableCents,
    lowestCents,
    lowestDate,
    firstNegativeDate,
    shortfallCents,
    reachesNextIncome,
    reachesEndOfMonth,
    balanceAtNextIncomeCents,
    balanceAtEndOfMonthCents,
    verdict,
    advice,
    assumptions,
  };
};
