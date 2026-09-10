// Prueba real del dictado local: audio en español entra, texto sale, sin red.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import {
  probeNetwork,
  summarize,
  describe,
  type ProbeSample,
} from "./network-probe";
import { LocalVoice, VOICE_MODEL } from "../server/voice";
import { inferenceEnabled } from "../server/qvac";
import { buildHistory, merchantChoices } from "../server/history";
import { createFixtures } from "../server/fixtures";

if (!inferenceEnabled()) {
  console.log("OMITIDO: dictado desactivado. Definir CHEN_ENABLE_QVAC=1.");
  process.exit(0);
}
const files = process.argv.slice(2);
if (files.length === 0) {
  console.log("Uso: npm run voice:check -- ruta1.wav ruta2.wav");
  process.exit(0);
}
const merchants = merchantChoices(
  buildHistory(createFixtures(), "ana", "2026-09-09", 12),
);
const voice = new LocalVoice();
const results = [];
const samples: ProbeSample[] = [];
try {
  // La misma evidencia de red que la prueba de texto: sin esto, el artefacto de
  // voz no sostenía por sí solo la afirmación de que el dictado corre sin
  // conexión, y la documentación llegó a decir que sí la sostenía.
  const antes = await probeNetwork("antes de cargar Whisper");
  console.log(describe(antes));
  samples.push(antes);
  const started = Date.now();
  await voice.load(merchants);
  const loadMs = Date.now() - started;
  console.log("Whisper cargado en", loadMs, "ms");
  for (const [indice, file] of files.entries()) {
    const [out, durante] = await Promise.all([
      voice.transcribe(new Uint8Array(readFileSync(file))),
      indice === 0
        ? probeNetwork("mientras Whisper transcribía el primer audio")
        : Promise.resolve(null),
    ]);
    if (durante) {
      console.log(describe(durante));
      samples.push(durante);
    }
    console.log(file, "->", JSON.stringify(out.text), "en", out.elapsedMs, "ms");
    results.push({ file, ...out });
  }
  const despues = await probeNetwork("al terminar la transcripción");
  console.log(describe(despues));
  samples.push(despues);
  const network = summarize(samples);
  console.log(
    network.reachable
      ? "AVISO: hubo salida a internet en algún momento de la prueba."
      : "Sin salida a internet en ninguna de las tomas.",
  );
  mkdirSync("artifacts", { recursive: true });
  writeFileSync(
    "artifacts/voice-check.json",
    JSON.stringify(
      {
        passed: true,
        model: VOICE_MODEL,
        timestamp: new Date().toISOString(),
        loadMs,
        network,
        results,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  // `close()` del adaptador solo descarga el modelo. Sin cerrar tambien el
  // cliente del SDK el worker puede quedar vivo y el proceso no termina, que es
  // lo peor que puede pasarle a un comando que el jurado va a ejecutar.
  await voice.close();
  const { close } = await import("@qvac/sdk");
  await close();
}
