import { useEffect, useRef, useState } from "react";
import { api, postAudio, type VoiceStatus } from "./api";
import { WavRecorder } from "./wav-recorder";
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
  "¿En qué rubro he gastado más en los últimos tres meses?",
  "¿Cuánto llevo gastado en Restaurantes?",
  "¿Cuánto he gastado en Nube Música?",
  "Si aparto cien dólares al mes, ¿cuánto junto hasta fin de año?",
  "¿Por qué gasté más este mes?",
  "¿Qué me cobran seguido?",
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
  // El dictado se transcribe en el mismo equipo con Whisper dentro de QVAC. La
  // API de voz del navegador manda el audio al servidor del fabricante, y eso
  // sacaría del dispositivo un dato del cliente, que es justo lo prohibido.
  const recorder = useRef(new WavRecorder());
  const [voice, setVoice] = useState<"idle" | "preparando" | "grabando" | "transcribiendo">("idle");
  const [voiceError, setVoiceError] = useState("");
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (voice !== "grabando") return;
    const timer = setInterval(
      () => setSeconds(Math.round(recorder.current.seconds)),
      400,
    );
    return () => clearInterval(timer);
  }, [voice]);
  const dictate = async () => {
    setVoiceError("");
    if (voice === "grabando") {
      setVoice("transcribiendo");
      try {
        const wav = await recorder.current.stop();
        const out = await postAudio(wav);
        // El texto se deja en el campo, no se envía solo: dictar y que la
        // pregunta salga sin poder corregirla es la peor versión de esto.
        if (out.text) setQuestion(out.text);
        else setVoiceError("No se escuchó nada. Intenta de nuevo, más cerca.");
      } catch (e) {
        setVoiceError((e as Error).message);
      } finally {
        setVoice("idle");
        setSeconds(0);
      }
      return;
    }
    try {
      const status = await api<VoiceStatus>("/voice");
      if (status.status === "disabled") {
        setVoiceError("El dictado está apagado en este modo.");
        return;
      }
      if (status.status !== "ready") {
        setVoice("preparando");
        await api<VoiceStatus>("/voice/load", { method: "POST", body: "{}" });
      }
      await recorder.current.start();
      setVoice("grabando");
    } catch (e) {
      setVoice("idle");
      setVoiceError(
        (e as Error).message.includes("Permission") ||
          (e as Error).name === "NotAllowedError"
          ? "Necesito permiso del micrófono para dictar."
          : (e as Error).message,
      );
    }
  };
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
          type="button"
          className={"mic-button " + (voice === "grabando" ? "recording" : "")}
          aria-label={
            voice === "grabando" ? "Detener el dictado" : "Dictar la pregunta"
          }
          aria-pressed={voice === "grabando"}
          disabled={voice === "preparando" || voice === "transcribiendo"}
          onClick={() => void dictate()}
        >
          {voice === "grabando" ? "■" : "🎙"}
        </button>
        <button
          aria-label="Enviar pregunta"
          disabled={!ready || thinking || question.trim().length < 3}
        >
          ↑
        </button>
      </form>
      {voice !== "idle" && (
        <p role="status" className="voice-status">
          {voice === "preparando"
            ? "Preparando el dictado en este equipo…"
            : voice === "grabando"
              ? "Escuchando… " + seconds + " s. Toca el cuadro para terminar."
              : "Transcribiendo en este equipo…"}
        </p>
      )}
      {voiceError && (
        <p role="alert" className="error">
          {voiceError}
        </p>
      )}
      <p className="table-note">
        {compact
          ? "Chen no mueve dinero. Si los datos no alcanzan, lo dice."
          : "El asistente no mueve dinero, no ejecuta consultas y no da consejo financiero. Si los datos no alcanzan para responder, lo dice."}
      </p>
    </section>
  );
};
