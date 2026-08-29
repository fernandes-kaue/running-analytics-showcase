import Link from "next/link";
import { ActivitySummary } from "@/components/activity-summary";
import { EmptyState } from "@/components/empty-state";
import { formatDate, formatDistance, formatDuration, formatPace } from "@/lib/format";
import type { Dashboard } from "@/lib/types";

function Progress({ value, label }: { value: number; label: string }) {
  const width = Math.min(100, Math.max(0, value));
  return <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(width)}><div className="progress-bar" style={{ width: `${width}%` }} /></div>;
}

export function DashboardView({ data, userName }: { data: Dashboard; userName: string }) {
  const firstName = userName.trim().split(/\s+/)[0] || userName;
  const maxWeekly = Math.max(1, ...data.semanas.map((week) => week.distancia_km));
  const completelyEmpty = data.resumo_mes.total_atividades === 0 && data.tenis.length === 0 && data.proximas_provas.length === 0;

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Visão geral</p>
          <h1 className="page-title">Olá, {firstName}.</h1>
          <p className="page-description">Acompanhe seu mês, sua constância e o que vem pela frente.</p>
        </div>
        <Link className="button button-primary" href="/atividades/nova">Registrar corrida</Link>
      </header>

      {completelyEmpty ? (
        <EmptyState title="Seu ponto de partida" description="Cadastre seu primeiro tênis e registre uma corrida para começar a construir o seu histórico." action="Cadastrar tênis" href="/tenis/novo" icon="activity" />
      ) : (
        <>
          <section className="grid-metrics" aria-label="Resumo do mês">
            <article className="metric-card"><span className="metric-label">Distância no mês</span><strong className="metric-value">{formatDistance(data.resumo_mes.distancia_km)}</strong></article>
            <article className="metric-card"><span className="metric-label">Tempo em movimento</span><strong className="metric-value">{formatDuration(data.resumo_mes.duracao_segundos)}</strong></article>
            <article className="metric-card"><span className="metric-label">Atividades</span><strong className="metric-value">{data.resumo_mes.total_atividades}</strong></article>
            <article className="metric-card"><span className="metric-label">Pace médio</span><strong className="metric-value">{formatPace(data.resumo_mes.pace_medio_segundos_km)}</strong></article>
          </section>

          <div className="dashboard-grid">
            <div className="dashboard-column">
              <section className="panel" aria-labelledby="weekly-title">
                <div className="panel-header"><h2 className="panel-title" id="weekly-title">Volume nas últimas semanas</h2></div>
                <div className="weekly-chart" aria-label="Distância semanal">
                  {data.semanas.map((week) => (
                    <div className="week-bar-wrap" key={week.inicio} title={`${formatDate(week.inicio, true)}: ${formatDistance(week.distancia_km)}`} role="img" aria-label={`Semana de ${formatDate(week.inicio)} a ${formatDate(week.fim)}: ${formatDistance(week.distancia_km)}`}>
                      <div className="week-bar" data-value={week.distancia_km ? `${week.distancia_km.toLocaleString("pt-BR")} km` : ""} style={{ height: `${Math.max(3, (week.distancia_km / maxWeekly) * 100)}%` }} />
                      <span className="week-label">{formatDate(week.inicio, true)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel" aria-labelledby="recent-title">
                <div className="panel-header"><h2 className="panel-title" id="recent-title">Atividades recentes</h2><Link className="text-link" href="/atividades">Ver todas</Link></div>
                {data.atividades_recentes.length ? <ul className="activity-list">{data.atividades_recentes.map((activity) => <ActivitySummary activity={activity} key={activity.id} />)}</ul> : <EmptyState title="Nenhuma corrida registrada" description="Registre uma atividade para acompanhar distância, tempo e pace." action="Registrar corrida" href="/atividades/nova" icon="activity" />}
              </section>
            </div>

            <div className="dashboard-column">
              <section className="panel" aria-labelledby="shoes-title">
                <div className="panel-header"><h2 className="panel-title" id="shoes-title">Seus tênis</h2><Link className="text-link" href="/tenis">Gerenciar</Link></div>
                {data.tenis.length ? (
                  <ul className="compact-list">
                    {data.tenis.map((shoe) => <li className="compact-row" key={shoe.id}><div style={{ width: "100%" }}><strong className="activity-title">{shoe.modelo}</strong><p className="item-meta"><span>{formatDistance(shoe.km_acumulada)} de {formatDistance(shoe.km_limite)}</span></p><Progress value={shoe.percentual_uso} label={`Uso do tênis ${shoe.modelo}`} /></div></li>)}
                  </ul>
                ) : <EmptyState title="Cadastre seu tênis" description="Associe cada corrida ao equipamento usado e acompanhe a quilometragem." action="Adicionar tênis" href="/tenis/novo" icon="shoe" />}
              </section>

              <section className="panel" aria-labelledby="races-title">
                <div className="panel-header"><h2 className="panel-title" id="races-title">Próximas provas</h2><Link className="text-link" href="/provas">Ver calendário</Link></div>
                {data.proximas_provas.length ? (
                  <ul className="compact-list">{data.proximas_provas.map((race) => <li className="compact-row" key={race.id}><div><strong className="activity-title">{race.nome}</strong><p className="item-meta"><span>{formatDate(race.data)}</span><span>{formatDistance(race.distancia_km)}</span></p></div></li>)}</ul>
                ) : <EmptyState title="Nenhuma prova no radar" description="Adicione uma meta ao calendário para orientar os próximos treinos." action="Adicionar prova" href="/provas/nova" icon="race" />}
              </section>
            </div>
          </div>
        </>
      )}
    </>
  );
}
