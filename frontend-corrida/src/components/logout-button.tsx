"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { apiMutation, ClientApiError } from "@/lib/api-client";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await apiMutation<void>("/auth/sair", { method: "POST", body: "{}" });
      router.replace("/entrar");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ClientApiError ? caught.message : "Não foi possível sair agora.");
    } finally {
      setPending(false);
    }
  }

  return compact ? (
    <><button className="icon-button" type="button" onClick={logout} disabled={pending} aria-label="Sair da conta"><Icon name="logout" width={19} height={19} /></button>{error ? <span className="field-error" role="alert" style={{ position: "absolute", top: "4.2rem", right: "1rem", background: "white", padding: ".5rem" }}>{error}</span> : null}</>
  ) : (
    <><button className="button button-link" type="button" onClick={logout} disabled={pending}><Icon name="logout" width={17} height={17} />{pending ? "Saindo…" : "Sair da conta"}</button>{error ? <p className="field-error" role="alert">{error}</p> : null}</>
  );
}
