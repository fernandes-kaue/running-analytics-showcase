BEGIN;

LOCK TABLE "Tenis", "Treino", "Prova" IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Tenis" LIMIT 1)
     OR EXISTS (SELECT 1 FROM "Treino" LIMIT 1)
     OR EXISTS (SELECT 1 FROM "Prova" LIMIT 1) THEN
    RAISE EXCEPTION 'Migration auth_multiusuario requires empty legacy domain tables';
  END IF;
END $$;

DROP TABLE "Treino";
DROP TABLE "Tenis";
DROP TABLE "Prova";

CREATE TABLE "Usuario" (
  "id" UUID NOT NULL,
  "nome" VARCHAR(100) NOT NULL,
  "email" VARCHAR(320) NOT NULL,
  "password_hash" TEXT NOT NULL,
  "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Sessao" (
  "id" UUID NOT NULL,
  "token_hash" CHAR(64) NOT NULL,
  "usuario_id" UUID NOT NULL,
  "expira_em" TIMESTAMPTZ(3) NOT NULL,
  "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tenis" (
  "id" UUID NOT NULL,
  "usuario_id" UUID NOT NULL,
  "modelo" VARCHAR(120) NOT NULL,
  "km_limite" DECIMAL(8,2) NOT NULL,
  "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Tenis_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Tenis_km_limite_check" CHECK ("km_limite" > 0 AND "km_limite" <= 5000)
);

CREATE TABLE "Treino" (
  "id" UUID NOT NULL,
  "usuario_id" UUID NOT NULL,
  "tenis_id" UUID NOT NULL,
  "data" DATE NOT NULL,
  "distancia_km" DECIMAL(8,2) NOT NULL,
  "duracao_segundos" INTEGER NOT NULL,
  "observacoes" VARCHAR(2000),
  "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Treino_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Treino_distancia_km_check" CHECK ("distancia_km" > 0 AND "distancia_km" <= 1000),
  CONSTRAINT "Treino_duracao_segundos_check" CHECK ("duracao_segundos" > 0 AND "duracao_segundos" <= 604800)
);

CREATE TABLE "Prova" (
  "id" UUID NOT NULL,
  "usuario_id" UUID NOT NULL,
  "nome" VARCHAR(150) NOT NULL,
  "data" DATE NOT NULL,
  "distancia_km" DECIMAL(8,2) NOT NULL,
  "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Prova_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Prova_distancia_km_check" CHECK ("distancia_km" > 0 AND "distancia_km" <= 1000)
);

CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
CREATE UNIQUE INDEX "Sessao_token_hash_key" ON "Sessao"("token_hash");
CREATE INDEX "Sessao_usuario_id_idx" ON "Sessao"("usuario_id");
CREATE INDEX "Sessao_expira_em_idx" ON "Sessao"("expira_em");
CREATE UNIQUE INDEX "Tenis_id_usuario_id_key" ON "Tenis"("id", "usuario_id");
CREATE INDEX "Tenis_usuario_id_criado_em_idx" ON "Tenis"("usuario_id", "criado_em");
CREATE INDEX "Treino_usuario_id_data_criado_em_id_idx" ON "Treino"("usuario_id", "data" DESC, "criado_em" DESC, "id" DESC);
CREATE INDEX "Treino_tenis_id_usuario_id_idx" ON "Treino"("tenis_id", "usuario_id");
CREATE INDEX "Prova_usuario_id_data_idx" ON "Prova"("usuario_id", "data");

ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Tenis" ADD CONSTRAINT "Tenis_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Treino" ADD CONSTRAINT "Treino_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Treino" ADD CONSTRAINT "Treino_tenis_id_usuario_id_fkey" FOREIGN KEY ("tenis_id", "usuario_id") REFERENCES "Tenis"("id", "usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Prova" ADD CONSTRAINT "Prova_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
