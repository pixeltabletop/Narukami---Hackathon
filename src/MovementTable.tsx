import { categories, money, type Category } from "../server/domain";
import { productLabels } from "../server/planning-domain";
import type { LedgerRow } from "./ledger";
import { Combobox } from "./Combobox";
const shortProduct: Record<LedgerRow["product"], string> = {
  "credit-card": "Tarjeta",
  checking: "Corriente",
  savings: "Ahorros",
};
export const MovementTable = ({
  rows,
  onCorrect,
}: {
  rows: LedgerRow[];
  onCorrect: (id: string, c: Category) => void;
}) => (
  <div className="table-scroll">
    <table>
      <thead>
        <tr>
          <th>Comercio / descripción</th>
          <th>Producto</th>
          <th>Fecha</th>
          <th>Categoría</th>
          <th>Estado</th>
          <th className="right">Importe</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((m) => (
          <tr key={m.id} className={m.counts ? "" : "no-cuenta"}>
            <td>
              <span className="merchant-icon">{m.title.slice(0, 1)}</span>
              <span className="merchant-name">
                {m.title}
                <small>{m.detail}</small>
              </span>
            </td>
            <td>
              <span
                className={"product-pill " + m.product}
                title={productLabels[m.product]}
              >
                {shortProduct[m.product]}
              </span>
            </td>
            <td className="date">
              {m.date.slice(8)}/{m.date.slice(5, 7)}
            </td>
            <td>
              {m.editable ? (
                <Combobox
                  className="category-input"
                  label={"Categoría de " + m.title + " " + m.id}
                  value={m.category}
                  options={categories}
                  onChange={(value) => {
                    if ((categories as readonly string[]).includes(value))
                      onCorrect(m.id, value as Category);
                  }}
                />
              ) : (
                <span className="static-category">{m.category}</span>
              )}
            </td>
            <td>
              <span className={"pill " + (m.pending ? "amber" : "")}>
                {m.state}
              </span>
            </td>
            <td className={"right amount " + (m.credit ? "credit" : "")}>
              {m.sign}
              {money(m.amountCents)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {rows.length === 0 && (
      <p className="empty">No hay movimientos con estos filtros.</p>
    )}
  </div>
);
