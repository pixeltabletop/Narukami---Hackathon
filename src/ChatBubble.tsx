import { useEffect, useRef } from "react";
import { ChatPanel } from "./ChatPanel";
import type { ChenState } from "./useChen";

// Chen tiene que estar a un toque desde cualquier pantalla, no solo en su
// pestaña: la pregunta aparece mientras el cliente mira otra cosa.
export const ChatBubble = ({ state }: { state: ChenState }) => {
  const { chatOpen, setChatOpen, tab, model } = state;
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!chatOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setChatOpen(false);
    };
    document.addEventListener("keydown", onKey);
    panel.current?.querySelector("input")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [chatOpen, setChatOpen]);
  // En su propia pestaña el asistente ya está en pantalla completa: la burbuja
  // encima solo estorbaría.
  if (tab === "Asistente") return null;
  return (
    <>
      <button
        className={"chat-bubble-button " + (chatOpen ? "open" : "")}
        aria-expanded={chatOpen}
        aria-label={chatOpen ? "Cerrar el asistente" : "Abrir el asistente Chen"}
        onClick={() => setChatOpen(!chatOpen)}
      >
        {chatOpen ? (
          <span aria-hidden="true">×</span>
        ) : (
          <>
            <img src="/brand/logo-ca-64.png" alt="" aria-hidden="true" />
            <span>Pregúntale a Chen</span>
            {model.status === "ready" && (
              <i className="chat-dot" aria-hidden="true" />
            )}
          </>
        )}
      </button>
      {chatOpen && (
        <div className="chat-dock" ref={panel} role="dialog" aria-label="Asistente Chen">
          <ChatPanel state={state} compact />
        </div>
      )}
    </>
  );
};
