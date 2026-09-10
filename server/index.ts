import express from "express";
import session from "express-session";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { analyze, AS_OF } from "./analysis";
import { LocalVoice, VOICE_MODEL } from "./voice";
import { buildHistory, merchantChoices } from "./history";
import { categories } from "./domain";
import { demoCustomers } from "./fixtures";
import { MovementRepository } from "./repository";
import { PlanningRepository } from "./planning-repository";
import { LocalQvac, inferenceEnabled } from "./qvac";
declare module "express-session" {
  interface SessionData {
    customerId?: string;
    csrf?: string;
  }
}
const app = express(),
  repository = new MovementRepository(),
  planningRepository = new PlanningRepository(),
  qvac = new LocalQvac(),
  voice = new LocalVoice();
app.disable("x-powered-by");
// Cabeceras del documento. El bloque de /api ya mandaba no-store y nosniff,
// pero el HTML no mandaba nada: la aplicacion se podia embeber en un iframe de
// terceros. La politica es cerrada a proposito, todo sale de este mismo origen.
app.use((_req, res, next) => {
  res.set({
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy":
      "default-src 'self'; img-src 'self' data:; media-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'",
  });
  next();
});
app.use(express.json({ limit: "8kb" }));
app.use(
  session({
    secret: randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "strict", maxAge: 3600000 },
  }),
);
app.use("/api", (req, res, next) => {
  res.set({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  if (!["localhost", "127.0.0.1", "[::1]"].includes(req.hostname))
    return res
      .status(403)
      .json({ error: "Acceso de demo limitado a localhost" });
  // Solo se acuna CSRF para una sesion que ya eligio cliente, o para la propia
  // pantalla de seleccion. Crearlo en cualquier peticion tocaba la sesion, y
  // tocar la sesion emite cookie nueva: una peticion en vuelo del cliente
  // anterior bastaba para dejar la aplicacion en un 401 permanente.
  const eligiendoCliente = req.path === "/session";
  if (!req.session.csrf && (req.session.customerId || eligiendoCliente))
    req.session.csrf = randomBytes(24).toString("hex");
  if (req.method !== "GET" && req.get("x-chen-csrf") !== req.session.csrf)
    return res
      .status(403)
      .json({ error: "Sesión desactualizada. Recarga la página." });
  next();
});
app.get("/api/session", (req, res) =>
  res.json({
    customer:
      demoCustomers.find((c) => c.id === req.session.customerId) ?? null,
    customers: demoCustomers,
    csrf: req.session.csrf,
  }),
);
app.post("/api/session", (req, res) => {
  const selected = demoCustomers.find((c) => c.id === req.body.customerId);
  if (!selected)
    return res.status(400).json({ error: "Cliente de demo inválido" });
  req.session.regenerate((error) => {
    if (error)
      return res.status(500).json({ error: "No se pudo iniciar la sesión" });
    req.session.customerId = selected.id;
    req.session.csrf = randomBytes(24).toString("hex");
    res.json({ customer: selected, csrf: req.session.csrf });
  });
});
app.use("/api", (req, res, next) => {
  if (!req.session.customerId)
    return res
      .status(401)
      .json({ error: "Selecciona un cliente de demostración" });
  next();
});
const periodSchema = z.enum(["2026-07", "2026-08", "2026-09"]);
app.get("/api/dashboard", (req, res) => {
  const period = periodSchema.parse(req.query.period ?? "2026-09");
  const customer = req.session.customerId!;
  res.json(analyze(repository.list(customer), customer, period));
});
app.patch("/api/movements/:id/category", (req, res) => {
  const { category } = z
    .object({ category: z.enum(categories) })
    .strict()
    .parse(req.body);
  if (
    !repository.correct(
      req.session.customerId!,
      String(req.params.id),
      category,
    )
  )
    return res.status(404).json({ error: "Movimiento no encontrado" });
  res.json({ ok: true });
});
const planSchema = z.object({
  nextIncomeDate: z.string().date(),
  variableBudgetCents: z.number().int().nonnegative().max(100_000_000),
  reserveCents: z.number().int().nonnegative().max(100_000_000),
}).strict();
app.get("/api/planning", (req, res) =>
  res.json(planningRepository.get(req.session.customerId!)),
);
app.put("/api/planning", (req, res) =>
  res.json(planningRepository.savePlan(req.session.customerId!, planSchema.parse(req.body))),
);
app.get("/api/forecast", (req, res) => {
  const horizon = z
    .object({ horizon: z.string().date().optional() })
    .strict()
    .parse(req.query).horizon;
  res.json(planningRepository.forecast(req.session.customerId!, horizon));
});
app.patch("/api/commitments/:id", (req, res) => {
  const { state } = z.object({ state: z.enum(["confirmed", "excluded"]) }).strict().parse(req.body);
  const view = planningRepository.setCommitment(req.session.customerId!, String(req.params.id), state);
  if (!view) return res.status(404).json({ error: "Compromiso no encontrado" });
  res.json(view);
});
// El dictado se carga aparte del modelo de texto: pesa poco y no todo el
// mundo lo va a usar, así que no se paga su carga sin pedirlo.
app.get("/api/voice", (_req, res) =>
  res.json({
    status: inferenceEnabled() ? voice.status : "disabled",
    model: VOICE_MODEL,
    error: voice.lastError ? "No fue posible preparar el dictado." : null,
  }),
);
app.post("/api/voice/load", (req, res) => {
  if (!inferenceEnabled())
    return res.status(409).json({
      status: "disabled",
      error: "Dictado desactivado para esta entrega.",
    });
  const customer = req.session.customerId!;
  const merchants = merchantChoices(
    buildHistory(repository.list(customer), customer, AS_OF, 12),
  );
  voice
    .load(merchants)
    .then(() => res.json({ status: voice.status, model: VOICE_MODEL }))
    .catch(() =>
      res
        .status(503)
        .json({ status: voice.status, error: "No se pudo preparar el dictado." }),
    );
});
// El audio llega crudo: WAV PCM 16 bit, 16 kHz, mono, generado en el navegador.
app.post(
  "/api/voice/transcribe",
  express.raw({ type: "audio/wav", limit: "3mb" }),
  async (req, res) => {
    if (!inferenceEnabled())
      return res.status(409).json({ error: "Dictado desactivado." });
    const body = req.body as Buffer;
    if (!Buffer.isBuffer(body) || body.length < 1000)
      return res.status(400).json({ error: "Audio vacío o demasiado corto." });
    try {
      res.json(await voice.transcribe(new Uint8Array(body)));
    } catch {
      res.status(503).json({
        error:
          "No se pudo transcribir en este equipo. Puedes escribir la pregunta.",
      });
    }
  },
);
app.get("/api/model", (_req, res) =>
  res.json({
    status: qvac.status,
    provider: "QVAC en este equipo",
    error: qvac.lastError
      ? "No fue posible cargar el modelo. Revisa el diagnóstico local."
      : null,
  }),
);
// Veredicto de memoria antes de descargar. No baja pesos ni carga el modelo:
// solo evita que el cliente arranque una descarga de gigabytes que su equipo
// no va a sostener.
app.get("/api/model/fit", async (_req, res) => {
  if (!inferenceEnabled())
    return res.status(409).json({
      error:
        "Inferencia desactivada para esta entrega. Configurar QVAC en el equipo de destino.",
    });
  try {
    res.json(await qvac.assessFit());
  } catch (error) {
    console.error(
      "QVAC fit:",
      error instanceof Error ? error.message : "error",
    );
    res
      .status(503)
      .json({ error: "No fue posible estimar la memoria en este equipo." });
  }
});
app.post("/api/model/load", (_req, res) => {
  if (!inferenceEnabled())
    return res.status(409).json({
      status: "disabled",
      error:
        "Inferencia desactivada para esta entrega. Configurar QVAC en el equipo de destino.",
    });
  if (qvac.status === "loading")
    return res.status(202).json({ status: qvac.status });
  void qvac
    .load()
    .catch((error) =>
      console.error("QVAC:", error instanceof Error ? error.message : "error"),
    );
  res.status(202).json({ status: qvac.status });
});
app.post("/api/explain", async (req, res) => {
  const { question, period } = z
    .object({
      question: z.string().trim().min(3).max(600),
      period: periodSchema,
    })
    .strict()
    .parse(req.body);
  const customer = req.session.customerId!;
  const movements = repository.list(customer);
  const dashboard = analyze(movements, customer, period);
  try {
    res.json(
      await qvac.explain(question, dashboard, {
        movements,
        customerId: customer,
        asOf: AS_OF,
        // El plan y la proyeccion llegan ya calculados. El asistente contesta
        // con los mismos numeros que muestran Organiza y Proyeccion, asi que
        // el chat y las pestañas no pueden decir cosas distintas.
        planning: planningRepository.get(customer),
        forecast: planningRepository.forecast(customer),
      }),
    );
  } catch {
    res.status(503).json({
      error:
        "No se pudo generar una explicación válida con QVAC. Los cálculos y movimientos siguen disponibles.",
      provider: "unavailable",
    });
  }
});
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "Ruta no encontrada" }),
);
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const clientError =
      error instanceof z.ZodError ||
      (error instanceof Error &&
        "status" in error &&
        typeof error.status === "number" &&
        error.status >= 400 &&
        error.status < 500);
    const status =
      clientError &&
      error instanceof Error &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : clientError
          ? 400
          : 500;
    res.status(status).json({
      error: clientError
        ? "Solicitud inválida"
        : "No fue posible procesar la solicitud",
    });
  },
);
if (existsSync("dist/index.html")) {
  app.use(express.static(resolve("dist")));
  // Despues del estatico, no antes: puesta delante ganaba siempre y el icono
  // real, que si existe en dist, nunca llegaba a servirse.
  app.get("/favicon.ico", (_req, res) => res.status(204).end());
  app.get("/{*path}", (_req, res) =>
    res.sendFile("index.html", { root: resolve("dist") }),
  );
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT ?? 4173);
const server = app.listen(port, "127.0.0.1");
// El anuncio sale del evento "listening" y comprobando que el socket este de
// verdad escuchando. Anunciarlo antes es lo que hacia creer que la aplicacion
// habia arrancado cuando el puerto estaba ocupado.
server.on("listening", () => {
  if (server.listening)
    console.log("Chen listo en http://127.0.0.1:" + port);
});
// Sin esto, un puerto ocupado mata el proceso en silencio despues de haber
// impreso "Chen listo". Quien lo arranca se queda con el servidor anterior, que
// puede ser el que corre SIN inferencia, creyendo que encendio la IA.
server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      "El puerto " +
        port +
        " ya está en uso. Cierra el otro servidor, probablemente un `npm run dev`, y vuelve a intentar.",
    );
    process.exit(1);
  }
  throw error;
});
process.on("SIGINT", () => {
  server.close();
  repository.close();
  planningRepository.close();
  void qvac.close().finally(() => process.exit());
});
