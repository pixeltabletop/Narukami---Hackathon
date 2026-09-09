import type { Movement, Category } from "./domain";
export const demoCustomers = [
  { id: "ana", name: "Ana Martínez", initials: "AM", card: "4821" },
  { id: "luis", name: "Luis Rodríguez", initials: "LR", card: "7316" },
];
export const createFixtures = (): Movement[] => {
  const rows: Movement[] = [];
  const add = (
    customerId: string,
    date: string,
    merchant: string,
    amountCents: number,
    category: Category,
    type: Movement["type"] = "purchase",
    status: Movement["status"] = "posted",
  ) => {
    rows.push({
      id: customerId + "-" + String(rows.length + 1).padStart(4, "0"),
      customerId,
      cardId: customerId + "-card",
      date,
      description: merchant.toUpperCase() + " / PANAMA",
      merchant,
      amountCents,
      currency: "USD",
      type,
      status,
      category,
    });
  };
  for (const customer of demoCustomers)
    for (const month of ["07", "08", "09"]) {
      const factor = customer.id === "ana" ? 1 : 0.7;
      const expense = (
        day: number,
        merchant: string,
        cents: number,
        category: Category,
        type: Movement["type"] = "purchase",
        status: Movement["status"] = "posted",
      ) => {
        if (month === "09" && day > 9) return;
        add(
          customer.id,
          "2026-" + month + "-" + String(day).padStart(2, "0"),
          merchant,
          Math.round(cents * factor),
          category,
          type,
          status,
        );
      };
      expense(1, "Mercado del barrio", 7850, "Supermercado");
      expense(2, "Nube Música", 999, "Servicios");
      expense(3, "Café del parque", 650, "Restaurantes");
      expense(4, "Movilidad urbana", 1250, "Transporte");
      expense(5, "Cine en casa", month === "09" ? 1599 : 1299, "Servicios");
      expense(6, "Mercado del barrio", 4320, "Supermercado");
      expense(7, "Farmacia Central", 1875, "Salud");
      expense(
        8,
        "Almuerzos La Mesa",
        month === "09" ? 4200 : 2100,
        "Restaurantes",
      );
      expense(9, "Movilidad urbana", 850, "Transporte");
      expense(10, "Librería Horizonte", 2500, "Compras");
      expense(13, "Mercado del barrio", 6830, "Supermercado");
      expense(17, "Café del parque", 780, "Restaurantes");
      expense(22, "Almuerzos La Mesa", 3600, "Restaurantes");
      expense(27, "Mercado del barrio", 5430, "Supermercado");
      if (month === "09") {
        expense(3, "Entrega Express", 2350, "Restaurantes");
        expense(5, "Entrega Express", 2875, "Restaurantes");
        expense(8, "Entrega Express", 1980, "Restaurantes");
        expense(7, "Tienda Prisma", 6400, "Compras");
        expense(9, "Tienda Prisma", 1800, "Compras", "refund");
        expense(
          9,
          "Comercio pendiente",
          3200,
          "Sin clasificar",
          "purchase",
          "pending",
        );
        expense(9, "Compra anulada", 4500, "Compras", "purchase", "void");
        expense(4, "Abono a tarjeta", 50000, "Sin clasificar", "payment");
        expense(6, "Ajuste de compra", 2200, "Compras");
        expense(7, "Ajuste de compra", 2200, "Compras", "reversal");
      }
    }
  return rows;
};
