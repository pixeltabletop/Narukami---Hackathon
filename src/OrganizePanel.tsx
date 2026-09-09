import { useEffect, useState } from "react";
import { money } from "../server/domain";
import type { RastroState } from "./useRastro";

export const OrganizePanel = ({ state }: { state: RastroState }) => {
  const { planning, savePlan, setCommitment } = state;
  const [variable, setVariable] = useState("");
  const [reserve, setReserve] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    if (!planning) return;
    setVariable((planning.variableBudgetCents / 100).toFixed(2));
    setReserve((planning.reserveCents / 100).toFixed(2));
    setDate(planning.nextIncomeDate);
  }, [planning?.variableBudgetCents, planning?.reserveCents, planning?.nextIncomeDate]);
  if (!planning) return <p role="status">Preparando tu plan local…</p>;
  const cents = (value: string) => Math.round(Number(value) * 100);
  return (
    <div className="planning-stack">
      <section className="planning-hero">
        <div>
          <span className="eyebrow">HASTA TU PRÓXIMO INGRESO</span>
          <strong>{money(planning.availableCents)}</strong>
          <p>Margen después de pendientes, compromisos, gastos variables y reserva.</p>
        </div>
        <div className="balance-breakdown">
          <span><small>Saldo actual</small><b>{money(planning.balanceCents)}</b></span>
          <span><small>Pendiente</small><b>− {money(planning.pendingCents)}</b></span>
          <span><small>Compromisos</small><b>− {money(planning.committedCents)}</b></span>
          <span><small>Variable + reserva</small><b>− {money(planning.variableBudgetCents + planning.reserveCents)}</b></span>
        </div>
      </section>
      <div className="planning-grid">
        <section className="panel">
          <div className="section-heading"><div><span className="eyebrow">TU PLAN</span><h2>Ajusta tus supuestos</h2></div><span className="local-badge">Cálculo local</span></div>
          <form className="plan-form" onSubmit={(event) => { event.preventDefault(); void savePlan({ nextIncomeDate: date, variableBudgetCents: cents(variable), reserveCents: cents(reserve) }); }}>
            <label>Próximo ingreso<input type="date" min="2026-09-10" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
            <label>Dinero para gastos variables (USD)<input type="number" min="0" step="0.01" value={variable} onChange={(e) => setVariable(e.target.value)} required /></label>
            <label>Reserva que no quieres tocar (USD)<input type="number" min="0" step="0.01" value={reserve} onChange={(e) => setReserve(e.target.value)} required /></label>
            <button className="primary" type="submit">Recalcular mi margen</button>
          </form>
        </section>
        <section className="panel">
          <div className="section-heading"><div><span className="eyebrow">ANTES DEL {planning.nextIncomeDate.slice(8)} SEP</span><h2>Compromisos previstos</h2></div><strong>{money(planning.committedCents)}</strong></div>
          <div className="commitment-list">
            {planning.commitments.map((item) => (
              <label className={item.state === "excluded" ? "commitment excluded" : "commitment"} key={item.id}>
                <input type="checkbox" checked={item.state === "confirmed"} onChange={(e) => void setCommitment(item.id, e.target.checked ? "confirmed" : "excluded")} />
                <span><strong>{item.name}</strong><small>Vence {item.dueDate} · {item.source === "detected" ? "Detectado" : "Manual"}</small></span>
                <b>{money(item.amountCents)}</b>
              </label>
            ))}
          </div>
          <p className="table-note">Confirma solo los pagos que esperas realizar. Un compromiso excluido deja de descontarse del margen.</p>
        </section>
      </div>
      <section className="panel assumptions">
        <div><span className="eyebrow">CÓMO SE CALCULÓ</span><h2>Supuestos visibles</h2></div>
        <ol>{planning.assumptions.map((item) => <li key={item}>{item}</li>)}</ol>
      </section>
    </div>
  );
};
