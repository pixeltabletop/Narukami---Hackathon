import { money } from "../server/domain";
import type { ChenState } from "./useChen";
export const RecurringPanel = ({ state }: { state: ChenState }) => {
  const { dashboard, showEvidence } = state;
  if (!dashboard) return null;
  return (
    <section className="panel">
      <h2>Posibles cargos recurrentes</h2>
      <p className="muted">
        Comparamos comercios de servicios con un cargo en cada período y fechas
        cercanas. Esto no confirma una suscripción.
      </p>
      <div className="recurring-grid">
        {dashboard.recurring.map((r) => (
          <button
            key={r.merchant}
            className="recurring-card"
            onClick={() => showEvidence(r.movementIds, r.merchant)}
          >
            <span>↻</span>
            <h3>{r.merchant}</h3>
            <strong>{money(r.amount)}</strong>
            <p>Anterior: {money(r.previousAmount)}</p>
            <small>Ver los dos cargos ↗</small>
          </button>
        ))}
      </div>
      {!dashboard.recurring.length && (
        <p>No hay suficiente evidencia en estos períodos.</p>
      )}
    </section>
  );
};
