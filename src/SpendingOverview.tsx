import { money } from "../server/domain";
import { monthNames } from "./period-labels";
import { Insights } from "./Insights";
import type { RastroState } from "./useRastro";
export const SpendingOverview = ({ state }: { state: RastroState }) => {
  const {
    dashboard,
    customer,
    model,
    revision,
    period,
    showEvidence,
    load,
    setTab,
    setCategory,
    setEvidence,
  } = state;
  if (!dashboard || !customer) return null;
  return (
    <>
      <section className="stats">
        <article className="stat primary-stat">
          <span>Gasto neto contabilizado</span>
          <strong>{money(dashboard.total)}</strong>
          <div>
            {dashboard.hasComparison ? (
              <>
                <span className="change">
                  {dashboard.difference >= 0 ? "↗" : "↘"}{" "}
                  {money(Math.abs(dashboard.difference))}
                </span>
                <small>
                  {dashboard.difference >= 0 ? "más" : "menos"} que el período
                  anterior
                </small>
              </>
            ) : (
              <small>Sin datos anteriores para comparar</small>
            )}
          </div>
          <small>Compras y comisiones menos devoluciones y reversos</small>
        </article>
        <article className="stat">
          <span>Período anterior comparable</span>
          <strong>
            {dashboard.hasComparison ? money(dashboard.previousTotal) : "—"}
          </strong>
          <small>
            {monthNames[dashboard.previousPeriod] ??
              "Sin movimientos anteriores"}{" "}
            · mismo tramo
          </small>
        </article>
        <article className="stat">
          <span>Pendiente de contabilizar</span>
          <strong>{money(dashboard.pending)}</strong>
          <small>
            Compras ya autorizadas que el comercio todavía no cobró en firme. El
            banco retiene el dinero, pero el importe final aún puede cambiar.
          </small>
          <span className="pending-line">◷ No suma al gasto del período</span>
        </article>
      </section>
      <div className="overview-grid">
        <Insights
          key={customer.id + period + revision}
          dashboard={dashboard}
          model={model}
          onEvidence={showEvidence}
          onLoad={load}
        />
        <section className="category-panel">
          <span className="eyebrow">EL MAPA DE TUS GASTOS</span>
          <h2>¿Dónde se fue?</h2>
          <p className="muted">Gasto neto por categoría</p>
          <div className="category-list">
            {dashboard.categories
              .filter((c) => c.current !== 0)
              .map((c, i) => (
                <button
                  key={c.name}
                  className="category-item"
                  onClick={() => {
                    setTab("Movimientos");
                    setCategory(c.name);
                    setEvidence(null);
                  }}
                >
                  <span>
                    <i
                      style={{
                        background: [
                          "#3f7768",
                          "#c6814c",
                          "#78929a",
                          "#a7ad78",
                          "#899aca",
                          "#ba8b91",
                        ][i % 6],
                      }}
                    />
                    {c.name}
                    <strong>{money(c.current)}</strong>
                  </span>
                  <div className="bar">
                    <div
                      style={{
                        width:
                          Math.min(
                            100,
                            Math.max(
                              0,
                              (c.current /
                                Math.max(
                                  1,
                                  ...dashboard.categories.map((x) => x.current),
                                )) *
                                100,
                            ),
                          ) + "%",
                        background: [
                          "#3f7768",
                          "#c6814c",
                          "#78929a",
                          "#a7ad78",
                          "#899aca",
                          "#ba8b91",
                        ][i % 6],
                      }}
                    />
                  </div>
                </button>
              ))}
          </div>
          {dashboard.transfersTotal > 0 && (
            <div className="transfer-block">
              <span className="eyebrow">NO ES GASTO</span>
              <p>
                {money(dashboard.transfersTotal)} salieron de la cuenta sin
                consumirse: sigue siendo tu dinero, solo cambió de lugar.
              </p>
              <ul>
                {dashboard.transfers.map((row) => (
                  <li key={row.name}>
                    <span>{row.name}</span>
                    <b>{money(row.amount)}</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </>
  );
};
