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
      expense(2, "Nube Música", 999, "Suscripciones");
      expense(3, "Café del parque", 650, "Restaurantes");
      expense(4, "Movilidad urbana", 1250, "Transporte");
      expense(5, "Cine en casa", month === "09" ? 1599 : 1299, "Suscripciones");
      expense(6, "Mercado del barrio", 4320, "Supermercado");
      expense(7, "Farmacia Central", 1875, "Salud");
      expense(
        8,
        "Almuerzos La Mesa",
        month === "09" ? 4200 : 2100,
        "Restaurantes",
      );
      expense(9, "Movilidad urbana", 850, "Transporte");
      // Perfil de quien ademas factura por su cuenta: proveedores, honorarios y
      // pauta conviven con el gasto domestico en la misma tarjeta.
      expense(2, "Suministros Ipsa", month === "09" ? 8600 : 7400, "Proveedores");
      expense(4, "Contadora Rivas", 12500, "Servicios profesionales");
      expense(6, "Pauta en redes", month === "09" ? 4500 : 2200, "Marketing y publicidad");
      expense(8, "Cuota préstamo personal", 18500, "Pago de préstamo");
      expense(10, "Librería Horizonte", 2500, "Compras");
      expense(13, "Mercado del barrio", 6830, "Supermercado");
      expense(17, "Café del parque", 780, "Restaurantes");
      expense(22, "Almuerzos La Mesa", 3600, "Restaurantes");
      expense(27, "Mercado del barrio", 5430, "Supermercado");
      // Un traslado no es consumo: sale de la cuenta y sigue siendo dinero del
      // cliente. Va en los fixtures para que la distincion se vea en la demo.
      expense(11, "Traspaso a mi cuenta de ahorros", 15000, "Transferencia entre cuentas");
      expense(12, "Retiro cajero automático", 6000, "Retiro de efectivo");
      expense(14, "Seguro vehicular Delta", 3800, "Seguros");
      expense(16, "Colegio San Marcos", 9500, "Educación");
      expense(19, "Ferretería del sur", 2740, "Hogar");
      if (month === "09") {
        // Traslados del mes en curso: el cliente los ve, pero no suman gasto.
        expense(5, "Traspaso a mi cuenta de ahorros", 20000, "Transferencia entre cuentas");
        expense(7, "Retiro cajero automático", 8000, "Retiro de efectivo");
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
