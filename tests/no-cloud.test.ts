import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";

// El reto descalifica la inferencia en nube. Esta prueba es la cerca: si
// alguien agrega mañana una llamada a un host externo en el código que se
// ejecuta, la suite se cae antes de que llegue a una entrega.
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory()
      ? walk(path)
      : /\.(ts|tsx)$/.test(name)
        ? [path]
        : [];
  });

const runtime = [...walk("server"), ...walk("src")];

test("ningún archivo de ejecución contacta un host externo", () => {
  const offenders: string[] = [];
  for (const path of runtime) {
    const code = readFileSync(path, "utf8");
    for (const line of code.split(/\r?\n/)) {
      // Se ignoran comentarios y los namespaces de XML, que no se piden por red.
      const clean = line.trim();
      if (clean.startsWith("//") || clean.startsWith("*")) continue;
      const match = clean.match(/https?:\/\/[^\s"'`)]+/);
      if (!match) continue;
      if (/127\.0\.0\.1|localhost|www\.w3\.org/.test(match[0])) continue;
      offenders.push(path + ": " + match[0]);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    "Hay salida a un host externo en código de ejecución:\n" +
      offenders.join("\n"),
  );
});

test("la inferencia entra solo por el SDK de QVAC", () => {
  const importers = runtime.filter((path) =>
    /from "@qvac\/sdk"|import\("@qvac\/sdk"\)/.test(readFileSync(path, "utf8")),
  );
  // Un solo camino de entrada por capacidad: texto y voz. Si aparece un
  // tercero, alguien metió otro motor.
  assert.deepEqual(
    importers.map((p) => p.split(sep).join("/")).sort(),
    ["server/qvac.ts", "server/voice.ts"],
  );
  // Se busca el import del paquete, no la palabra suelta: "coherente" contiene
  // "cohere" y una cerca que grita por eso deja de servir de cerca.
  const bannedImport =
    /(?:from|import|require)\s*\(?\s*["'`][^"'`]*(openai|anthropic|cohere|replicate|huggingface|bedrock|generativeai|@google\/gen)/i;
  for (const path of runtime)
    assert.equal(
      bannedImport.test(readFileSync(path, "utf8")),
      false,
      "Proveedor de IA ajeno a QVAC importado en " + path,
    );
});

test("las dependencias de ejecución no incluyen otro motor de IA", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const deps = Object.keys(pkg.dependencies ?? {});
  assert.ok(deps.includes("@qvac/sdk"), "QVAC debe ser dependencia declarada");
  const banned =
    /(openai|anthropic|cohere|replicate|huggingface|transformers|onnxruntime|@google\/genai)/i;
  const offenders = deps.filter((name) => banned.test(name));
  assert.deepEqual(offenders, []);
});
