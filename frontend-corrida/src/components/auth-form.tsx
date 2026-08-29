"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiMutation, ClientApiError } from "@/lib/api-client";
import type { FieldErrors } from "@/lib/types";

export function AuthForm({ mode }: { mode: "entrar" | "cadastro" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<FieldErrors>({});
  const isRegister = mode === "cadastro";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    setFields({});
    const form = new FormData(event.currentTarget);
    const senha = String(form.get("senha") ?? "");
    const confirmacao = String(form.get("confirmar_senha") ?? "");
    if (isRegister && senha !== confirmacao) {
      setFields({ confirmar_senha: "As senhas precisam ser iguais." });
      return;
    }
    setPending(true);
    try {
      const payload = isRegister
        ? { nome: String(form.get("nome") ?? ""), email: String(form.get("email") ?? ""), senha, confirmar_senha: confirmacao }
        : { email: String(form.get("email") ?? ""), senha };
      await apiMutation(isRegister ? "/auth/cadastro" : "/auth/entrar", {
        method: "POST",
        body: JSON.stringify(payload),
      }, false);
      router.replace("/");
      router.refresh();
    } catch (caught) {
      if (caught instanceof ClientApiError) {
        setError(caught.message);
        setFields(caught.fields);
      } else {
        setError("Não foi possível conectar ao servidor. Tente novamente.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-card">
      <p className="eyebrow">{isRegister ? "Comece agora" : "Bem-vindo de volta"}</p>
      <h2>{isRegister ? "Crie sua conta" : "Entre na sua conta"}</h2>
      <p>{isRegister ? "Monte seu histórico de corrida em poucos minutos." : "Continue de onde parou, em qualquer dispositivo."}</p>
      <form className="form-stack" onSubmit={submit} noValidate>
        {isRegister ? (
          <div className="form-field">
            <label htmlFor="nome">Nome</label>
            <input className="input" id="nome" name="nome" autoComplete="name" minLength={2} maxLength={100} required aria-invalid={Boolean(fields.nome)} aria-describedby={fields.nome ? "nome-error" : undefined} />
            {fields.nome ? <p className="field-error" id="nome-error">{fields.nome}</p> : null}
          </div>
        ) : null}
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" maxLength={320} required aria-invalid={Boolean(fields.email)} aria-describedby={fields.email ? "email-error" : undefined} />
          {fields.email ? <p className="field-error" id="email-error">{fields.email}</p> : null}
        </div>
        <div className="form-field">
          <label htmlFor="senha">Senha</label>
          <input className="input" id="senha" name="senha" type="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={10} maxLength={128} required aria-invalid={Boolean(fields.senha)} aria-describedby={fields.senha ? "senha-error" : isRegister ? "senha-hint" : undefined} />
          {isRegister ? <p className="field-hint" id="senha-hint">Use de 10 a 128 caracteres.</p> : null}
          {fields.senha ? <p className="field-error" id="senha-error">{fields.senha}</p> : null}
        </div>
        {isRegister ? (
          <div className="form-field">
            <label htmlFor="confirmar_senha">Confirme a senha</label>
            <input className="input" id="confirmar_senha" name="confirmar_senha" type="password" autoComplete="new-password" minLength={10} maxLength={128} required aria-invalid={Boolean(fields.confirmar_senha)} aria-describedby={fields.confirmar_senha ? "confirmar-senha-error" : undefined} />
            {fields.confirmar_senha ? <p className="field-error" id="confirmar-senha-error">{fields.confirmar_senha}</p> : null}
          </div>
        ) : null}
        {error ? <div className="alert" role="alert">{error}</div> : null}
        <button className="button button-primary button-block" type="submit" disabled={pending}>
          {pending ? "Aguarde…" : isRegister ? "Criar conta" : "Entrar"}
        </button>
      </form>
      <p className="auth-switch">
        {isRegister ? "Já possui uma conta? " : "Ainda não possui uma conta? "}
        <Link href={isRegister ? "/entrar" : "/cadastro"}>{isRegister ? "Entrar" : "Criar conta"}</Link>
      </p>
    </div>
  );
}
