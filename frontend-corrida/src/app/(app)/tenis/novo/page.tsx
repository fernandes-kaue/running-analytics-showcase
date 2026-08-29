import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ShoeForm } from "@/components/shoe-form";

export const metadata: Metadata = { title: "Adicionar tênis" };
export default function NewShoePage() { return <><PageHeader eyebrow="Equipamentos" title="Adicionar tênis" description="Defina o modelo e uma referência de vida útil." /><ShoeForm /></>; }
