import { categories, isTransfer, money } from "../server/domain";
import { productLabels, type Product } from "../server/planning-domain";
import { MovementTable } from "./MovementTable";
import type { RastroState } from "./useRastro";
export const ActivityPanel = ({ state }: { state: RastroState }) => {
  const {
    rows,
    tab,
    evidence,
    setEvidence,
    search,
    setSearch,
    category,
    setCategory,
    product,
    setProduct,
    setTab,
    correct,
  } = state;
  const noCuenta = rows.filter(
    (r) => !r.counts && (isTransfer(r.category) || r.credit || r.state === "Pago de tarjeta"),
  );
  return (
    <section className="panel movements-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {evidence ? "EVIDENCIA DEL HALLAZGO" : "TU ACTIVIDAD"}
          </span>
          <h2>
            {evidence
              ? "Los movimientos detrás de la explicación"
              : tab === "Resumen"
                ? "Últimos movimientos"
                : "Bandeja de movimientos"}
          </h2>
        </div>
        {tab === "Resumen" && (
          <button className="text-button" onClick={() => setTab("Movimientos")}>
            Ver todos ↗
          </button>
        )}
      </div>
      {evidence && (
        <div className="evidence-banner">
          <p>{evidence.title}</p>
          <button onClick={() => setEvidence(null)}>Quitar selección ×</button>
        </div>
      )}
      <div className="filters">
        <input
          aria-label="Buscar movimientos"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar comercio o descripción…"
        />
        <select
          aria-label="Filtrar producto"
          value={product}
          disabled={Boolean(evidence)}
          onChange={(e) => setProduct(e.target.value as Product | "Todos")}
        >
          <option value="Todos">Todos los productos</option>
          {(Object.keys(productLabels) as Product[]).map((p) => (
            <option key={p} value={p}>
              {productLabels[p]}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar categoría"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>Todas</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span>{rows.length} movimientos</span>
      </div>
      <MovementTable
        rows={tab === "Resumen" ? rows.slice(0, 5) : rows}
        onCorrect={(id, c) => void correct(id, c)}
      />
      <p className="table-note">
        Cambiar una categoría actualiza los movimientos de ese comercio solo
        para este cliente, y solo se puede hacer sobre la tarjeta. Los abonos,
        los anulados y los traslados aparecen atenuados porque no suman al gasto
        del período.
      </p>
      {noCuenta.length > 0 && (
        <p className="table-note">
          Con este filtro hay {noCuenta.length}{" "}
          {noCuenta.length === 1 ? "movimiento" : "movimientos"} por{" "}
          {money(noCuenta.reduce((n, r) => n + r.amountCents, 0))} que no son
          gasto: traslados entre tus cuentas, retiros, abonos y pagos de
          tarjeta.
        </p>
      )}
    </section>
  );
};
