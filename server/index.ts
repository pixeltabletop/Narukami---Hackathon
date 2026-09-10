import express from "express";
import session from "express-session";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { analyze } from "./analysis";
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
  qvac = new LocalQvac();
app.disable("x-powered-by");
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
  if (!req.session.csrf) req.session.csrf = randomBytes(24).toString("hex");
  if (req.method !== "GET" && req.get("x-rastro-csrf") !== req.session.csrf)
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
app.get("/api/model", (_req, res) =>
  res.json({
    status: qvac.status,
    provider: "QVAC en este equipo",
    error: qvac.lastError
      ? "No fue posible cargar el modelo. Revisa el diagnóstico local."
      : null,
  }),
);
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
  const dashboard = analyze(repository.list(customer), customer, period);
  try {
    res.json(await qvac.explain(question, dashboard));
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
app.get("/favicon.ico", (_req, res) => res.status(204).end());
if (existsSync("dist/index.html")) {
  app.use(express.static(resolve("dist")));
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
const server = app.listen(port, "127.0.0.1", () =>
  console.log("Rastro listo en http://127.0.0.1:" + port),
);
process.on("SIGINT", () => {
  server.close();
  repository.close();
  planningRepository.close();
  void qvac.close().finally(() => process.exit());
});
