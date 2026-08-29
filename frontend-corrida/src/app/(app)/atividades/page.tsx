import type { Metadata } from "next";
import { ActivityList } from "@/components/activity-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { serverApi } from "@/lib/api-server";
import type { ListaAtividades } from "@/lib/types";

export const metadata: Metadata = { title: "Atividades" };
export default async function ActivitiesPage() {
  const result = await serverApi<ListaAtividades>("/atividades?limit=20");
  return <><PageHeader eyebrow="Histórico" title="Atividades" description="Todas as suas corridas manuais, com distância, tempo e equipamento." action="Nova atividade" href="/atividades/nova" />{result.dados.length ? <ActivityList initial={result} /> : <EmptyState title="Nenhuma atividade registrada" description="Depois de cadastrar um tênis, registre sua primeira corrida e acompanhe a evolução." action="Registrar corrida" href="/atividades/nova" icon="activity" />}</>;
}
