"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";
import { apiGet, apiMutation, ClientApiError } from "@/lib/api-client";
import { formatDate, formatDistance, formatDuration, formatPace } from "@/lib/format";
import type { Atividade, ListaAtividades } from "@/lib/types";

export function ActivityList({ initial }: { initial: ListaAtividades }) {
  const [activities, setActivities] = useState(initial.dados);
  const [cursor, setCursor] = useState(initial.proximo_cursor);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  async function remove(activity: Atividade) {
    if (!window.confirm(`Excluir a corrida de ${formatDate(activity.data)}? Esta ação não pode ser desfeita.`)) return;
    setPendingId(activity.id);
    setError("");
    try {
      await apiMutation<void>(`/atividades/${activity.id}`, { method: "DELETE", body: "{}" });
      setActivities((current) => current.filter((item) => item.id !== activity.id));
    } catch (caught) {
      setError(caught instanceof ClientApiError ? caught.message : "Não foi possível excluir a atividade.");
    } finally {
      setPendingId(null);
    }
  }

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const page = await apiGet<ListaAtividades>(`/atividades?limit=20&cursor=${encodeURIComponent(cursor)}`);
      setActivities((current) => [...current, ...page.dados]);
      setCursor(page.proximo_cursor);
    } catch (caught) {
      setError(caught instanceof ClientApiError ? caught.message : "Não foi possível carregar mais atividades.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <>
      {error ? <div className="alert" role="alert" style={{ marginBottom: "1rem" }}>{error}</div> : null}
      {activities.length === 0 ? (
        <EmptyState title="Nenhuma atividade registrada" description="Registre sua próxima corrida para continuar acompanhando a evolução." action="Registrar corrida" href="/atividades/nova" icon="activity" />
      ) : <ul className="card-grid">
        {activities.map((activity) => (
          <li className="item-card" key={activity.id}>
            <div className="item-card-header">
              <div>
                <h2 className="item-title">Corrida em {formatDate(activity.data, true)}</h2>
                <p className="item-meta"><span>{activity.tenis.modelo}</span><span>{formatDuration(activity.duracao_segundos)}</span></p>
              </div>
              <div className="item-actions">
                <Link className="icon-button" href={`/atividades/${activity.id}/editar`} aria-label={`Editar corrida de ${formatDate(activity.data)}`}><Icon name="edit" width={18} height={18} /></Link>
                <button className="icon-button danger" type="button" onClick={() => remove(activity)} disabled={pendingId === activity.id} aria-label={`Excluir corrida de ${formatDate(activity.data)}`}><Icon name="trash" width={18} height={18} /></button>
              </div>
            </div>
            <div className="grid-metrics" style={{ marginTop: "1rem", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <div><span className="metric-label">Distância</span><strong>{formatDistance(activity.distancia_km)}</strong></div>
              <div><span className="metric-label">Pace</span><strong>{formatPace(activity.pace_medio_segundos_km)}</strong></div>
            </div>
            {activity.observacoes ? <p className="page-description" style={{ fontSize: "0.84rem", marginTop: "1rem" }}>{activity.observacoes}</p> : null}
          </li>
        ))}
      </ul>}
      {cursor ? <div className="load-more"><button className="button button-secondary" type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "Carregando…" : "Carregar mais"}</button></div> : null}
    </>
  );
}
