// Arranque de demostración: enciende la inferencia local y levanta el servidor.
// Existe porque el jurado que solo hace `npm run dev` ve la aplicación sin IA,
// y eso se lee como si el proyecto no usara QVAC.
import { spawn } from "node:child_process";
process.env.CHEN_ENABLE_QVAC = "1";
console.log(
  [
    "Chen con inferencia local activada.",
    "La primera vez descarga el modelo (unos 2,5 GB). Después arranca desde caché.",
    "Abre http://127.0.0.1:4173 y toca «Cargar modelo local» en el Asistente.",
    "",
  ].join("\n"),
);
spawn("npx", ["tsx", "server/index.ts"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  // Si el hijo muere por senal, `code` es null y `null ?? 0` reportaba EXITO:
  // un servidor muerto se veia como un arranque correcto.
}).on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
