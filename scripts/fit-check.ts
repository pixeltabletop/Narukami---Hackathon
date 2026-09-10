// Veredicto de memoria antes de descargar pesos: pregunta al SDK si este
// equipo aguanta cada candidato, sin bajar un solo byte de modelo.
import { mkdirSync, writeFileSync } from "node:fs";
import { LocalQvac, inferenceEnabled } from "../server/qvac";

if (!inferenceEnabled()) {
  console.log("OMITIDO: inferencia desactivada. Definir CHEN_ENABLE_QVAC=1.");
  process.exit(0);
}
const qvac = new LocalQvac();
try {
  const started = Date.now();
  const report = await qvac.assessFit();
  const elapsedMs = Date.now() - started;
  console.log(report.headline);
  for (const model of report.models) console.log("  " + model.line);
  if (report.freeLabel) console.log("  memoria estimada: " + report.freeLabel);
  if (report.suggestion) console.log("  " + report.suggestion);
  console.log("Estimado en", elapsedMs, "ms sin descargar pesos.");
  mkdirSync("artifacts", { recursive: true });
  writeFileSync(
    "artifacts/fit-check.json",
    JSON.stringify(
      { timestamp: new Date().toISOString(), elapsedMs, report },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  // `close()` del adaptador solo descarga el modelo, y aquí nunca se cargó
  // ninguno: sin cerrar además el cliente del SDK, el worker sigue vivo y el
  // proceso no termina. Verificado colgándose una corrida entera.
  await qvac.close();
  const { close } = await import("@qvac/sdk");
  await close();
}
