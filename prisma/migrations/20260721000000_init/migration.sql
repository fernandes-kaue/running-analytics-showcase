-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Tenis" (
    "id" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "km_acumulada" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "km_limite" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Tenis_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Tenis_km_acumulada_check" CHECK ("km_acumulada" >= 0),
    CONSTRAINT "Tenis_km_limite_check" CHECK ("km_limite" > 0)
);

-- CreateTable
CREATE TABLE "Prova" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "distancia_km" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Prova_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Prova_distancia_km_check" CHECK ("distancia_km" > 0)
);

-- CreateTable
CREATE TABLE "Treino" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "distancia_km" DOUBLE PRECISION NOT NULL,
    "tempo_minutos" DOUBLE PRECISION NOT NULL,
    "pace_medio" DOUBLE PRECISION NOT NULL,
    "tenis_id" TEXT NOT NULL,

    CONSTRAINT "Treino_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Treino_distancia_km_check" CHECK ("distancia_km" > 0),
    CONSTRAINT "Treino_tempo_minutos_check" CHECK ("tempo_minutos" > 0),
    CONSTRAINT "Treino_pace_medio_check" CHECK ("pace_medio" > 0)
);

-- CreateIndex
CREATE INDEX "Treino_tenis_id_idx" ON "Treino"("tenis_id");

-- AddForeignKey
ALTER TABLE "Treino" ADD CONSTRAINT "Treino_tenis_id_fkey" FOREIGN KEY ("tenis_id") REFERENCES "Tenis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
