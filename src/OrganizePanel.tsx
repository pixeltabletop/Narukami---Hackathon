import { useEffect, useState } from "react";
import { money } from "../server/domain";
import { commitmentKindLabels } from "../server/planning-domain";
import type { ChenState } from "./useChen";

export const OrganizePanel = ({ state }: { state: ChenState }) => {
  const { planning, savePlan, setCommitment } = state;
  const [variable, setVariable] = useState("");
  const [reserve, setReserve] = useState("");
  const [date, setDate] = useState("");
  const [explainPending, setExplainPending] = useState(false);
  useEffect(() => {
    if (!planning) return;
    setVariable((planning.variableBudgetCents / 100).toFixed(2));
    setReserve((planning.reserveCents / 100).toFixed(2));
    setDate(planning.nextIncomeDate);
  }, [planning?.variableBudgetCents, planning?.reserveCents, planning?.nextIncomeDate]);
  if (!planning) return <p role="status">Preparando tu plan local…</p>;
  // Un campo vacío significa cero, no "falta un dato". Quien quiera llevarlo
  // todo a ahorro tiene que poder dejarlo en blanco sin pelear con el formulario.
  const cents = (value: string) => {
    const parsed = Number(value.trim());
    return value.trim() === "" || Number.isNaN(parsed)
      ? 0
      : Math.max(0, Math.round(parsed * 100));
  };
  const fromAccount = planning.commitments.filter((c) => c.settlement === "cuenta");
  const fromPayroll = planning.commitments.filter((c) => c.settlement === "planilla");
  const commitmentRow = (item: (typeof planning.commitments)[number], locked: boolean) => (
    <label
      className={item.state === "excluded" ? "commitment excluded" : "commitment"}
      key={item.id}
    >
      <input
        type="checkbox"
        checked={item.state === "confirmed"}
        disabled={locked}
        onChange={(e) =>
          void setCommitment(item.id, e.target.checked ? "confirmed" : "excluded")
        }
      />
      <span>
        <strong>{item.name}</strong>
        <small>
          {commitmentKindLabels[item.kind]} · Vence {item.dueDate}
          {item.installment ? " · " + item.installment : ""}
          {item.source === "detected" ? " · Detectado" : " · Manual"}
        </small>
      </span>
      <b>{money(item.amountCents)}</b>
    </label>
  );
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
          <span>
            <small>
              Pendiente{" "}
              <button
                type="button"
                className="hint-button"
                aria-expanded={explainPending}
                onClick={() => setExplainPending((v) => !v)}
              >
                ¿qué es?
              </button>
            </small>
            <b>− {money(planning.pendingCents)}</b>
          </span>
          <span><small>Compromisos de la cuenta</small><b>− {money(planning.committedCents)}</b></span>
          <span><small>Variable + reserva</small><b>− {money(planning.variableBudgetCents + planning.reserveCents)}</b></span>
        </div>
      </section>
      {explainPending && (
        <section className="panel hint-panel" role="note">
          <h2>Qué significa «pendiente»</h2>
          <p>
            Es una compra que ya autorizaste y que el comercio todavía no cobró
            en firme. El banco retiene el dinero, así que ya no lo puedes usar,
            pero el movimiento aún no está contabilizado y su importe final
            puede cambiar: una propina, un ajuste de combustible o una reserva
            de hotel suelen liquidarse por un monto distinto.
          </p>
          <p>
            Por eso Chen lo resta del saldo disponible pero no lo suma al
            gasto del período. Cuando el comercio lo cobra, el movimiento pasa a
            contabilizado y ahí sí entra en el análisis de consumo.
          </p>
        </section>
      )}
      <div className="planning-grid">
        <section className="panel">
          <div className="section-heading"><div><span className="eyebrow">TU PLAN</span><h2>Ajusta tus supuestos</h2></div><span className="local-badge">Cálculo local</span></div>
          <form className="plan-form" onSubmit={(event) => { event.preventDefault(); void savePlan({ nextIncomeDate: date, variableBudgetCents: cents(variable), reserveCents: cents(reserve) }); }}>
            <label>Próximo ingreso<input type="date" min="2026-09-10" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
            <label>
              Dinero para gastos variables (USD)
              <input type="number" min="0" step="0.01" value={variable} onChange={(e) => setVariable(e.target.value)} placeholder="0.00" />
              <small className="field-hint">Déjalo vacío o en cero si prefieres no apartar nada y llevar más a ahorro.</small>
            </label>
            <label>
              Reserva que no quieres tocar (USD)
              <input type="number" min="0" step="0.01" value={reserve} onChange={(e) => setReserve(e.target.value)} placeholder="0.00" />
              <small className="field-hint">También admite cero.</small>
            </label>
            <button className="primary" type="submit">Recalcular mi margen</button>
          </form>
        </section>
        <section className="panel">
          <div className="section-heading"><div><span className="eyebrow">ANTES DEL {planning.nextIncomeDate.slice(8)} SEP</span><h2>Pasivos y compromisos</h2></div><strong>{money(planning.committedCents)}</strong></div>
          <div className="commitment-list">
            {fromAccount.map((item) => commitmentRow(item, false))}
          </div>
          <p className="table-note">
            Confirma solo los pagos que esperas realizar. Un compromiso excluido
            deja de descontarse del margen.
          </p>
          {fromPayroll.length > 0 && (
            <>
              <div className="section-heading payroll-heading">
                <div>
                  <span className="eyebrow">SE DESCUENTAN DEL SALARIO</span>
                  <h2>Descuentos directos de planilla</h2>
                </div>
                <strong>{money(planning.payrollCommittedCents)}</strong>
              </div>
              <div className="commitment-list">
                {fromPayroll.map((item) => commitmentRow(item, true))}
              </div>
              <p className="table-note">
                Estos nunca pasan por tu cuenta: el empleador los retiene antes
                de pagarte, así que no reducen tu saldo de hoy. Tu próximo
                ingreso llegaría por{" "}
                <strong>{money(planning.expectedNextIncomeCents)}</strong> en
                lugar del bruto.
              </p>
            </>
          )}
        </section>
      </div>
      <section className="panel assumptions">
        <div><span className="eyebrow">CÓMO SE CALCULÓ</span><h2>Supuestos visibles</h2></div>
        <ol>{planning.assumptions.map((item) => <li key={item}>{item}</li>)}</ol>
      </section>
    </div>
  );
};
