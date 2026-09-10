import type { ChenState } from "./useChen";
export const LoginScreen = ({ state }: { state: ChenState }) => {
  const { session, login, error } = state;
  return (
    <main className="welcome">
      <div className="brand">
        <img
          src="/brand/logo-ca-192.png"
          alt="Caja de Ahorros"
          width={52}
          height={52}
        />
        chen<span>●</span>
      </div>
      <span className="eyebrow">INTELIGENCIA QUE SE QUEDA CONTIGO</span>
      <h1>
        Tu dinero tiene
        <br />
        una historia.
      </h1>
      <p>
        Entiende tus gastos, encuentra patrones y sigue cada explicación hasta
        su origen.
      </p>
      <div className="login-options">
        {session?.customers.map((c) => (
          <button key={c.id} onClick={() => void login(c.id)}>
            <span className="avatar">{c.initials}</span>
            <span>
              Explorar como <strong>{c.name}</strong>
              <small>Tarjeta de demostración · {c.card}</small>
            </span>
            <b>↗</b>
          </button>
        ))}
      </div>
      <small>
        Prototipo independiente para el reto de Caja de Ahorros.
        <br />
        Todos los clientes y movimientos son ficticios.
      </small>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </main>
  );
};
