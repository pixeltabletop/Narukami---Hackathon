import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";

// Dos veces en este proyecto una barra invertida se convirtió en un carácter de
// control invisible al escribir un archivo desde otra herramienta. La primera
// dejó en el README un comando que no se podía copiar. La segunda rompió una
// expresión regular del servidor, y como el carácter no se ve, el archivo
// parecía correcto y la regla simplemente no coincidía con nada.
//
// Nada legítimo de este repositorio necesita un byte de control que no sea
// tabulador o salto de línea. Esta prueba los caza antes de que lleguen a una
// entrega.
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory()
      ? walk(path)
      : /\.(ts|tsx|md|json|mjs|css|html)$/.test(name)
        ? [path]
        : [];
  });

const files = [
  ...walk("server"),
  ...walk("src"),
  ...walk("scripts"),
  ...walk("tests"),
  ...walk("docs"),
  "README.md",
  "LICENSE",
];

test("ningún archivo de texto lleva caracteres de control invisibles", () => {
  const offenders: string[] = [];
  for (const path of files) {
    const text = readFileSync(path, "utf8");
    for (const [index, char] of [...text].entries()) {
      const code = char.charCodeAt(0);
      const permitido = code === 9 || code === 10 || code === 13;
      if (code < 32 && !permitido) {
        const linea = text.slice(0, index).split("\n").length;
        offenders.push(
          path.split(sep).join("/") +
            ":" +
            linea +
            " lleva U+" +
            code.toString(16).padStart(4, "0").toUpperCase(),
        );
        break;
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    "Caracteres de control invisibles:\n" + offenders.join("\n"),
  );
});
