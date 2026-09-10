// Veredicto de memoria antes de descargar nada.
//
// El SDK expone `assessModelFit`, que estima si un modelo cabe en este equipo
// sin bajar un solo byte de pesos. Aquí se traduce esa respuesta a una frase
// que el cliente pueda leer, con una regla que no se negocia: `unknown` es una
// respuesta legítima y se muestra como tal. Decir "entra" sin evidencia sería
// prometer una carga de dos gigabytes que puede terminar en un cuelgue.
export type FitVerdict = "likely-fits" | "likely-too-large" | "unknown";

/** Lo que devuelve `assessModelFit`, reducido a lo que esta pantalla usa. */
export type FitAssessment = {
  verdict: FitVerdict;
  budget?: { availableAfterReserveBytes: number };
  models: {
    name: string;
    verdict: FitVerdict;
    reasons: string[];
    estimate?: { lowerBoundBytes: number; upperBoundBytes: number };
  }[];
  reasons: string[];
  assumptions: string[];
};

export type FitCandidate = {
  key: string;
  label: string;
  /** Tamaño de la descarga inicial, si el catálogo lo declara. */
  downloadBytes: number | null;
};

export type ModelFitReport = {
  verdict: FitVerdict;
  headline: string;
  freeBytes: number | null;
  /** Ya formateado aqui para que la pantalla no importe codigo del servidor. */
  freeLabel: string | null;
  models: {
    key: string;
    label: string;
    verdict: FitVerdict;
    line: string;
    reasons: string[];
  }[];
  /** Solo cuando el elegido no entra y otro candidato sí. */
  suggestion: string | null;
  /** Por qué el SDK contestó lo que contestó. Se conserva sin traducir. */
  reasons: string[];
  /** Sobre qué se apoya la estimación: respaldo, calibración, supuestos. */
  assumptions: string[];
};

export const formatBytes = (bytes: number) =>
  bytes >= 1_000_000_000
    ? (bytes / 1_000_000_000).toFixed(1).replace(".", ",") + " GB"
    : Math.round(bytes / 1_000_000) + " MB";

const verdictWord: Record<FitVerdict, string> = {
  "likely-fits": "entra",
  "likely-too-large": "no entra",
  unknown: "sin veredicto",
};

export function summarizeFit(
  assessment: FitAssessment,
  candidates: FitCandidate[],
  chosenKey: string,
): ModelFitReport {
  // Un candidato que el SDK no evaluó no se aprueba por omisión.
  const byName = new Map(assessment.models.map((m) => [m.name, m]));
  const models = candidates.map((c) => {
    const found = byName.get(c.key);
    const verdict = found?.verdict ?? "unknown";
    const size = c.downloadBytes
      ? " · descarga " + formatBytes(c.downloadBytes)
      : "";
    // Cuando el SDK no se atreve a dar veredicto, el rango estimado es lo
    // unico accionable que queda: con el, el cliente decide por su cuenta.
    const need = found?.estimate
      ? " · pide entre " +
        formatBytes(found.estimate.lowerBoundBytes) +
        " y " +
        formatBytes(found.estimate.upperBoundBytes)
      : "";
    return {
      key: c.key,
      label: c.label,
      verdict,
      line: c.label + size + need + " · " + verdictWord[verdict],
      reasons: found?.reasons ?? [],
    };
  });
  const chosen = models.find((m) => m.key === chosenKey) ?? models[0];
  const name = chosen?.label ?? chosenKey;
  const headline =
    chosen?.verdict === "likely-fits"
      ? "Este equipo debería con " + name + "."
      : chosen?.verdict === "likely-too-large"
        ? "Este equipo se queda corto para " + name + "."
        : "No hay evidencia para decidir si " + name + " cabe en este equipo.";
  const alternative =
    chosen?.verdict === "likely-too-large"
      ? models.find((m) => m.key !== chosen.key && m.verdict === "likely-fits")
      : undefined;
  const freeBytes = assessment.budget?.availableAfterReserveBytes ?? null;
  return {
    verdict: chosen?.verdict ?? "unknown",
    headline,
    freeBytes,
    freeLabel: freeBytes === null ? null : formatBytes(freeBytes),
    models,
    suggestion: alternative
      ? "Levanta la aplicación con CHEN_QVAC_MODEL=" +
        alternative.key +
        " para usar " +
        alternative.label +
        "."
      : // Ningún candidato entra: el camino no es cambiar de modelo sino
        // liberar memoria. Ya pasó una vez en este proyecto, con otro worker
        // reteniendo cuatro gigabytes.
        chosen?.verdict === "likely-too-large"
        ? "Cierra las aplicaciones que estén ocupando memoria y vuelve a medir."
        : null,
    reasons: assessment.reasons,
    assumptions: assessment.assumptions,
  };
}
