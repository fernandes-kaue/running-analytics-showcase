import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { RaceForm } from "@/components/race-form";

export const metadata: Metadata = { title: "Adicionar prova" };
export default function NewRacePage() { return <><PageHeader eyebrow="Calendário" title="Adicionar prova" description="Registre sua próxima meta de corrida." /><RaceForm /></>; }
