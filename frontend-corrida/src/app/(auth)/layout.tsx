import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { readSession } from "@/lib/api-server";

export default async function PublicAuthLayout({ children }: { children: ReactNode }) {
  const user = await readSession();
  if (user) redirect("/");
  return <AuthShell>{children}</AuthShell>;
}
