import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import { BrandLoader } from "./BrandLoader";
import type { Fact } from "../server/domain";
import type { ChenState } from "./useChen";

type Turn = {
  id: number;
  role: "cliente" | "asistente";
  text: string;
  facts?: Fact[];
  elapsedMs?: number;
  failed?: boolean;
};

const suggestions = [
  "¿En qué se me fue el dinero?",
  "¿Por qué gasté más este mes?",
  "¿Qué me cobran seguido?",
  "¿Cuánto moví a mi cuenta de ahorros?",
  "¿Qué compras todavía no se han contabilizado?",
];

export const ChatPanel = ({
  state,
  compact = false,
}: {
  state: ChenState;
  compact?: boolean;
}) => {
  const { dashboard, model, showEvidence, load } = state;
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [thinking, setThinking] = useState(false);
  const thread = useRef<HTMLDivElement>(null);
  useEffect(() => {
    thread.current?.scrollTo({ top: thread.current.scrollHeight });
  }, [turns.length, thinking]);
  if (!dashboard) return <p role="status">Cargando tus movimientos…</p>;

  const ask = async (text: string) => {
    const clean = text.trim();
    if (clean.length < 3 || thinking) return;
    setQuestion("");
    setTurns((prior) => [
      ...prior,
      { id: Date.now(), role: "cliente", text: clean },
    ]);
    setThinking(true);
    try {
      const answer = await api<{
        summary: string;
        facts: Fact[];
        elapsedMs: number;
      }>("/explain", {
        method: "POST",
        body: JSON.stringify({ question: clean, period: dashboard.period }),
      });
      setTurns((prior) => [
        ...prior,
        {
          id: Date.now() + 1,
          role: "asistente",
          text: answer.summary,
          facts: answer.facts,
          elapsedMs: answer.elapsedMs,
        },
      ]);
    } catch (e) {
      setTurns((prior) => [
        ...prior,
        {
          id: Date.now() + 1,
          role: "asistente",
          text: (e as Error).message,
          failed: true,
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const ready = model.status === "ready";
  return (
    <section className={compact ? "panel chat-panel compact" : "panel chat-panel"}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">ASISTENTE EN ESTE EQUIPO</span>
          <h2>Pregúntale a tus movimientos</h2>
        </div>
        <span className="ai-mark">✦ Inferencia local</span>
      </div>
      {!compact && (
        <p className="muted">
          El asistente no redacta libremente: clasifica tu pregunta, elige entre
          una y tres evidencias y la respuesta se arma con importes ya
          calculados. Cada afirmación se puede abrir hasta los movimientos que
          la sostienen.
        </p>
      )}

      {!ready && (
        <div className="model-notice">
          <strong>
            {model.status === "loading"
              ? "Preparando la inteligencia local…"
              : model.status === "disabled"
                ? "El asistente está apagado en este modo"
                : "Activa el asistente local"}
          </strong>
          <p>
            {model.status === "loading"
              ? "El modelo se está cargando en este equipo. Puedes seguir explorando mientras tanto."
              : model.status === "disabled"
                ? "Esta entrega corre sin modelos cargados. Habilita QVAC en el equipo de demostración para conversar."
                : "El primer inicio puede descargar el modelo. Después todo ocurre en este equipo, sin salir a internet."}
          </p>
          {model.status !== "disabled" && (
            <button
              className="primary"
              disabled={model.status === "loading"}
              onClick={load}
            >
              {model.status === "error"
                ? "Reintentar carga"
                : "Cargar modelo local"}
            </button>
          )}
        </div>
      )}

      <div className="chat-thread" ref={thread}>
        {turns.length === 0 && !thinking && (
          <p className="chat-empty">
            Escribe una pregunta o toca una de las sugerencias. Todo se responde
            con los datos de este cliente y en este equipo.
          </p>
        )}
        {turns.map((turn) => (
          <div className={"chat-turn " + turn.role} key={turn.id}>
            <span className="chat-role">
              {turn.role === "cliente" ? "Tú" : "Asistente"}
            </span>
            <div className={turn.failed ? "chat-bubble failed" : "chat-bubble"}>
              <p>{turn.text}</p>
              {turn.facts?.map((fact) => (
                <button
                  className="fact"
                  key={fact.id}
                  onClick={() => showEvidence(fact.movementIds, fact.text)}
                >
                  {fact.text}
                  <span>Ver movimientos ↗</span>
                </button>
              ))}
              {turn.elapsedMs !== undefined && (
                <small>
                  Inferencia local · {(turn.elapsedMs / 1000).toFixed(1)} s
                </small>
              )}
            </div>
          </div>
        ))}
        {thinking && (
          <BrandLoader label="Revisando los hechos del período en este equipo…" />
        )}
      </div>

      <div className="suggestions chat-suggestions">
        {(compact ? suggestions.slice(0, 3) : suggestions).map((item) => (
          <button
            key={item}
            disabled={!ready || thinking}
            onClick={() => void ask(item)}
          >
            {item}
            <span>↗</span>
          </button>
        ))}
      </div>

      <form
        className="question-form"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(question);
        }}
      >
        <input
          aria-label="Pregunta para el asistente"
          maxLength={600}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="¿Qué quieres entender de tu dinero?"
        />
        <button
          aria-label="Enviar pregunta"
          disabled={!ready || thinking || question.trim().length < 3}
        >
          ↑
        </button>
      </form>
      <p className="table-note">
        {compact
          ? "Chen no mueve dinero. Si los datos no alcanzan, lo dice."
          : "El asistente no mueve dinero, no ejecuta consultas y no da consejo financiero. Si los datos no alcanzan para responder, lo dice."}
      </p>
    </section>
  );
};
