import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActivityForm } from "@/components/activity-form";
import { PageHeader } from "@/components/page-header";
import { ServerApiError, serverApi } from "@/lib/api-server";
import type { Atividade, Lista, Tenis } from "@/lib/types";

export const metadata: Metadata = { title: "Editar atividade" };
export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let activity: Atividade;
  let shoes: Lista<Tenis>;
  try {
    [activity, shoes] = await Promise.all([serverApi<Atividade>(`/atividades/${id}`), serverApi<Lista<Tenis>>("/tenis")]);
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) notFound();
    throw error;
  }
  return <><PageHeader eyebrow="Histórico" title="Editar atividade" description="Atualize os dados desta corrida." /><ActivityForm shoes={shoes.dados} activity={activity} /></>;
}
