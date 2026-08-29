"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";
import { apiMutation, ClientApiError } from "@/lib/api-client";
import { formatDistance } from "@/lib/format";
import type { Tenis } from "@/lib/types";

export function ShoeList({ initial }: { initial: Tenis[] }) {
  const [shoes, setShoes] = useState(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function remove(shoe: Tenis) {
    if (!window.confirm(`Excluir o tênis “${shoe.modelo}”?`)) return;
    setPendingId(shoe.id); setError("");
    try {
      await apiMutation<void>(`/tenis/${shoe.id}`, { method: "DELETE", body: "{}" });
      setShoes((current) => current.filter((item) => item.id !== shoe.id));
    } catch (caught) {
      if (caught instanceof ClientApiError && caught.status === 409) setError("Este tênis possui atividades vinculadas e não pode ser excluído.");
      else setError(caught instanceof ClientApiError ? caught.message : "Não foi possível excluir o tênis.");
    } finally { setPendingId(null); }
  }

  return <>{error ? <div className="alert" role="alert" style={{ marginBottom: "1rem" }}>{error}</div> : null}{shoes.length === 0 ? <EmptyState title="Nenhum tênis cadastrado" description="Adicione um tênis para associá-lo às suas corridas." action="Adicionar tênis" href="/tenis/novo" icon="shoe" /> : <ul className="card-grid">{shoes.map((shoe) => {
    const progress = Math.min(100, Math.max(0, shoe.percentual_uso));
    return <li className="item-card" key={shoe.id}><div className="item-card-header"><div><h2 className="item-title">{shoe.modelo}</h2><p className="item-meta"><span>{formatDistance(shoe.km_acumulada)} percorridos</span></p></div><div className="item-actions"><Link className="icon-button" href={`/tenis/${shoe.id}/editar`} aria-label={`Editar ${shoe.modelo}`}><Icon name="edit" width={18} height={18} /></Link><button className="icon-button danger" type="button" onClick={() => remove(shoe)} disabled={pendingId === shoe.id} aria-label={`Excluir ${shoe.modelo}`}><Icon name="trash" width={18} height={18} /></button></div></div><div className="progress-track" role="progressbar" aria-label={`Vida útil usada de ${shoe.modelo}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><div className="progress-bar" style={{ width: `${progress}%` }} /></div><p className="item-meta" style={{ justifyContent: "space-between" }}><span>{shoe.percentual_uso.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% usado</span><span>Limite: {formatDistance(shoe.km_limite)}</span></p></li>;
  })}</ul>}</>;
}
