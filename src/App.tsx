import { useRastro } from "./useRastro";
import { AppFrame } from "./AppFrame";
import { LoginScreen } from "./LoginScreen";
import { SpendingOverview } from "./SpendingOverview";
import { RecurringPanel } from "./RecurringPanel";
import { ActivityPanel } from "./ActivityPanel";
import { monthNames } from "./period-labels";
export const App = () => {
  const state = useRastro();
  const { customer, period, setPeriod, dashboard, tab, error } = state;
  if (!customer) return <LoginScreen state={state} />;
  return (
    <AppFrame state={state}>
      <div className="page-title">
        <div>
          <span className="eyebrow">
            HOLA, {customer.name.split(" ")[0].toUpperCase()}
          </span>
          <h1>
            {tab === "Resumen"
              ? "Entiende tu dinero."
              : tab === "Movimientos"
                ? "Sigue cada movimiento."
                : "Reconoce lo que se repite."}
          </h1>
          <p className="muted">
            {tab === "Resumen"
              ? "Menos dudas. Más claridad sobre tus gastos."
              : "Cada importe conserva su contexto y su origen."}
          </p>
        </div>
        <label className="period">
          Período
          <select
            aria-label="Período"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {Object.entries(monthNames).map(([v, n]) => (
              <option key={v} value={v}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!dashboard ? (
        <p role="status">Cargando movimientos…</p>
      ) : (
        <>
          <div className="period-note">
            Corte de demostración: 9 sep 2026 ·{" "}
            {dashboard.cutoff === 31
              ? "Mes completo"
              : "Del 1 al " + dashboard.cutoff + " de cada mes"}{" "}
            · Moneda USD
          </div>
          {tab === "Resumen" && <SpendingOverview state={state} />}
          {tab === "Recurrentes" ? (
            <RecurringPanel state={state} />
          ) : (
            <ActivityPanel state={state} />
          )}
        </>
      )}
      <footer>
        Rastro · Prototipo para Caja de Ahorros{" "}
        <span>Datos sintéticos · Sin conexión a cuentas reales</span>
      </footer>
    </AppFrame>
  );
};
