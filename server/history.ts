// Historial acumulado por rubro y por comercio. Responde el otro tipo de
// pregunta que hace la gente: no "qué pasó este mes" sino "en qué se me ha ido
// el dinero últimamente" y "cuánto llevo gastando en esto".
import {
  categories,
  contribution,
  isTransfer,
  money,
  type Category,
  type Movement,
} from "./domain";

export type CategoryHistory = {
  name: Category;
  cents: number;
  share: number;
  monthlyAverageCents: number;
  movementIds: string[];
  months: number;
};

export type MerchantHistory = {
  merchant: string;
  category: Category;
  cents: number;
  charges: number;
  monthlyAverageCents: number;
  movementIds: string[];
};

export type History = {
  from: string;
  to: string;
  monthsCovered: string[];
  partialMonth: string | null;
  totalCents: number;
  byCategory: CategoryHistory[];
  byMerchant: MerchantHistory[];
};

const monthBefore = (period: string, back: number) => {
  const [year, month] = period.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 - back, 1)).toISOString().slice(0, 7);
};

/**
 * Ventana de los últimos `months` meses calendario hasta `asOf`, incluido el
 * mes en curso aunque esté a medias. El mes parcial se declara: promediar sin
 * decirlo haría parecer que el cliente gastó menos de lo que gasta.
 */
export const buildHistory = (
  source: Movement[],
  customerId: string,
  asOf: string,
  months: number,
): History => {
  const span = Math.min(Math.max(Math.round(months) || 3, 1), 24);
  const current = asOf.slice(0, 7);
  const first = monthBefore(current, span - 1);
  const rows = source.filter(
    (m) =>
      m.customerId === customerId &&
      m.date <= asOf &&
      m.date.slice(0, 7) >= first &&
      contribution(m) !== 0,
  );
  const monthsCovered = [...new Set(rows.map((m) => m.date.slice(0, 7)))].sort();
  const divisor = Math.max(1, monthsCovered.length);
  const totalCents = rows.reduce((n, m) => n + contribution(m), 0);
  const byCategory = categories
    .filter((name) => !isTransfer(name))
    .map((name) => {
      const of = rows.filter((m) => m.category === name);
      const cents = of.reduce((n, m) => n + contribution(m), 0);
      return {
        name,
        cents,
        share: totalCents > 0 ? Math.round((cents / totalCents) * 1000) / 10 : 0,
        monthlyAverageCents: Math.round(cents / divisor),
        movementIds: of.map((m) => m.id),
        months: new Set(of.map((m) => m.date.slice(0, 7))).size,
      };
    })
    .filter((row) => row.cents !== 0)
    .sort((a, b) => b.cents - a.cents);
  const merchants = [...new Set(rows.map((m) => m.merchant))];
  const byMerchant = merchants
    .map((merchant) => {
      const of = rows.filter((m) => m.merchant === merchant);
      const cents = of.reduce((n, m) => n + contribution(m), 0);
      return {
        merchant,
        category: of[0].category,
        cents,
        charges: of.length,
        monthlyAverageCents: Math.round(cents / divisor),
        movementIds: of.map((m) => m.id),
      };
    })
    .filter((row) => row.cents !== 0)
    .sort((a, b) => b.cents - a.cents);
  return {
    from: monthsCovered[0] ? monthsCovered[0] + "-01" : asOf,
    to: asOf,
    monthsCovered,
    partialMonth: monthsCovered.includes(current) ? current : null,
    totalCents,
    byCategory,
    byMerchant,
  };
};

const monthNames = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
export const describeWindow = (history: History) => {
  if (history.monthsCovered.length === 0) return "sin movimientos en el período";
  const label = (period: string) =>
    monthNames[Number(period.slice(5)) - 1] + " " + period.slice(0, 4);
  const span =
    history.monthsCovered.length === 1
      ? label(history.monthsCovered[0])
      : "de " +
        label(history.monthsCovered[0]) +
        " a " +
        label(history.monthsCovered[history.monthsCovered.length - 1]);
  return (
    span +
    (history.partialMonth
      ? " (" + label(history.partialMonth) + " va hasta el día " + Number(history.to.slice(8)) + ")"
      : "")
  );
};

/** Lista de comercios que el modelo puede nombrar, acotada para el esquema. */
export const merchantChoices = (history: History, limit = 18) =>
  history.byMerchant.slice(0, limit).map((row) => row.merchant);

