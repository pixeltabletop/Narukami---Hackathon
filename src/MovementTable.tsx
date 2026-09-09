import {
  categories,
  money,
  type Movement,
  type Category,
} from "../server/domain";
const kind = (m: Movement) =>
  m.status === "pending"
    ? "Pendiente"
    : m.status === "void"
      ? "Anulado"
      : m.type === "payment"
        ? "Pago de tarjeta"
        : m.type === "refund"
          ? "Devolución"
          : m.type === "reversal"
            ? "Reverso"
            : "Compra";
export const MovementTable = ({
  rows,
  onCorrect,
}: {
  rows: Movement[];
  onCorrect: (id: string, c: Category) => void;
}) => (
  <div className="table-scroll">
    <table>
      <thead>
        <tr>
          <th>Comercio / descripción</th>
          <th>Fecha</th>
          <th>Categoría</th>
          <th>Estado</th>
          <th className="right">Importe</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((m) => (
          <tr key={m.id}>
            <td>
              <span className="merchant-icon">{m.merchant.slice(0, 1)}</span>
              <span className="merchant-name">
                {m.merchant}
                <small>{m.description}</small>
              </span>
            </td>
            <td className="date">
              {m.date.slice(8)}/{m.date.slice(5, 7)}
            </td>
            <td>
              <select
                aria-label={"Categoría de " + m.merchant + " " + m.id}
                value={m.category}
                onChange={(e) => onCorrect(m.id, e.target.value as Category)}
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </td>
            <td>
              <span
                className={"pill " + (m.status === "pending" ? "amber" : "")}
              >
                {kind(m)}
              </span>
            </td>
            <td
              className={
                "right amount " +
                (["refund", "reversal", "payment"].includes(m.type)
                  ? "credit"
                  : "")
              }
            >
              {["refund", "reversal", "payment"].includes(m.type) ? "−" : ""}
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
