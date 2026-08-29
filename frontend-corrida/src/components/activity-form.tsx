"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiMutation, ClientApiError } from "@/lib/api-client";
import { durationParts, todayCivilDate } from "@/lib/format";
import type { Atividade, FieldErrors, Tenis } from "@/lib/types";

export function ActivityForm({ shoes, activity }: { shoes: Tenis[]; activity?: Atividade }) {
  const router = useRouter();
  const parts = durationParts(activity?.duracao_segundos);
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
    const horas = Number(data.get("horas") || 0);
    const minutos = Number(data.get("minutos") || 0);
    const segundos = Number(data.get("segundos") || 0);
    const duracao = horas * 3600 + minutos * 60 + segundos;
    if (!Number.isFinite(duracao) || duracao <= 0) {
      setFields({ duracao_segundos: "Informe uma duração maior que zero." });
      setPending(false);
      return;
    }
    try {
      await apiMutation(activity ? `/atividades/${activity.id}` : "/atividades", {
        method: activity ? "PATCH" : "POST",
        body: JSON.stringify({
          data: String(data.get("data") ?? ""),
          distancia_km: Number(data.get("distancia_km")),
          duracao_segundos: duracao,
          tenis_id: String(data.get("tenis_id") ?? ""),
          observacoes: String(data.get("observacoes") ?? "").trim() || null,
        }),
      });
      router.push("/atividades");
      router.refresh();
    } catch (caught) {
      if (caught instanceof ClientApiError) {
        setError(caught.message);
        setFields(caught.fields);
      } else setError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form-card form-stack" onSubmit={submit} noValidate>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="data">Data</label>
          <input className="input" id="data" name="data" type="date" max={todayCivilDate()} defaultValue={activity?.data.slice(0, 10) ?? todayCivilDate()} required aria-invalid={Boolean(fields.data)} aria-describedby={fields.data ? "atividade-data-error" : undefined} />
          {fields.data ? <p className="field-error" id="atividade-data-error">{fields.data}</p> : null}
        </div>
        <div className="form-field">
          <label htmlFor="distancia_km">Distância</label>
          <input className="input" id="distancia_km" name="distancia_km" type="number" inputMode="decimal" min="0.01" max="1000" step="0.01" defaultValue={activity?.distancia_km ?? ""} placeholder="5,00" required aria-invalid={Boolean(fields.distancia_km)} aria-describedby={fields.distancia_km ? "atividade-distancia-hint atividade-distancia-error" : "atividade-distancia-hint"} />
          <p className="field-hint" id="atividade-distancia-hint">Em quilômetros.</p>
          {fields.distancia_km ? <p className="field-error" id="atividade-distancia-error">{fields.distancia_km}</p> : null}
        </div>
        <fieldset className="form-field full" style={{ border: 0, padding: 0, margin: 0 }} aria-describedby={fields.duracao_segundos ? "atividade-duracao-error" : undefined}>
          <legend className="field-label">Duração</legend>
          <div className="duration-grid">
            <div className="form-field"><label htmlFor="horas">Horas</label><input className="input" id="horas" name="horas" type="number" inputMode="numeric" min="0" max="167" step="1" defaultValue={parts.horas} /></div>
            <div className="form-field"><label htmlFor="minutos">Minutos</label><input className="input" id="minutos" name="minutos" type="number" inputMode="numeric" min="0" max="59" step="1" defaultValue={parts.minutos} /></div>
            <div className="form-field"><label htmlFor="segundos">Segundos</label><input className="input" id="segundos" name="segundos" type="number" inputMode="numeric" min="0" max="59" step="1" defaultValue={parts.segundos} /></div>
          </div>
          {fields.duracao_segundos ? <p className="field-error" id="atividade-duracao-error">{fields.duracao_segundos}</p> : null}
        </fieldset>
        <div className="form-field full">
          <label htmlFor="tenis_id">Tênis usado</label>
          <select className="input" id="tenis_id" name="tenis_id" defaultValue={activity?.tenis.id ?? ""} required aria-invalid={Boolean(fields.tenis_id)} aria-describedby={fields.tenis_id ? "atividade-tenis-error" : undefined}>
            <option value="" disabled>Selecione um tênis</option>
            {shoes.map((shoe) => <option value={shoe.id} key={shoe.id}>{shoe.modelo}</option>)}
          </select>
          {fields.tenis_id ? <p className="field-error" id="atividade-tenis-error">{fields.tenis_id}</p> : null}
        </div>
        <div className="form-field full">
          <label htmlFor="observacoes">Observações <span style={{ color: "var(--ink-soft)", fontWeight: 500 }}>(opcional)</span></label>
          <textarea className="input" id="observacoes" name="observacoes" maxLength={2000} defaultValue={activity?.observacoes ?? ""} placeholder="Como foi o treino?" aria-invalid={Boolean(fields.observacoes)} aria-describedby={fields.observacoes ? "atividade-observacoes-error" : undefined} />
          {fields.observacoes ? <p className="field-error" id="atividade-observacoes-error">{fields.observacoes}</p> : null}
        </div>
      </div>
      {error ? <div className="alert" role="alert">{error}</div> : null}
      <div className="form-actions">
        <Link className="button button-secondary" href="/atividades">Cancelar</Link>
        <button className="button button-primary" type="submit" disabled={pending}>{pending ? "Salvando…" : activity ? "Salvar alterações" : "Registrar atividade"}</button>
      </div>
    </form>
  );
}
