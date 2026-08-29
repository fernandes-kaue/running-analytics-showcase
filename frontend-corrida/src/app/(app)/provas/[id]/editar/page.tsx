import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { RaceForm } from "@/components/race-form";
import { ServerApiError, serverApi } from "@/lib/api-server";
import type { Prova } from "@/lib/types";

export const metadata: Metadata = { title: "Editar prova" };
export default async function EditRacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let race: Prova;
  try { race = await serverApi<Prova>(`/provas/${id}`); }
  catch (error) { if (error instanceof ServerApiError && error.status === 404) notFound(); throw error; }
  return <><PageHeader eyebrow="Calendário" title="Editar prova" description="Atualize os dados desta prova." /><RaceForm race={race} /></>;
}
