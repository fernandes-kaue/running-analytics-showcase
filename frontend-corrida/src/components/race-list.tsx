"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";
import { apiMutation, ClientApiError } from "@/lib/api-client";
import { formatDate, formatDistance, todayCivilDate } from "@/lib/format";
import type { Prova } from "@/lib/types";

export function RaceList({ initial }: { initial: Prova[] }) {
  const [races, setRaces] = useState(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function remove(race: Prova) {
    if (!window.confirm(`Excluir a prova “${race.nome}”?`)) return;
    setPendingId(race.id); setError("");
    try { await apiMutation<void>(`/provas/${race.id}`, { method: "DELETE", body: "{}" }); setRaces((current) => current.filter((item) => item.id !== race.id)); }
    catch (caught) { setError(caught instanceof ClientApiError ? caught.message : "Não foi possível excluir a prova."); }
    finally { setPendingId(null); }
  }
  return <>{error ? <div className="alert" role="alert" style={{ marginBottom: "1rem" }}>{error}</div> : null}{races.length === 0 ? <EmptyState title="Nenhuma prova cadastrada" description="Adicione uma prova para manter sua próxima meta no radar." action="Adicionar prova" href="/provas/nova" icon="race" /> : <ul className="card-grid">{races.map((race) => { const past = race.data < todayCivilDate(); return <li className="item-card" key={race.id}><div className="item-card-header"><div><p className="eyebrow" style={{ marginBottom: "0.45rem", color: past ? "var(--ink-soft)" : undefined }}>{past ? "Concluída" : "Próxima prova"}</p><h2 className="item-title">{race.nome}</h2><p className="item-meta"><span>{formatDate(race.data)}</span><span>{formatDistance(race.distancia_km)}</span></p></div><div className="item-actions"><Link className="icon-button" href={`/provas/${race.id}/editar`} aria-label={`Editar ${race.nome}`}><Icon name="edit" width={18} height={18} /></Link><button className="icon-button danger" type="button" onClick={() => remove(race)} disabled={pendingId === race.id} aria-label={`Excluir ${race.nome}`}><Icon name="trash" width={18} height={18} /></button></div></div></li>; })}</ul>}</>;
}
