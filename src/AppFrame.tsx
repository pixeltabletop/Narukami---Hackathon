import type { ReactNode } from "react";
import type { RastroState } from "./useRastro";
export const AppFrame = ({
  state,
  children,
}: {
  state: RastroState;
  children: ReactNode;
}) => {
  const { customer, session, tab, setTab, setEvidence, model, login } = state;
  if (!customer || !session) return null;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/">
          rastro<span>●</span>
        </a>
        <p className="sidebar-caption">TU DINERO, MÁS CLARO.</p>
        <nav aria-label="Navegación principal">
          {["Resumen", "Movimientos", "Recurrentes"].map((name, i) => (
            <button
              className={tab === name ? "active" : ""}
              key={name}
              onClick={() => {
                setTab(name);
                setEvidence(null);
              }}
            >
              <span aria-hidden="true">{["◫", "≡", "↻"][i]}</span>
              {name}
            </button>
          ))}
        </nav>
        <div className="privacy-card">
          <span>⌂</span>
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
          <span className="demo-badge">DEMO · DATOS SINTÉTICOS</span>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
};
