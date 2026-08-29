import { Router } from 'express';
import { Prisma, type PrismaClient, type Treino } from '@prisma/client';
import { z } from 'zod';
import { ApiError } from '../../http/errors.js';
import { decodeCursor, encodeCursor } from '../../shared/cursor.js';
import { parseCivilDate, serializeCivilDate, todayUtc } from '../../shared/date.js';
import { decimalNumber, paceSeconds } from '../../shared/numbers.js';

const atividadeSchema = z.object({
  data: z.string(),
  distancia_km: z.number().finite().positive().max(1000).multipleOf(0.01, 'Use no maximo duas casas decimais.'),
  duracao_segundos: z.number().int().positive().max(604800),
  tenis_id: z.string().uuid(),
  observacoes: z.string().trim().max(2000).nullable().optional(),
}).strict();
const atividadePatchSchema = atividadeSchema.partial().refine((value) => Object.keys(value).length > 0, 'Informe ao menos um campo.');
const listSchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(20), cursor: z.string().optional() }).strict();
const idSchema = z.string().uuid();
type AtividadeCompleta = Treino & { tenis: { id: string; modelo: string } };
const includeTenis = { tenis: { select: { id: true, modelo: true } } } as const;
const MAX_ACTIVITIES_PER_USER = 20_000;

function dto(atividade: AtividadeCompleta) {
  const distancia = decimalNumber(atividade.distancia_km);
  return {
    id: atividade.id,
    data: serializeCivilDate(atividade.data),
    distancia_km: distancia,
    duracao_segundos: atividade.duracao_segundos,
    pace_medio_segundos_km: paceSeconds(atividade.duracao_segundos, distancia),
    observacoes: atividade.observacoes,
    tenis: atividade.tenis,
  };
}

function validateCompletedDate(value: string): Date {
  const date = parseCivilDate(value);
  if (date > todayUtc()) throw new ApiError(422, 'Dados invalidos.', { data: 'A atividade nao pode estar no futuro.' });
  return date;
}

async function assertOwnedShoe(prisma: PrismaClient, usuarioId: string, tenisId: string): Promise<void> {
  const owned = await prisma.tenis.findFirst({ where: { id: tenisId, usuario_id: usuarioId }, select: { id: true } });
  if (!owned) throw new ApiError(404, 'Tenis nao encontrado.');
}

export function atividadesRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const query = listSchema.parse(req.query);
      const cursor = query.cursor ? decodeCursor(query.cursor) : null;
      const cursorWhere = cursor ? {
        OR: [
          { data: { lt: new Date(cursor.data) } },
          { data: new Date(cursor.data), criado_em: { lt: new Date(cursor.criado_em) } },
          { data: new Date(cursor.data), criado_em: new Date(cursor.criado_em), id: { lt: cursor.id } },
        ],
      } : {};
      const rows = await prisma.treino.findMany({
        where: { usuario_id: res.locals.usuario.id, ...cursorWhere },
        include: includeTenis,
        orderBy: [{ data: 'desc' }, { criado_em: 'desc' }, { id: 'desc' }],
        take: query.limit + 1,
      });
      const hasMore = rows.length > query.limit;
      const dados = rows.slice(0, query.limit);
      const last = dados.at(-1);
      res.json({
        dados: dados.map(dto),
        proximo_cursor: hasMore && last ? encodeCursor({ data: last.data.toISOString(), criado_em: last.criado_em.toISOString(), id: last.id }) : null,
      });
    } catch (error) { next(error); }
  });

  router.post('/', async (req, res, next) => {
    try {
      const input = atividadeSchema.parse(req.body);
      const total = await prisma.treino.count({ where: { usuario_id: res.locals.usuario.id } });
      if (total >= MAX_ACTIVITIES_PER_USER) throw new ApiError(409, 'Limite de atividades atingido.');
      await assertOwnedShoe(prisma, res.locals.usuario.id, input.tenis_id);
      const atividade = await prisma.treino.create({ data: {
        usuario_id: res.locals.usuario.id,
        tenis_id: input.tenis_id,
        data: validateCompletedDate(input.data),
        distancia_km: new Prisma.Decimal(input.distancia_km),
        duracao_segundos: input.duracao_segundos,
        observacoes: input.observacoes || null,
      }, include: includeTenis });
      res.status(201).json(dto(atividade));
    } catch (error) { next(error); }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const atividade = await prisma.treino.findFirst({ where: { id: idSchema.parse(req.params.id), usuario_id: res.locals.usuario.id }, include: includeTenis });
      if (!atividade) throw new ApiError(404, 'Atividade nao encontrada.');
      res.json(dto(atividade));
    } catch (error) { next(error); }
  });

  router.patch('/:id', async (req, res, next) => {
    try {
      const id = idSchema.parse(req.params.id);
      const input = atividadePatchSchema.parse(req.body);
      const existing = await prisma.treino.findFirst({ where: { id, usuario_id: res.locals.usuario.id }, select: { id: true } });
      if (!existing) throw new ApiError(404, 'Atividade nao encontrada.');
      if (input.tenis_id !== undefined) await assertOwnedShoe(prisma, res.locals.usuario.id, input.tenis_id);
      await prisma.treino.update({ where: { id }, data: {
        ...(input.tenis_id !== undefined ? { tenis_id: input.tenis_id } : {}),
        ...(input.data !== undefined ? { data: validateCompletedDate(input.data) } : {}),
        ...(input.distancia_km !== undefined ? { distancia_km: new Prisma.Decimal(input.distancia_km) } : {}),
        ...(input.duracao_segundos !== undefined ? { duracao_segundos: input.duracao_segundos } : {}),
        ...(input.observacoes !== undefined ? { observacoes: input.observacoes || null } : {}),
      } });
      res.json(dto(await prisma.treino.findUniqueOrThrow({ where: { id }, include: includeTenis })));
    } catch (error) { next(error); }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const result = await prisma.treino.deleteMany({ where: { id: idSchema.parse(req.params.id), usuario_id: res.locals.usuario.id } });
      if (result.count === 0) throw new ApiError(404, 'Atividade nao encontrada.');
      res.status(204).end();
    } catch (error) { next(error); }
  });

  return router;
}
