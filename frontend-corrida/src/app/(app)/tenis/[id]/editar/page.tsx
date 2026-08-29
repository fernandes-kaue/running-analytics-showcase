import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ShoeForm } from "@/components/shoe-form";
import { ServerApiError, serverApi } from "@/lib/api-server";
import type { Tenis } from "@/lib/types";

export const metadata: Metadata = { title: "Editar tênis" };
export default async function EditShoePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let shoe: Tenis;
  try { shoe = await serverApi<Tenis>(`/tenis/${id}`); }
  catch (error) { if (error instanceof ServerApiError && error.status === 404) notFound(); throw error; }
  return <><PageHeader eyebrow="Equipamentos" title="Editar tênis" description="Atualize o modelo ou a vida útil estimada." /><ShoeForm shoe={shoe} /></>;
}
