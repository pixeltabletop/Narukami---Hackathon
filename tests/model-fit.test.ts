import test from "node:test";
import assert from "node:assert/strict";
import { summarizeFit, type FitAssessment } from "../server/model-fit";

const candidates = [
  { key: "QWEN3_4B_INST_Q4_K_M", label: "Qwen3 4B", downloadBytes: 2_500_000_000, yaDescargado: false },
  { key: "GEMMA4_2B_MULTIMODAL_Q4_K_M", label: "Gemma4 2B", downloadBytes: 1_600_000_000, yaDescargado: false },
];

const assessment = (
  entries: [string, FitAssessment["models"][number]["verdict"]][],
  freeBytes?: number,
): FitAssessment => ({
  verdict: entries[0][1],
  ...(freeBytes === undefined
    ? {}
    : { budget: { availableAfterReserveBytes: freeBytes } }),
  models: entries.map(([name, verdict]) => ({ name, verdict, reasons: [] })),
  reasons: [],
  assumptions: [],
});

test("cuando el modelo elegido entra, lo dice y no propone cambiarlo", () => {
  const report = summarizeFit(
    assessment(
      [
        ["QWEN3_4B_INST_Q4_K_M", "likely-fits"],
        ["GEMMA4_2B_MULTIMODAL_Q4_K_M", "likely-fits"],
      ],
      6_000_000_000,
    ),
    candidates,
    "QWEN3_4B_INST_Q4_K_M",
  );
  assert.equal(report.verdict, "likely-fits");
  assert.match(report.headline, /Qwen3 4B/);
  assert.equal(report.suggestion, null);
  assert.equal(report.freeBytes, 6_000_000_000);
  assert.equal(report.freeLabel, "6,0 GB");
  assert.equal(report.models.length, 2);
});

test("si el elegido no entra y el otro sí, nombra la alternativa y su variable", () => {
  const report = summarizeFit(
    assessment(
      [
        ["QWEN3_4B_INST_Q4_K_M", "likely-too-large"],
        ["GEMMA4_2B_MULTIMODAL_Q4_K_M", "likely-fits"],
      ],
      1_900_000_000,
    ),
    candidates,
    "QWEN3_4B_INST_Q4_K_M",
  );
  assert.equal(report.verdict, "likely-too-large");
  assert.match(report.suggestion ?? "", /Gemma4 2B/);
  assert.match(report.suggestion ?? "", /CHEN_QVAC_MODEL=GEMMA4_2B_MULTIMODAL_Q4_K_M/);
});

test("si ningún candidato entra, el consejo es liberar memoria, no cambiar de modelo", () => {
  const report = summarizeFit(
    assessment(
      [
        ["QWEN3_4B_INST_Q4_K_M", "likely-too-large"],
        ["GEMMA4_2B_MULTIMODAL_Q4_K_M", "likely-too-large"],
      ],
      442_000_000,
    ),
    candidates,
    "QWEN3_4B_INST_Q4_K_M",
  );
  assert.match(report.suggestion ?? "", /liberar|Cierra/);
  assert.doesNotMatch(report.suggestion ?? "", /CHEN_QVAC_MODEL/);
});

test("sin veredicto no se afirma que entra ni que no entra", () => {
  const report = summarizeFit(
    assessment([
      ["QWEN3_4B_INST_Q4_K_M", "unknown"],
      ["GEMMA4_2B_MULTIMODAL_Q4_K_M", "unknown"],
    ]),
    candidates,
    "QWEN3_4B_INST_Q4_K_M",
  );
  assert.equal(report.verdict, "unknown");
  assert.doesNotMatch(report.headline, /debería|se queda corto/);
  assert.equal(report.suggestion, null);
  assert.equal(report.freeBytes, null);
  assert.equal(report.freeLabel, null);
});

test("sin veredicto, el rango estimado queda a la vista para decidir a mano", () => {
  const base = assessment(
    [["QWEN3_4B_INST_Q4_K_M", "unknown"]],
    3_300_000_000,
  );
  base.models[0].estimate = {
    lowerBoundBytes: 2_800_000_000,
    upperBoundBytes: 5_600_000_000,
  };
  const report = summarizeFit(base, candidates, "QWEN3_4B_INST_Q4_K_M");
  const qwen = report.models[0];
  assert.match(qwen.line, /pide entre 2,8 GB y 5,6 GB/);
  assert.match(qwen.line, /descarga 2,5 GB/);
});

test("un modelo que el SDK no evaluó queda sin veredicto, no como aprobado", () => {
  const report = summarizeFit(
    assessment([["QWEN3_4B_INST_Q4_K_M", "likely-fits"]], 6_000_000_000),
    candidates,
    "QWEN3_4B_INST_Q4_K_M",
  );
  const gemma = report.models.find((m) => m.label === "Gemma4 2B");
  assert.equal(gemma?.verdict, "unknown");
});

test("el veredicto no se cachea: preguntar dos veces vuelve a medir", async () => {
  // La primera version guardaba el resultado. Al cerrar aplicaciones la memoria
  // libre paso de 2,2 a 4,4 GB y la aplicacion seguia contestando 2,2: el
  // consejo que ella misma da, liberar memoria y volver a medir, no funcionaba.
  const { LocalQvac } = await import("../server/qvac");
  const fuente = LocalQvac.prototype.assessFit;
  assert.equal(
    /this\.fit/.test(fuente.toString()),
    false,
    "assessFit no debe devolver un resultado guardado: tiene que volver a medir",
  );
});

test("con los pesos ya descargados, el veredicto avisa pero no cierra la puerta", () => {
  // Hallazgo de la auditoria del 2026-09-10: la app decia "se queda corto" y el
  // modelo cargaba y respondia. El veredicto es una advertencia util y una
  // prohibicion falsa. Si los pesos ya estan aqui, ademas, no hay descarga que
  // evitar: la mitad del argumento desaparece.
  const yaEstan = candidates.map((c) => ({ ...c, yaDescargado: true }));
  const report = summarizeFit(
    assessment(
      [
        ["QWEN3_4B_INST_Q4_K_M", "likely-too-large"],
        ["GEMMA4_2B_MULTIMODAL_Q4_K_M", "likely-too-large"],
      ],
      2_900_000_000,
    ),
    yaEstan,
    "QWEN3_4B_INST_Q4_K_M",
  );
  assert.match(report.headline, /puedes intentarlo/);
  assert.match(report.models[0].line, /ya descargado/);
  assert.doesNotMatch(report.models[0].line, /descarga 2,5 GB/);
  assert.match(report.suggestion ?? "", /puedes intentarlo igual/);
});

test("sin los pesos, el aviso sigue siendo el fuerte", () => {
  const report = summarizeFit(
    assessment(
      [
        ["QWEN3_4B_INST_Q4_K_M", "likely-too-large"],
        ["GEMMA4_2B_MULTIMODAL_Q4_K_M", "likely-too-large"],
      ],
      2_900_000_000,
    ),
    candidates,
    "QWEN3_4B_INST_Q4_K_M",
  );
  assert.match(report.headline, /se queda corto/);
  assert.match(report.models[0].line, /descarga 2,5 GB/);
});
