import { useEffect, useState } from "react";
import { api, type Session, type ModelStatus } from "./api";
import type { Category, Dashboard } from "../server/domain";
export const useRastro = () => {
  const [session, setSession] = useState<Session | null>(null),
    [period, setPeriod] = useState("2026-09"),
    [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [model, setModel] = useState<ModelStatus>({ status: "disabled" }),
    [tab, setTab] = useState("Resumen"),
    [error, setError] = useState("");
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("Todas"),
    [evidence, setEvidence] = useState<{ ids: string[]; title: string } | null>(
      null,
    ),
    [revision, setRevision] = useState(0);
  useEffect(() => {
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
      await api("/movements/" + id + "/category", {
        method: "PATCH",
        body: JSON.stringify({ category: c }),
      });
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
  const showEvidence = (ids: string[], title: string) => {
    setEvidence({ ids, title });
    setTab("Movimientos");
    setSearch("");
    setCategory("Todas");
  };

  const customer = session?.customer;
  const rows = dashboard
    ? (evidence
        ? dashboard.evidence.filter((m) => evidence.ids.includes(m.id))
        : dashboard.movements
      ).filter(
        (m) =>
          (category === "Todas" || m.category === category) &&
          (m.merchant + " " + m.description)
            .toLowerCase()
            .includes(search.toLowerCase()),
      )
    : [];
  return {
    session,
    period,
    setPeriod,
    dashboard,
    model,
    tab,
    setTab,
    error,
    search,
    setSearch,
    category,
    setCategory,
    evidence,
    setEvidence,
    revision,
    correct,
    login,
    load,
    showEvidence,
    customer,
    rows,
  };
};
export type RastroState = ReturnType<typeof useRastro>;
