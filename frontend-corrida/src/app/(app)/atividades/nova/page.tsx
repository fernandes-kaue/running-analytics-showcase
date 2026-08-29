import type { Metadata } from "next";
import { ActivityForm } from "@/components/activity-form";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { serverApi } from "@/lib/api-server";
import type { Lista, Tenis } from "@/lib/types";

export const metadata: Metadata = { title: "Nova atividade" };
export default async function NewActivityPage() {
  const { dados } = await serverApi<Lista<Tenis>>("/tenis");
  return <><PageHeader eyebrow="Registro manual" title="Nova atividade" description="Informe os dados da corrida. O pace será calculado automaticamente." />{dados.length ? <ActivityForm shoes={dados} /> : <EmptyState title="Primeiro, cadastre um tênis" description="Toda atividade precisa indicar o equipamento usado. Isso permite calcular a quilometragem automaticamente." action="Cadastrar tênis" href="/tenis/novo" icon="shoe" />}</>;
}
