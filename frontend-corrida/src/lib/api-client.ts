import type { ApiErrorBody, FieldErrors } from "@/lib/types";

export class ClientApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fields: FieldErrors = {},
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

function flattenFields(fields: ApiErrorBody["fields"]): FieldErrors {
  if (!fields) return {};
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, Array.isArray(value) ? value[0] ?? "Valor inválido." : value]),
  );
}

export async function apiMutation<T>(path: string, init: RequestInit, redirectOnUnauthorized = true): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (response.status === 401 && redirectOnUnauthorized) {
    window.location.assign("/entrar");
    throw new ClientApiError("Sua sessão expirou. Entre novamente.", 401);
  }

  if (!response.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // The status and generic message remain authoritative for non-JSON failures.
    }
    throw new ClientApiError(body.error ?? "Não foi possível concluir a operação.", response.status, flattenFields(body.fields));
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (response.status === 401) {
    window.location.assign("/entrar");
    throw new ClientApiError("Sua sessão expirou. Entre novamente.", 401);
  }
  if (!response.ok) throw new ClientApiError("Não foi possível carregar os dados.", response.status);
  return (await response.json()) as T;
}
