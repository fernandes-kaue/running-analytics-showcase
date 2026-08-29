"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiMutation, ClientApiError } from "@/lib/api-client";
import type { FieldErrors, Prova } from "@/lib/types";

export function RaceForm({ race }: { race?: Prova }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<FieldErrors>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError(""); setFields({});
    const data = new FormData(event.currentTarget);
    try {
      await apiMutation(race ? `/provas/${race.id}` : "/provas", {
        method: race ? "PATCH" : "POST",
        body: JSON.stringify({ nome: String(data.get("nome") ?? ""), data: String(data.get("data") ?? ""), distancia_km: Number(data.get("distancia_km")) }),
      });
      router.push("/provas"); router.refresh();
    } catch (caught) {
      if (caught instanceof ClientApiError) { setError(caught.message); setFields(caught.fields); }
      else setError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally { setPending(false); }
  }

  return (
    <form className="form-card form-stack" onSubmit={submit} noValidate>
      <div className="form-field"><label htmlFor="nome">Nome da prova</label><input className="input" id="nome" name="nome" maxLength={150} defaultValue={race?.nome ?? ""} placeholder="Ex.: Meia Maratona de Salvador" required autoFocus aria-invalid={Boolean(fields.nome)} aria-describedby={fields.nome ? "prova-nome-error" : undefined} />{fields.nome ? <p className="field-error" id="prova-nome-error">{fields.nome}</p> : null}</div>
      <div className="form-grid">
        <div className="form-field"><label htmlFor="data">Data</label><input className="input" id="data" name="data" type="date" defaultValue={race?.data.slice(0, 10) ?? ""} required aria-invalid={Boolean(fields.data)} aria-describedby={fields.data ? "prova-data-error" : undefined} />{fields.data ? <p className="field-error" id="prova-data-error">{fields.data}</p> : null}</div>
        <div className="form-field"><label htmlFor="distancia_km">Distância</label><input className="input" id="distancia_km" name="distancia_km" type="number" inputMode="decimal" min="0.01" max="1000" step="0.01" defaultValue={race?.distancia_km ?? ""} placeholder="21,10" required aria-invalid={Boolean(fields.distancia_km)} aria-describedby={fields.distancia_km ? "prova-distancia-hint prova-distancia-error" : "prova-distancia-hint"} /><p className="field-hint" id="prova-distancia-hint">Em quilômetros.</p>{fields.distancia_km ? <p className="field-error" id="prova-distancia-error">{fields.distancia_km}</p> : null}</div>
      </div>
      {error ? <div className="alert" role="alert">{error}</div> : null}
      <div className="form-actions"><Link className="button button-secondary" href="/provas">Cancelar</Link><button className="button button-primary" type="submit" disabled={pending}>{pending ? "Salvando…" : race ? "Salvar alterações" : "Adicionar prova"}</button></div>
    </form>
  );
}
