import { categories } from "../server/domain";
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
    setTab,
    correct,
  } = state;
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
        para este cliente. Los abonos y anulados no se suman al gasto.
      </p>
    </section>
  );
};
