import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ShoeList } from "@/components/shoe-list";
import { serverApi } from "@/lib/api-server";
import type { Lista, Tenis } from "@/lib/types";

export const metadata: Metadata = { title: "Tênis" };
export default async function ShoesPage() {
  const { dados } = await serverApi<Lista<Tenis>>("/tenis");
  return <><PageHeader eyebrow="Equipamentos" title="Tênis" description="Acompanhe a quilometragem derivada das atividades e saiba quando é hora de trocar." action="Adicionar tênis" href="/tenis/novo" />{dados.length ? <ShoeList initial={dados} /> : <EmptyState title="Nenhum tênis cadastrado" description="Adicione o equipamento que você usa para associá-lo às próximas corridas." action="Adicionar tênis" href="/tenis/novo" icon="shoe" />}</>;
}
