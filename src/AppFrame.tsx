import type { ReactNode } from "react";
import type { RastroState } from "./useRastro";
import { BrandLoader } from "./BrandLoader";
export const AppFrame = ({
  state,
  children,
}: {
  state: RastroState;
  children: ReactNode;
}) => {
  const { customer, session, tab, setTab, setEvidence, model, login, saving } = state;
  if (!customer || !session) return null;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/">
          <img
            src="/brand/logo-ca-192.png"
            alt="Caja de Ahorros"
            width={34}
            height={34}
          />
          rastro<span>●</span>
        </a>
        <p className="sidebar-caption">TU DINERO, MÁS CLARO.</p>
        <nav aria-label="Navegación principal">
          {["Resumen", "Movimientos", "Recurrentes", "Organiza", "Proyección", "Escenarios", "Asistente", "Guía"].map((name, i) => (
            <button
              className={tab === name ? "active" : ""}
              key={name}
              onClick={() => {
                setTab(name);
                setEvidence(null);
              }}
            >
              <span aria-hidden="true">{["◫", "≡", "↻", "◎", "◴", "◇", "✦", "?"][i]}</span>
              {name}
            </button>
          ))}
        </nav>
        <div className="privacy-card">
          {model.status === "loading" ? (
            <video
              className="model-loop"
              src="/brand/ca-loop.mp4"
              poster="/brand/ca-loop-poster.png"
              autoPlay
              loop
              muted
              playsInline
              aria-label="Cargando el modelo local"
            />
          ) : (
            <span>⌂</span>
          )}
          <strong>Inteligencia en casa</strong>
          <p>
            QVAC procesa el análisis en este equipo, dentro del entorno bancario
            simulado.
          </p>
          <span
            className={"status " + (model.status === "ready" ? "ready" : "")}
          >
            {model.status === "ready"
              ? "Modelo disponible"
              : model.status === "loading"
                ? "Cargando modelo"
                : model.status === "disabled"
                  ? "IA pendiente de configurar"
                  : "Modelo sin cargar"}
          </span>
        </div>
        <div className="sidebar-bottom">
          <span className="avatar">{customer.initials}</span>
          <div>
            <strong>{customer.name}</strong>
            <select
              aria-label="Cambiar cliente de demo"
              value={customer.id}
              onChange={(e) => void login(e.target.value)}
            >
              {session?.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <span>
            Banca personal <span className="breadcrumb">/</span> Mi tarjeta{" "}
            <span className="breadcrumb">/</span> <strong>{tab}</strong>
          </span>
          <select
            className="mobile-customer"
            aria-label="Cliente de demo en móvil"
            value={customer.id}
            onChange={(e) => void login(e.target.value)}
          >
            {session?.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <span className="demo-badge">
            <img
              src="/brand/logo-ca-64.png"
              alt=""
              aria-hidden="true"
              width={16}
              height={16}
            />
            CAJA DE AHORROS · PROTOTIPO
          </span>
        </header>
        <div className="page-content">{children}</div>
        {saving > 0 && (
          <div className="saving-toast">
            <BrandLoader label="Guardando en este equipo…" size={30} />
          </div>
        )}
      </main>
    </div>
  );
};
