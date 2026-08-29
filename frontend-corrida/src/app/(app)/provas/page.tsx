import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RaceList } from "@/components/race-list";
import { serverApi } from "@/lib/api-server";
import type { Lista, Prova } from "@/lib/types";

export const metadata: Metadata = { title: "Provas" };
export default async function RacesPage() {
  const { dados } = await serverApi<Lista<Prova>>("/provas");
  return <><PageHeader eyebrow="Calendário" title="Provas" description="Mantenha seus próximos objetivos e distâncias em um só lugar." action="Adicionar prova" href="/provas/nova" />{dados.length ? <RaceList initial={dados} /> : <EmptyState title="Nenhuma prova cadastrada" description="Adicione uma meta ao calendário para manter os próximos treinos direcionados." action="Adicionar prova" href="/provas/nova" icon="race" />}</>;
}
