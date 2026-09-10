import { money } from "../server/domain";
import type { ChenState } from "./useChen";

const shapeLabel: Record<string, string> = {
  quincenal: "Cobro quincenal",
  mensual: "Cobro mensual",
  irregular: "Ingresos irregulares",
  desconocido: "Sin patrón reconocible",
};

export const ForecastPanel = ({ state }: { state: ChenState }) => {
  const { forecast, forecastHorizon, setForecastHorizon } = state;
  if (!forecast) return <p role="status">Proyectando tu saldo…</p>;
  const ok = forecast.nextIncomeDate
    ? forecast.reachesNextIncome
    : forecast.reachesEndOfMonth;
  const marked = forecast.days.filter((d) =>
    d.events.some((e) => e.origin !== "variable"),
  );
  const floor = Math.min(0, forecast.lowestCents);
  const ceiling = Math.max(
    ...forecast.days.map((d) => d.closingCents),
    forecast.startingCents,
  );
  const span = Math.max(1, ceiling - floor);
  return (
    <div className="planning-stack">
      <section className={"forecast-hero " + (ok ? "ok" : "alerta")}>
        <div>
          <span className="eyebrow">
            {ok ? "VAS BIEN" : "TOMA PREVISIONES"}
          </span>
          <strong>{forecast.verdict}</strong>
          <p>{forecast.advice}</p>
        </div>
        <div className="balance-breakdown">
          <span>
            <small>Punto más bajo</small>
            <b>{money(forecast.lowestCents)}</b>
            <small>{forecast.lowestDate}</small>
          </span>
          <span>
            <small>Al cierre del mes</small>
            <b>{money(forecast.balanceAtEndOfMonthCents)}</b>
            <small>{forecast.endOfMonth}</small>
          </span>
          <span>
            <small>Autonomía sin cobrar</small>
            <b>{forecast.runwayDays} días</b>
            <small>
              {forecast.runwayEndsDate
                ? "se agota el " + forecast.runwayEndsDate
                : "cubre todo el horizonte"}
            </small>
          </span>
          <span>
            <small>Gasto variable diario</small>
            <b>{money(forecast.dailyVariableCents)}</b>
            <small>repartido parejo</small>
          </span>
        </div>
      </section>

      <div className="planning-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CÓMO COBRAS</span>
              <h2>{shapeLabel[forecast.income.shape]}</h2>
            </div>
            <span className="local-badge">
              Confianza {forecast.income.confidence}
            </span>
          </div>
          <p className="muted">{forecast.income.explanation}</p>
          <div className="income-facts">
            <span>
              <small>Eventos observados</small>
              <b>
                {forecast.income.eventsObserved} en{" "}
                {forecast.income.monthsObserved} meses
              </b>
            </span>
            <span>
              <small>Promedio mensual</small>
              <b>{money(forecast.income.monthlyAverageCents)}</b>
            </span>
            {forecast.nextIncomeDate && (
              <span>
                <small>Próximo cobro previsto</small>
                <b>
                  {forecast.nextIncomeDate} · {money(forecast.nextIncomeCents)}
                </b>
              </span>
            )}
          </div>
          <label className="horizon-picker">
            Proyectar hasta
            <input
              type="date"
              min={forecast.asOf}
              value={forecastHorizon || forecast.horizon}
              onChange={(e) => setForecastHorizon(e.target.value)}
            />
          </label>
          <p className="table-note">
            Cambia la fecha para ver si el saldo aguanta hasta donde te importa:
            el próximo pago, el fin de mes o cualquier día del tramo.
          </p>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">DÍA A DÍA</span>
              <h2>Lo que va a pasar</h2>
            </div>
            <strong>{forecast.days.length} días</strong>
          </div>
          <div className="forecast-track" aria-hidden="true">
            {forecast.days.map((d) => (
              <span
                key={d.date}
                className={"forecast-bar " + (d.closingCents < 0 ? "neg" : "")}
                title={d.date + ": " + money(d.closingCents)}
                style={{
                  height:
                    Math.max(
                      2,
                      ((d.closingCents - floor) / span) * 100,
                    ) + "%",
                }}
              />
            ))}
          </div>
          <div className="forecast-list">
            {marked.map((d) => (
              <div
                className={
                  "forecast-day " + (d.closingCents < 0 ? "negative" : "")
                }
                key={d.date}
              >
                <span className="forecast-date">{d.date.slice(5)}</span>
                <span className="forecast-events">
                  {d.events
                    .filter((e) => e.origin !== "variable")
                    .map((e) => (
                      <em key={e.label + e.origin}>
                        {e.direction === "income" ? "+" : "−"}
                        {money(e.amountCents)} {e.label}
                      </em>
                    ))}
                </span>
                <b>{money(d.closingCents)}</b>
              </div>
            ))}
          </div>
          <p className="table-note">
            Solo se listan los días con un movimiento previsto. El gasto variable
            corre todos los días y está incluido en el saldo de cada línea.
          </p>
        </section>
      </div>

      <section className="panel assumptions">
        <div>
          <span className="eyebrow">CÓMO SE PROYECTÓ</span>
          <h2>Supuestos visibles</h2>
        </div>
        <ol>
          {forecast.assumptions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>
    </div>
  );
};
