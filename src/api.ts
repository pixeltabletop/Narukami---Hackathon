let csrf = "";
// Quien quiera enterarse de que la sesion se cayo. La aplicacion se suscribe
// para volver a la pantalla de seleccion en vez de quedarse en un aviso rojo
// que no se va sin recargar a mano.
let alPerderSesion: (() => void) | null = null;
export const cuandoSePierdaLaSesion = (accion: () => void) => {
  alPerderSesion = accion;
};
export const api = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch("/api" + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-chen-csrf": csrf,
      ...options.headers,
    },
  });
  const body = await response.json();
  if (response.status === 401) {
    // La sesion ya no existe: normalmente una peticion del cliente anterior que
    // llego tarde a un cambio de cliente.
    csrf = "";
    alPerderSesion?.();
  }
  if (!response.ok)
    throw new Error(body.error ?? "No se pudo completar la consulta");
  if (body.csrf) csrf = body.csrf;
  return body as T;
};
export type Customer = {
  id: string;
  name: string;
  initials: string;
  card: string;
};
export type Session = {
  customer: Customer | null;
  customers: Customer[];
  csrf: string;
};
export type ModelStatus = {
  status: "disabled" | "unloaded" | "loading" | "ready" | "error";
};
export type VoiceStatus = ModelStatus & { model?: string };
/** El audio viaja crudo: JSON base64 lo inflaría un tercio sin ganar nada. */
export const postAudio = async (wav: Uint8Array) => {
  const response = await fetch("/api/voice/transcribe", {
    method: "POST",
    headers: { "Content-Type": "audio/wav", "x-chen-csrf": csrf },
    body: new Blob([wav as unknown as BlobPart], { type: "audio/wav" }),
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.error ?? "No se pudo transcribir el dictado");
  return body as { text: string; elapsedMs: number };
};
