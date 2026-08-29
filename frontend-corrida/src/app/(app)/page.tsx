import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard";
import { requireSession, serverApi } from "@/lib/api-server";
import type { Dashboard } from "@/lib/types";

export const metadata: Metadata = { title: "Resumo" };

export default async function DashboardPage() {
  const [user, data] = await Promise.all([requireSession(), serverApi<Dashboard>("/dashboard")]);
  return <DashboardView data={data} userName={user.nome} />;
}
