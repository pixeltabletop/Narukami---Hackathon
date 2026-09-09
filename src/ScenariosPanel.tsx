import { money } from "../server/domain";
import type { RastroState } from "./useRastro";

export const ScenariosPanel = ({ state }: { state: RastroState }) => {
  const { planning, setTab } = state;
  if (!planning) return <p role="status">Calculando escenarios…</p>;
  return <div className="planning-stack">
    <section className="scenario-intro">
      <div><span className="eyebrow">SIMULACIÓN, NO INSTRUCCIÓN FINANCIERA</span><h2>Elige cuánto separar sin perder de vista el resto.</h2><p className="muted">Cada alternativa parte del mismo margen de {money(planning.availableCents)} y no modifica tu cuenta.</p></div>
      <div className="capacity-card"><small>Capacidad sugerida</small><strong>{money(planning.recommendedSavingCents)}</strong><span>Basada en 3 meses sintéticos</span></div>
    </section>
    <div className="scenario-grid">
      {planning.scenarios.map((scenario) => <article className={scenario.id === "suggested" ? "scenario featured" : "scenario"} key={scenario.id}>
        {scenario.id === "suggested" && <span className="recommendation">RECOMENDADO</span>}
        <h3>{scenario.label}</h3>
        <p className="muted">Separar ahora</p><strong className="scenario-amount">{money(scenario.savingCents)}</strong>
        <div className="scenario-result"><span>Te quedaría</span><b>{money(scenario.remainingCents)}</b></div>
        <span className={scenario.feasible ? "feasible" : "not-feasible"}>{scenario.feasible ? "Viable con tus supuestos" : "Supera tu margen"}</span>
      </article>)}
    </div>
    <section className="panel history-metrics">
      <div><span className="eyebrow">REFERENCIA HISTÓRICA</span><h2>La recomendación tiene contexto</h2></div>
      <span><small>Ingreso mensual promedio</small><strong>{money(planning.averageMonthlyIncomeCents)}</strong></span>
      <span><small>Salidas mensuales promedio</small><strong>{money(planning.monthlyAverageExpenseCents)}</strong></span>
      <span><small>Cobertura del saldo</small><strong>{planning.coverageMonths} meses</strong></span>
      <button className="text-button" onClick={() => setTab("Organiza")}>Editar supuestos →</button>
    </section>
  </div>;
};
