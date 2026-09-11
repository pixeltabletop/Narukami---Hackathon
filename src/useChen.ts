import { useEffect, useState } from "react";
import { api, cuandoSePierdaLaSesion, type Session, type ModelStatus } from "./api";
import type { Category, Dashboard } from "../server/domain";
import type { Commitment, PlanningView, PlanInput, Product } from "../server/planning-domain";
import { fromAccount, fromCard, type LedgerRow } from "./ledger";
import type { Forecast } from "../server/forecast";
import type { Fact } from "../server/domain";

export type ChatTurn = {
  id: number;
  role: "cliente" | "asistente";
  text: string;
  facts?: Fact[];
  elapsedMs?: number;
  failed?: boolean;
};
export const useChen = () => {
  const [session, setSession] = useState<Session | null>(null),
    [period, setPeriod] = useState("2026-09"),
    [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [planning, setPlanning] = useState<PlanningView | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [forecastHorizon, setForecastHorizon] = useState("");
  // Operaciones en vuelo. Mientras haya alguna se muestra el loop de la marca:
  // guardar un plan o corregir una categoría toca disco y no es instantáneo.
  const [saving, setSaving] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  // El hilo del asistente vive aqui, no dentro del panel. Si vive en el panel se
  // pierde al cambiar de pestaña, que es justo lo que hace el flujo de abrir la
  // evidencia y volver; y la burbuja flotante, que monta otro panel, tendria un
  // hilo distinto al de la pestaña.
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [thinking, setThinking] = useState(false);
  const track = async <T,>(work: () => Promise<T>) => {
    setSaving((n) => n + 1);
    try {
      return await work();
    } finally {
      setSaving((n) => n - 1);
    }
  };
  const [model, setModel] = useState<ModelStatus>({ status: "disabled" }),
    [tab, setTab] = useState("Resumen"),
    [error, setError] = useState("");
  const [search, setSearch] = useState(""),
    [product, setProduct] = useState<Product | "Todos">("Todos"),
    [category, setCategory] = useState("Todas"),
    [evidence, setEvidence] = useState<{ ids: string[]; title: string } | null>(
      null,
    ),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    // Si la sesion se cae, se vuelve a la pantalla de seleccion de cliente. Es
    // la unica salida limpia: el aviso rojo no se iba solo y obligaba a
    // recargar la pagina a mano en plena demostracion.
    cuandoSePierdaLaSesion(() => {
      // Solo si creiamos tener sesion. Un 401 antes de elegir cliente es lo
      // normal, no una sesion caida, y reaccionar a el devolvia a la pantalla
      // de seleccion justo despues de entrar: el sondeo del modelo del cliente
      // anterior llegaba tarde y tumbaba la eleccion recien hecha.
      setSession((prior) =>
        prior?.customer ? { ...prior, customer: null } : prior,
      );
      setDashboard(null);
      setEvidence(null);
      setError("");
    });
    api<Session>("/session")
      .then(setSession)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!session?.customer) return;
    let active = true;
    setDashboard(null);
    setEvidence(null);
    api<Dashboard>("/dashboard?period=" + period)
      .then((d) => {
        if (active) {
          setDashboard(d);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [session?.customer?.id, period, revision]);
  // La proyección depende del plan: si cambia el presupuesto variable o un
  // compromiso, el veredicto tiene que moverse en la misma pantalla.
  useEffect(() => {
    if (!session?.customer) return;
    let active = true;
    setForecast(null);
    api<Forecast>("/forecast" + (forecastHorizon ? "?horizon=" + forecastHorizon : ""))
      .then((f) => { if (active) setForecast(f); })
      .catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [session?.customer?.id, forecastHorizon, planning?.variableBudgetCents, planning?.committedCents]);
  useEffect(() => {
    if (!session?.customer) return;
    let active = true;
    setPlanning(null);
    api<PlanningView>("/planning").then((view) => { if (active) setPlanning(view); }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [session?.customer?.id]);
  useEffect(() => {
    if (!session?.customer) return;
    let active = true;
    const poll = () =>
      api<ModelStatus>("/model")
        .then((s) => {
          if (active) setModel(s);
        })
        .catch(() => {});
    void poll();
    const timer = setInterval(poll, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [session?.customer?.id]);
  const login = async (id: string) => {
    try {
      const s = await api<Session>("/session", {
        method: "POST",
        body: JSON.stringify({ customerId: id }),
      });
      setDashboard(null);
      setEvidence(null);
      setSearch("");
      setCategory("Todas");
      setSession((prior) => ({ ...prior!, ...s }));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const correct = async (id: string, c: Category) => {
    try {
      await track(() =>
        api("/movements/" + id + "/category", {
          method: "PATCH",
          body: JSON.stringify({ category: c }),
        }),
      );
      setError("");
      setRevision((n) => n + 1);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const load = () => {
    api<ModelStatus>("/model/load", { method: "POST", body: "{}" })
      .then(setModel)
      .catch((e) => setError(e.message));
  };
  const savePlan = async (plan: PlanInput) => {
    try {
      setPlanning(await track(() => api<PlanningView>("/planning", { method: "PUT", body: JSON.stringify(plan) })));
      setError("");
    } catch (e) { setError((e as Error).message); }
  };
  const setCommitment = async (id: string, state: Commitment["state"]) => {
    try {
      setPlanning(await track(() => api<PlanningView>("/commitments/" + id, { method: "PATCH", body: JSON.stringify({ state }) })));
      setError("");
    } catch (e) { setError((e as Error).message); }
  };
  const showEvidence = (ids: string[], title: string) => {
    setEvidence({ ids, title });
    setTab("Movimientos");
    setSearch("");
    setCategory("Todas");
  };

  const customer = session?.customer;
  // La evidencia siempre apunta a movimientos de tarjeta: cuando esta activa se
  // muestra solo eso, sin que el filtro de producto la esconda.
  const cardRows: LedgerRow[] = dashboard
    ? (evidence
        ? dashboard.evidence.filter((m) => evidence.ids.includes(m.id))
        : dashboard.movements
      ).map(fromCard)
    : [];
  const accountRows: LedgerRow[] =
    evidence || !planning
      ? []
      : planning.accountMovements
          .filter((m) => m.date.startsWith(period))
          .map(fromAccount);
  const rows = [...cardRows, ...accountRows]
    .filter(
      (r) =>
        (evidence || product === "Todos" || r.product === product) &&
        (category === "Todas" || r.category === category) &&
        (r.title + " " + r.detail).toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return {
    turns,
    setTurns,
    question,
    setQuestion,
    thinking,
    setThinking,
    session,
    period,
    setPeriod,
    dashboard,
    planning,
    forecast,
    saving,
    chatOpen,
    setChatOpen,
    forecastHorizon,
    setForecastHorizon,
    model,
    tab,
    setTab,
    error,
    search,
    setSearch,
    category,
    setCategory,
    product,
    setProduct,
    evidence,
    setEvidence,
    revision,
    correct,
    login,
    load,
    savePlan,
    setCommitment,
    showEvidence,
    customer,
    rows,
  };
};
export type ChenState = ReturnType<typeof useChen>;
