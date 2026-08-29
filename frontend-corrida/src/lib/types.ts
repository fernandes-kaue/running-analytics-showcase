export type Usuario = {
  id: string;
  nome: string;
  email: string;
};

export type Tenis = {
  id: string;
  modelo: string;
  km_limite: number;
  km_acumulada: number;
  percentual_uso: number;
  criado_em?: string;
};

export type Atividade = {
  id: string;
  data: string;
  distancia_km: number;
  duracao_segundos: number;
  pace_medio_segundos_km: number;
  observacoes: string | null;
  tenis: Pick<Tenis, "id" | "modelo">;
  criado_em?: string;
};

export type Prova = {
  id: string;
  nome: string;
  data: string;
  distancia_km: number;
  criado_em?: string;
};

export type Semana = {
  inicio: string;
  fim: string;
  distancia_km: number;
};

export type Dashboard = {
  resumo_mes: {
    distancia_km: number;
    duracao_segundos: number;
    total_atividades: number;
    pace_medio_segundos_km: number | null;
  };
  atividades_recentes: Atividade[];
  tenis: Tenis[];
  proximas_provas: Prova[];
  semanas: Semana[];
};

export type Lista<T> = { dados: T[] };
export type ListaAtividades = Lista<Atividade> & { proximo_cursor?: string | null };

export type ApiErrorBody = {
  error?: string;
  fields?: Record<string, string | string[]>;
};

export type FieldErrors = Record<string, string>;
