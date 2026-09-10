import { chromium, expect, request } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const base = "http://127.0.0.1:4173";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
});
const page = await context.newPage(),
  errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto(base);
  await page.getByRole("button", { name: /Explorar como Ana/ }).click();
  await expect(
    page.getByRole("heading", { name: "Entiende tu dinero." }),
  ).toBeVisible();
  await expect(page.locator(".primary-stat>strong")).toHaveText(/794.98/);
  mkdirSync("artifacts", { recursive: true });
  await page.getByRole("button", { name: "Organiza", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ajusta tus supuestos" })).toBeVisible();
  // El plan se guarda por cliente, asi que el recorrido no puede dar por hecho
  // el valor por defecto: lo fija el mismo antes de medir.
  const reserve = page.getByLabel("Reserva que no quieres tocar (USD)");
  const variable = page.getByLabel("Dinero para gastos variables (USD)");
  const recalculate = page.getByRole("button", { name: "Recalcular mi margen" });
  const save = async () =>
    Promise.all([
      page.waitForResponse((r) => r.url().endsWith("/api/planning") && r.request().method() === "PUT" && r.status() === 200),
      recalculate.click(),
    ]);
  await variable.fill("140.00");
  await reserve.fill("100.00");
  await save();
  await expect(page.locator(".planning-hero")).toContainText("131.51");
  await page.screenshot({ path: "artifacts/organiza-desktop.png", fullPage: true });
  await reserve.fill("90.00");
  await save();
  await expect(page.locator(".planning-hero")).toContainText("141.51");
  // Vaciar el campo debe valer cero, no bloquear el formulario.
  await variable.fill("");
  await save();
  await expect(page.locator(".planning-hero")).toContainText("281.51");
  await expect(page.getByText("Descuentos directos de planilla")).toBeVisible();
  await variable.fill("140.00");
  await reserve.fill("100.00");
  await save();
  await expect(page.locator(".planning-hero")).toContainText("131.51");
  await page.getByRole("button", { name: "Escenarios", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Elige cuánto separar/ })).toBeVisible();
  await expect(page.locator(".scenario")).toHaveCount(3);
  await page.screenshot({ path: "artifacts/escenarios-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Resumen", exact: true }).click();
  await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Recurrentes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Cine en casa" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Cine en casa/ }).click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page.getByRole("button", { name: "Movimientos", exact: true }).click();
  // El filtro de producto separa la tarjeta de las cuentas. Sin esto el cliente
  // no distingue una compra de un traspaso a su propia cuenta de ahorros.
  const productFilter = page.getByLabel("Filtrar producto");
  await productFilter.selectOption("savings");
  await expect(page.getByText("Traspaso desde cuenta corriente")).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await productFilter.selectOption("checking");
  await expect(page.getByText("Abono a la tarjeta desde la cuenta")).toBeVisible();
  await productFilter.selectOption("credit-card");
  await expect(page.locator("tbody tr").first()).toContainText("Tarjeta");
  await productFilter.selectOption("Todos");
  await page
    .getByRole("textbox", { name: "Buscar movimientos" })
    .fill("Entrega Express");
  await expect(page.locator("tbody tr")).toHaveCount(3);
  const select = page.locator("tbody select").first();
  await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes("/category") &&
        r.request().method() === "PATCH" &&
        r.status() === 200,
    ),
    select.selectOption("Compras"),
  ]);
  await page.reload();
  await page.getByRole("button", { name: "Movimientos", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Buscar movimientos" })
    .fill("Entrega Express");
  await expect(page.locator("tbody select").first()).toHaveValue("Compras");
  await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes("/category") &&
        r.request().method() === "PATCH" &&
        r.status() === 200,
    ),
    page.locator("tbody select").first().selectOption("Restaurantes"),
  ]);
  await expect(page.locator("tbody select").first()).toHaveValue(
    "Restaurantes",
  );
  await page
    .getByRole("combobox", { name: "Cambiar cliente de demo" })
    .selectOption("luis");
  await expect(page.locator(".sidebar-bottom strong")).toHaveText(
    "Luis Rodríguez",
  );
  await page.getByRole("button", { name: "Resumen", exact: true }).click();
  await expect(page.locator(".primary-stat>strong")).not.toHaveText(/794.98/);
  await page
    .getByRole("combobox", { name: "Cambiar cliente de demo" })
    .selectOption("ana");
  await expect(page.locator(".primary-stat>strong")).toHaveText(/794.98/);

  for (const period of ["2026-07", "2026-08", "2026-09"]) {
    await page
      .getByRole("combobox", { name: "Período", exact: true })
      .selectOption(period);
    await expect(page.locator(".primary-stat>strong")).toBeVisible();
    const data = await (
      await context.request.get(base + "/api/dashboard?period=" + period)
    ).json();
    await expect(page.locator(".primary-stat>strong")).toContainText(
      (data.total / 100).toFixed(2),
    );
    if (period === "2026-07")
      await expect(
        page.getByText("Sin datos anteriores para comparar", { exact: true }),
      ).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("combobox", { name: "Cliente de demo en móvil" })
    .selectOption("luis");
  await expect(page.getByText("HOLA, LUIS", { exact: true })).toBeVisible();
  await page
    .getByRole("combobox", { name: "Cliente de demo en móvil" })
    .selectOption("ana");
  await expect(page.locator(".primary-stat>strong")).toHaveText(/794.98/);

  await page.getByRole("button", { name: "Organiza", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ajusta tus supuestos" })).toBeVisible();
  await page.screenshot({ path: "artifacts/organiza-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Escenarios", exact: true }).click();
  await expect(page.locator(".scenario")).toHaveCount(3);

  await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });
  if (
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
  )
    throw new Error("Desbordamiento horizontal móvil");
  const isolated = await request.newContext({ baseURL: base });
  const unauthorized = await isolated.get("/api/dashboard");
  expect(unauthorized.status()).toBe(401);
  const session = await (await isolated.get("/api/session")).json();
  expect(
    (
      await isolated.post("/api/session", { data: { customerId: "luis" } })
    ).status(),
  ).toBe(403);
  const login = await (
    await isolated.post("/api/session", {
      data: { customerId: "luis" },
      headers: { "x-rastro-csrf": session.csrf },
    })
  ).json();
  const foreign = await isolated.patch("/api/movements/ana-0001/category", {
    data: { category: "Compras" },
    headers: { "x-rastro-csrf": login.csrf },
  });
  expect(foreign.status()).toBe(404);

  const malformed = await isolated.post("/api/session", {
    data: "{",
    headers: {
      "Content-Type": "application/json",
      "x-rastro-csrf": login.csrf,
    },
  });
  expect(malformed.status()).toBe(400);
  expect((await isolated.get("/api/dashboard?period=2026-13")).status()).toBe(
    400,
  );
  const modelState = await (await isolated.get("/api/model")).json();
  expect(modelState.status).toBe("disabled");
  const blockedLoad = await isolated.post("/api/model/load", {
    headers: { "x-rastro-csrf": login.csrf },
    data: {},
  });
  expect(blockedLoad.status()).toBe(409);
  const d = await (
    await isolated.get("/api/dashboard?period=2026-09&customerId=ana")
  ).json();
  expect(
    d.evidence.every((m: { customerId: string }) => m.customerId === "luis"),
  ).toBe(true);
  expect(errors).toEqual([]);
  writeFileSync(
    "artifacts/ui-check.json",
    JSON.stringify(
      {
        passed: true,
        checks: [
          "desktop",
          "mobile",
          "filters",
          "recurring-evidence",
          "category-correction",
          "persistence-after-reload",
          "all-periods",
          "missing-history",
          "mobile-customer-switch",
          "invalid-input",
          "inference-disabled",
          "customer-switch",
          "authorization",
          "csrf",
          "foreign-movement-denied",
          "customer-query-ignored",
          "planning-margin",
          "planning-persistence",
          "product-filter",
          "savings-scenarios",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "UI y API verificadas: escritorio, móvil, filtros, evidencias, categorías y aislamiento.",
  );
  await isolated.dispose();
} finally {
  await browser.close();
}
