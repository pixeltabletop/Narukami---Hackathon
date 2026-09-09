let csrf = "";
export const api = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch("/api" + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-rastro-csrf": csrf,
      ...options.headers,
    },
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.error ?? "No se pudo completar la consulta");
  if (body.csrf) csrf = body.csrf;
  return body as T;
};
export type Customer = {
  id: string;
  name: string;
  initials: string;
  card: string;
};
export type Session = {
  customer: Customer | null;
  customers: Customer[];
  csrf: string;
};
export type ModelStatus = {
  status: "disabled" | "unloaded" | "loading" | "ready" | "error";
};
