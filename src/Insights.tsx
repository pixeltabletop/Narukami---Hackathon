import { useState } from "react";
import type { Dashboard, Fact } from "../server/domain";
import { api, type ModelStatus } from "./api";
type Answer = {
  summary: string;
  facts: Fact[];
  elapsedMs: number;
  provider: string;
};
export const Insights = ({
  dashboard,
  model,
  onEvidence,
  onLoad,
}: {
  dashboard: Dashboard;
  model: ModelStatus;
  onEvidence: (ids: string[], title: string) => void;
  onLoad: () => void;
}) => {
  const [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState<Answer | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const ask = async (text: string) => {
    setBusy(true);
    setError("");
    setAnswer(null);
    try {
      setAnswer(
        await api<Answer>("/explain", {
          method: "POST",
          body: JSON.stringify({ question: text, period: dashboard.period }),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (model.status === "disabled") {
    return (
      <section className="insight-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">TU DINERO, CON CONTEXTO</span>
            <h2>Lo que muestran tus gastos.</h2>
          </div>
          <span className="ai-mark">Cálculo verificable</span>
        </div>
        <p className="muted">
          Estos hallazgos provienen del cálculo de movimientos. Puedes revisar
          su evidencia.
        </p>
        {dashboard.facts.slice(0, 3).map((f) => (
          <button
            className="fact"
            key={f.id}
            onClick={() => onEvidence(f.movementIds, f.text)}
          >
            {f.text}
            <span>Ver movimientos ↗</span>
          </button>
        ))}
        <div className="model-notice">
          <strong>IA pendiente de configurar</strong>
          <p>
            La estructura está preparada para conectar QVAC en el equipo de
            destino. No se cargan ni descargan modelos en este modo.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="insight-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">TU DINERO, CON CONTEXTO</span>
          <h2>Conecta los puntos.</h2>
        </div>
        <span className="ai-mark">✦ Chen AI</span>
      </div>
      <p className="muted">
        Pregunta por tus gastos. Abre los movimientos detrás de cada
        explicación.
      </p>
      <div className="suggestions">
        {[
          "¿Por qué gasté más?",
          "¿Qué me cobran seguido?",
          "¿En qué se me fue el dinero?",
        ].map((q) => (
          <button
            disabled={busy || model.status !== "ready"}
            key={q}
            onClick={() => {
              setQuestion(q);
              void ask(q);
            }}
          >
            {q}
            <span>↗</span>
          </button>
        ))}
      </div>
      {model.status !== "ready" && (
        <div className="model-notice">
          <strong>
            {model.status === "loading"
              ? "Preparando la inteligencia local…"
              : "Activa la explicación con QVAC"}
          </strong>
          <p>
            {model.status === "loading"
              ? "El modelo se está cargando. Puedes explorar tus gastos mientras tanto."
              : "El primer inicio puede descargar el modelo. El análisis posterior se ejecuta en este equipo."}
          </p>
          <button
            className="primary"
            disabled={model.status === "loading"}
            onClick={onLoad}
          >
            {model.status === "error"
              ? "Reintentar carga"
              : "Cargar modelo local"}
          </button>
        </div>
      )}
      <form
        className="question-form"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <input
          aria-label="Pregunta sobre tus gastos"
          maxLength={600}
          minLength={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="¿Qué quieres entender de tus gastos?"
          required
        />
        <button
          aria-label="Enviar pregunta"
          disabled={
            busy || model.status !== "ready" || question.trim().length < 3
          }
        >
          ↑
        </button>
      </form>
      {busy && (
        <p role="status" className="thinking">
          ✦ QVAC está revisando los hechos del período…
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {answer && (
        <div className="answer">
          <span className="eyebrow">EXPLICACIÓN GENERADA CON QVAC</span>
          <p>{answer.summary}</p>
          {answer.facts.map((f) => (
            <button
              className="fact"
              key={f.id}
              onClick={() => onEvidence(f.movementIds, f.text)}
            >
              {f.text}
              <span>Ver movimientos ↗</span>
            </button>
          ))}
          <small>
            Inferencia local · {(answer.elapsedMs / 1000).toFixed(1)} s · Revisa
            la evidencia de cada afirmación.
          </small>
        </div>
      )}
    </section>
  );
};
