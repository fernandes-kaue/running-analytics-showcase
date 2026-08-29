import Link from "next/link";
import { formatDate, formatDistance, formatPace } from "@/lib/format";
import type { Atividade } from "@/lib/types";

export function ActivitySummary({ activity }: { activity: Atividade }) {
  return (
    <li className="activity-row">
      <div className="activity-main">
        <p className="activity-title"><Link href={`/atividades/${activity.id}/editar`}>Corrida em {formatDate(activity.data, true)}</Link></p>
        <p className="activity-meta"><span>{activity.tenis.modelo}</span>{activity.observacoes ? <span>{activity.observacoes}</span> : null}</p>
      </div>
      <div className="activity-stats">
        <span className="activity-distance">{formatDistance(activity.distancia_km)}</span>
        <span className="activity-pace">{formatPace(activity.pace_medio_segundos_km)}</span>
      </div>
    </li>
  );
}
