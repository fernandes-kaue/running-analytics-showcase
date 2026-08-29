"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiMutation, ClientApiError } from "@/lib/api-client";
import type { FieldErrors, Tenis } from "@/lib/types";

export function ShoeForm({ shoe }: { shoe?: Tenis }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<FieldErrors>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    setFields({});
    const data = new FormData(event.currentTarget);
    try {
      await apiMutation(shoe ? `/tenis/${shoe.id}` : "/tenis", {
        method: shoe ? "PATCH" : "POST",
        body: JSON.stringify({ modelo: String(data.get("modelo") ?? ""), km_limite: Number(data.get("km_limite")) }),
      });
      router.push("/tenis");
      router.refresh();
    } catch (caught) {
      if (caught instanceof ClientApiError) { setError(caught.message); setFields(caught.fields); }
      else setError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally { setPending(false); }
  }

  return (
    <form className="form-card form-stack" onSubmit={submit} noValidate>
      <div className="form-field">
        <label htmlFor="modelo">Modelo</label>
        <input className="input" id="modelo" name="modelo" maxLength={120} defaultValue={shoe?.modelo ?? ""} placeholder="Ex.: Nike Pegasus 41" required autoFocus aria-invalid={Boolean(fields.modelo)} aria-describedby={fields.modelo ? "tenis-modelo-error" : undefined} />
        {fields.modelo ? <p className="field-error" id="tenis-modelo-error">{fields.modelo}</p> : null}
      </div>
      <div className="form-field">
        <label htmlFor="km_limite">Vida útil estimada</label>
        <input className="input" id="km_limite" name="km_limite" type="number" inputMode="decimal" min="0.01" max="5000" step="0.01" defaultValue={shoe?.km_limite ?? 700} required aria-invalid={Boolean(fields.km_limite)} aria-describedby={fields.km_limite ? "tenis-limite-hint tenis-limite-error" : "tenis-limite-hint"} />
        <p className="field-hint" id="tenis-limite-hint">Em quilômetros. Muitos tênis ficam entre 500 e 800 km.</p>
        {fields.km_limite ? <p className="field-error" id="tenis-limite-error">{fields.km_limite}</p> : null}
      </div>
      {error ? <div className="alert" role="alert">{error}</div> : null}
      <div className="form-actions"><Link className="button button-secondary" href="/tenis">Cancelar</Link><button className="button button-primary" type="submit" disabled={pending}>{pending ? "Salvando…" : shoe ? "Salvar alterações" : "Adicionar tênis"}</button></div>
    </form>
  );
}
