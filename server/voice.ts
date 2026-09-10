// Dictado local. La voz es un dato del cliente igual que un movimiento, así que
// no puede salir del equipo: la API de voz del navegador manda el audio a un
// servidor del fabricante, y eso descalificaría. Se transcribe con Whisper
// dentro de QVAC, en la misma máquina que ya corre el resto.
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { categories } from "./domain";

export const VOICE_MODEL = "WHISPER_BASE_Q8_0";

// Whisper acierta la frase y deforma lo que no conoce. Sembrar el vocabulario
// del dominio en la carga reduce el destrozo sin tocar la transcripción.
const hint = (merchants: readonly string[]) =>
  [
    "Consulta bancaria en español de Panamá.",
    "Rubros: " + categories.join(", ") + ".",
    merchants.length ? "Comercios: " + merchants.join(", ") + "." : "",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 900);

export class LocalVoice {
  private modelId: string | undefined;
  private sdk: typeof import("@qvac/sdk") | undefined;
  private busy = false;
  status: "unloaded" | "loading" | "ready" | "error" = "unloaded";
  lastError = "";

  async load(merchants: readonly string[] = []) {
    if (this.modelId) return;
    if (this.status === "loading")
      throw new Error("El dictado se está preparando");
    this.status = "loading";
    try {
      this.sdk = await import("@qvac/sdk");
      this.modelId = await this.sdk.loadModel({
        modelSrc: this.sdk.WHISPER_BASE_Q8_0,
        modelConfig: {
          // Sin fijar el idioma Whisper autodetecta y traduce al inglés.
          language: "es",
          translate: false,
          no_timestamps: true,
          initial_prompt: hint(merchants),
        },
      });
      this.status = "ready";
    } catch (error) {
      this.status = "error";
      this.lastError =
        error instanceof Error ? error.message : "No se pudo cargar el dictado";
      throw new Error(this.lastError, { cause: error });
    }
  }

  /** Recibe WAV PCM 16 bit, 16 kHz, mono y devuelve el texto tal cual. */
  async transcribe(wav: Uint8Array) {
    if (!this.modelId || !this.sdk)
      throw new Error("El dictado todavía no está cargado");
    if (this.busy) throw new Error("Ya hay un dictado en curso");
    this.busy = true;
    const started = Date.now();
    const dir = join(tmpdir(), "chen-audio");
    await mkdir(dir, { recursive: true });
    const path = join(
      dir,
      Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".wav",
    );
    await writeFile(path, wav);
    try {
      const out = await this.sdk.transcribe({
        modelId: this.modelId,
        audioChunk: path,
      });
      // No se corrige el texto en silencio: lo dictado se muestra tal cual y el
      // cliente lo edita antes de enviar. Colapsar sinónimos rompe la pregunta.
      return { text: String(out ?? "").trim(), elapsedMs: Date.now() - started };
    } finally {
      this.busy = false;
      await unlink(path).catch(() => undefined);
    }
  }

  async close() {
    if (this.sdk && this.modelId) {
      await this.sdk.unloadModel({ modelId: this.modelId }).catch(() => undefined);
      this.modelId = undefined;
      this.status = "unloaded";
    }
  }
}
