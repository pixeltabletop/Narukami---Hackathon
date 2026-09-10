// Prueba real del dictado local: audio en español entra, texto sale, sin red.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
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
try {
  const started = Date.now();
  await voice.load(merchants);
  const loadMs = Date.now() - started;
  console.log("Whisper cargado en", loadMs, "ms");
  for (const file of files) {
    const out = await voice.transcribe(new Uint8Array(readFileSync(file)));
    console.log(file, "->", JSON.stringify(out.text), "en", out.elapsedMs, "ms");
    results.push({ file, ...out });
  }
  mkdirSync("artifacts", { recursive: true });
  writeFileSync(
    "artifacts/voice-check.json",
    JSON.stringify(
      { passed: true, model: VOICE_MODEL, timestamp: new Date().toISOString(), loadMs, results },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await voice.close();
}
