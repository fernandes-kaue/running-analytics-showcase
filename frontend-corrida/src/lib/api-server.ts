import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Usuario } from "@/lib/types";

const internalUrl = (process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3333").replace(/\/$/, "");

export class ServerApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ServerApiError";
  }
}

export async function serverApi<T>(path: string): Promise<T> {
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(`${internalUrl}${path}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });

  if (response.status === 401) redirect("/entrar");
  if (!response.ok) throw new ServerApiError("Não foi possível carregar os dados.", response.status);
  return (await response.json()) as T;
}

export async function readSession(): Promise<Usuario | null> {
  const cookieHeader = (await cookies()).toString();
  if (!cookieHeader) return null;
  const response = await fetch(`${internalUrl}/auth/sessao`, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new ServerApiError("Não foi possível verificar sua sessão.", response.status);
  const body = (await response.json()) as { usuario: Usuario };
  return body.usuario;
}

export async function requireSession(): Promise<Usuario> {
  const user = await readSession();
  if (!user) redirect("/entrar");
  return user;
}