export const renderCategoryHistory = (
  history: History,
  name: Category,
): { summary: string; movementIds: string[] } => {
  const row = history.byCategory.find((item) => item.name === name);
  if (!row || row.cents === 0)
    return {
      summary:
        "No hay gasto registrado en " +
        name +
        " " +
        describeWindow(history) +
        ".",
      movementIds: [],
    };
  return {
    summary:
      "En " +
      name +
      " llevas " +
      money(row.cents) +
      " " +
      describeWindow(history) +
      ". Es " +
      row.share +
      "% de tu gasto del período y un promedio de " +
      money(row.monthlyAverageCents) +
      " al mes.",
    movementIds: row.movementIds,
  };
};

export const renderMerchantHistory = (
  history: History,
  merchant: string,
): { summary: string; movementIds: string[] } => {
  const row = history.byMerchant.find(
    (item) => item.merchant.toLowerCase() === merchant.toLowerCase(),
  );
  if (!row)
    return {
      summary:
        "No encuentro cargos de " + merchant + " " + describeWindow(history) + ".",
      movementIds: [],
    };
  return {
    summary:
      "En " +
      row.merchant +
      " llevas " +
      money(row.cents) +
      " " +
      describeWindow(history) +
      ", repartidos en " +
      row.charges +
      (row.charges === 1 ? " cargo" : " cargos") +
      ". Promedio de " +
      money(row.monthlyAverageCents) +
      " al mes, dentro de " +
      row.category +
      ".",
    movementIds: row.movementIds,
  };
};

export const renderTopCategories = (
  history: History,
): { summary: string; movementIds: string[] } => {
  const top = history.byCategory.slice(0, 3);
  if (top.length === 0)
    return {
      summary: "No hay gasto registrado " + describeWindow(history) + ".",
      movementIds: [],
    };
  const list = top
    .map(
      (row) =>
        row.name + " con " + money(row.cents) + " (" + row.share + "%)",
    )
    .join(", ");
  return {
    summary:
      "Tu gasto " +
      describeWindow(history) +
      " suma " +
      money(history.totalCents) +
      " y se concentra en " +
      list +
      ". El primero promedia " +
      money(top[0].monthlyAverageCents) +
      " al mes.",
    movementIds: top.flatMap((row) => row.movementIds),
  };
};

export type SavingsHorizon =
  | "fin_de_ano"
  | "tres_meses"
  | "seis_meses"
  | "doce_meses";

const horizonLabels: Record<SavingsHorizon, string> = {
  fin_de_ano: "hasta fin de año",
  tres_meses: "en tres meses",
  seis_meses: "en seis meses",
  doce_meses: "en doce meses",
};

/** Cuántos meses completos quedan hasta el horizonte pedido. */
export const monthsUntil = (asOf: string, horizon: SavingsHorizon) => {
  if (horizon === "tres_meses") return 3;
  if (horizon === "seis_meses") return 6;
  if (horizon === "doce_meses") return 12;
  return 12 - Number(asOf.slice(5, 7));
};

export const renderSavingsProjection = (
  asOf: string,
  monthlyCents: number,
  horizon: SavingsHorizon,
  history: History,
): { summary: string; movementIds: string[] } => {
  const months = monthsUntil(asOf, horizon);
  if (months <= 0)
    return {
      summary:
        "Ya estás en el último mes del año, así que no queda un tramo completo por delante para esa proyección.",
      movementIds: [],
    };
  const total = monthlyCents * months;
  const monthlySpend =
    history.monthsCovered.length > 0
      ? Math.round(history.totalCents / history.monthsCovered.length)
      : 0;
  const weight =
    monthlySpend > 0
      ? " Equivale al " +
        Math.round((monthlyCents / monthlySpend) * 100) +
        "% de lo que gastas en un mes promedio."
      : "";
  return {
    summary:
      "Apartando " +
      money(monthlyCents) +
      " cada mes juntarías " +
      money(total) +
      " " +
      horizonLabels[horizon] +
      ": son " +
      months +
      (months === 1 ? " mes" : " meses") +
      " de aportes." +
      weight +
      " Es aritmética sobre el monto que dijiste, no una promesa de rendimiento.",
    movementIds: [],
  };
};
