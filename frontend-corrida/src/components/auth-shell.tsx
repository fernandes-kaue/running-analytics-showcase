import type { ReactNode } from "react";
import { Brand } from "@/components/brand";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="Sobre o Running">
        <Brand href="/entrar" />
        <div className="auth-message">
          <h1>Corra. Registre. Evolua.</h1>
          <p>Seus treinos, tênis e próximas provas reunidos em um histórico simples, privado e feito para acompanhar constância.</p>
        </div>
      </section>
      <section className="auth-panel">{children}</section>
    </main>
  );
}
