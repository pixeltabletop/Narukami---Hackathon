import { useRastro } from "./useRastro";
import { AppFrame } from "./AppFrame";
import { LoginScreen } from "./LoginScreen";
import { SpendingOverview } from "./SpendingOverview";
import { RecurringPanel } from "./RecurringPanel";
import { ActivityPanel } from "./ActivityPanel";
import { OrganizePanel } from "./OrganizePanel";
import { ScenariosPanel } from "./ScenariosPanel";
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
                : tab === "Recurrentes"
                  ? "Reconoce lo que se repite."
                  : tab === "Organiza"
                    ? "Haz que el saldo llegue contigo."
                    : "Prueba antes de decidir."}
          </h1>
          <p className="muted">
            {tab === "Resumen"
              ? "Menos dudas. Más claridad sobre tus gastos."
              : tab === "Organiza"
                ? "Ordena lo comprometido, lo variable y lo que quieres proteger."
                : tab === "Escenarios"
                  ? "Compara cuánto ahorrar y cuánto conservarías disponible."
                  : "Cada importe conserva su contexto y su origen."}
          </p>
        </div>
        {!["Organiza", "Escenarios"].includes(tab) && <label className="period">
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
        </label>}
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
          {tab === "Resumen" && <><SpendingOverview state={state} /><ActivityPanel state={state} /></>}
          {tab === "Movimientos" && <ActivityPanel state={state} />}
          {tab === "Recurrentes" && <RecurringPanel state={state} />}
          {tab === "Organiza" && <OrganizePanel state={state} />}
          {tab === "Escenarios" && <ScenariosPanel state={state} />}
        </>
      )}
      <footer>
        Rastro · Prototipo para Caja de Ahorros{" "}
        <span>Datos sintéticos · Sin conexión a cuentas reales</span>
      </footer>
    </AppFrame>
  );
};
