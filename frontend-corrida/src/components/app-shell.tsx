import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { Navigation } from "@/components/navigation";
import type { Usuario } from "@/lib/types";

export function AppShell({ user, children }: { user: Usuario; children: ReactNode }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <aside className="sidebar">
        <Brand />
        <nav aria-label="Navegação principal"><Navigation /></nav>
        <div className="sidebar-user">
          <p className="user-name">{user.nome}</p>
          <p className="user-email">{user.email}</p>
          <LogoutButton />
        </div>
      </aside>
      <header className="mobile-header">
        <Brand />
        <LogoutButton compact />
      </header>
      <main className="app-content" id="conteudo">
        <div className="content-container">{children}</div>
      </main>
      <nav aria-label="Navegação principal móvel"><Navigation mobile /></nav>
    </div>
  );
}
