// Prueba de que la máquina no tenía salida a internet mientras el modelo
// respondía.
//
// El reto descalifica la inferencia en nube, así que esta es la evidencia que
// más pesa y no puede ser floja. Un solo intento contra un solo host, hecho
// cuando la inferencia ya terminó, no demuestra gran cosa: prueba que ese host
// no contestó, en ese instante, por ese camino.
//
// Aquí se mide en tres momentos —antes de cargar el modelo, mientras responde
// y al terminar— y contra cuatro destinos que fallan por razones distintas: dos
// conexiones TCP directas a IP, que no dependen de DNS; una petición HTTPS
// completa, que sí depende de DNS y de TLS; y una consulta DNS pura. Si
// cualquiera de los doce intentos hubiera pasado, el artefacto lo diría.
import { connect } from "node:net";
import { promises as dns } from "node:dns";

const TIMEOUT_MS = 2000;

export type ProbeResult = {
  target: string;
  layer: "tcp" | "https" | "dns";
  reachable: boolean;
  detail: string;
  ms: number;
};

export type ProbeSample = {
  moment: string;
  at: string;
  reachable: boolean;
  destinations: ProbeResult[];
};

export type NetworkEvidence = {
  /** Verdadero si CUALQUIER destino respondió en CUALQUIER momento. */
  reachable: boolean;
  timeoutMs: number;
  samples: ProbeSample[];
};

const timed = async (
  target: string,
  layer: ProbeResult["layer"],
  attempt: () => Promise<string>,
): Promise<ProbeResult> => {
  const started = Date.now();
  try {
    const detail = await attempt();
    return { target, layer, reachable: true, detail, ms: Date.now() - started };
  } catch (error) {
    return {
      target,
      layer,
      reachable: false,
      detail: error instanceof Error ? error.message : "sin salida",
      ms: Date.now() - started,
    };
  }
};

/** Conexión TCP cruda: no pasa por DNS ni por TLS, así que aísla la capa. */
const tcp = (host: string, port: number) =>
  timed(host + ":" + port, "tcp", () =>
    new Promise<string>((resolve, reject) => {
      const socket = connect({ host, port });
      const fail = (reason: string) => {
        socket.destroy();
        reject(new Error(reason));
      };
      socket.setTimeout(TIMEOUT_MS, () => fail("timeout"));
      socket.on("error", (error) => fail(error.message));
      socket.on("connect", () => {
        socket.destroy();
        resolve("conectado");
      });
    }),
  );

const https = (url: string) =>
  timed(url, "https", async () => {
    const control = new AbortController();
    const timer = setTimeout(() => control.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: control.signal });
      return "HTTP " + response.status;
    } finally {
      clearTimeout(timer);
    }
  });

// Resolución de nombre por el camino que usaría cualquier aplicación, es decir
// el resolutor del sistema.
//
// La primera versión usaba `dns.resolve4`, que consulta directamente a los
// servidores DNS configurados. En esta máquina esos servidores son `127.0.0.1`,
// un proxy local que rechaza la consulta, así que el sondeo fallaba SIEMPRE,
// hubiera red o no. Una prueba que no puede pasar nunca no es evidencia de
// nada: da un "sin salida" gratis y ensucia la única medición que sostiene la
// afirmación central del reto. Detectado el 2026-09-10.
const dnsQuery = (name: string) =>
  timed(name, "dns", async () => {
    const found = await Promise.race([
      dns.lookup(name, { family: 4 }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS),
      ),
    ]);
    return found.address;
  });

/** Una toma completa: los cuatro destinos, en paralelo. */
export async function probeNetwork(moment: string): Promise<ProbeSample> {
  const destinations = await Promise.all([
    tcp("1.1.1.1", 443),
    tcp("8.8.8.8", 443),
    https("https://cloudflare.com/cdn-cgi/trace"),
    dnsQuery("example.com"),
  ]);
  return {
    moment,
    at: new Date().toISOString(),
    reachable: destinations.some((d) => d.reachable),
    destinations,
  };
}

export const summarize = (samples: ProbeSample[]): NetworkEvidence => ({
  reachable: samples.some((sample) => sample.reachable),
  timeoutMs: TIMEOUT_MS,
  samples,
});

export const describe = (sample: ProbeSample) =>
  sample.moment +
  ": " +
  (sample.reachable ? "HAY salida a internet" : "sin salida") +
  " (" +
  sample.destinations
    .map((d) => d.target + " " + (d.reachable ? "sí" : "no"))
    .join(", ") +
  ")";
