import { Router } from 'express';
import { Prisma, type PrismaClient, type Tenis } from '@prisma/client';
import { z } from 'zod';
import { ApiError } from '../../http/errors.js';
import { decimalNumber, round2 } from '../../shared/numbers.js';

const tenisSchema = z.object({
  modelo: z.string().trim().min(1, 'Informe o modelo.').max(120),
  km_limite: z.number().finite().positive().max(5000).multipleOf(0.01, 'Use no maximo duas casas decimais.'),
}).strict();
const tenisPatchSchema = tenisSchema.partial().refine((value) => Object.keys(value).length > 0, 'Informe ao menos um campo.');
const idSchema = z.string().uuid();
const MAX_SHOES_PER_USER = 200;

function dto(tenis: Tenis, acumuladaValue: Prisma.Decimal | number | string | null = 0) {
  const kmLimite = decimalNumber(tenis.km_limite);
  const kmAcumulada = round2(acumuladaValue === null ? 0 : decimalNumber(acumuladaValue));
  return {
    id: tenis.id,
    modelo: tenis.modelo,
    km_limite: kmLimite,
    km_acumulada: kmAcumulada,
    percentual_uso: round2((kmAcumulada / kmLimite) * 100),
  };
}

async function accumulatedKm(prisma: PrismaClient, usuarioId: string, tenisId: string): Promise<Prisma.Decimal | null> {
  const result = await prisma.treino.aggregate({
    where: { usuario_id: usuarioId, tenis_id: tenisId },
    _sum: { distancia_km: true },
  });
  return result._sum.distancia_km;
}

export function tenisRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      const usuarioId = res.locals.usuario.id;
      const [tenis, totals] = await Promise.all([
        prisma.tenis.findMany({ where: { usuario_id: usuarioId }, orderBy: { criado_em: 'desc' } }),
        prisma.treino.groupBy({ by: ['tenis_id'], where: { usuario_id: usuarioId }, _sum: { distancia_km: true } }),
      ]);
      const totalsByShoe = new Map(totals.map((total) => [total.tenis_id, total._sum.distancia_km]));
      res.json({ dados: tenis.map((shoe) => dto(shoe, totalsByShoe.get(shoe.id) ?? 0)) });
    } catch (error) { next(error); }
  });

  router.post('/', async (req, res, next) => {
    try {
      const input = tenisSchema.parse(req.body);
      const total = await prisma.tenis.count({ where: { usuario_id: res.locals.usuario.id } });
      if (total >= MAX_SHOES_PER_USER) throw new ApiError(409, 'Limite de tenis atingido.');
      const tenis = await prisma.tenis.create({
        data: { usuario_id: res.locals.usuario.id, modelo: input.modelo, km_limite: new Prisma.Decimal(input.km_limite) },
      });
      res.status(201).json(dto(tenis));
    } catch (error) { next(error); }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const id = idSchema.parse(req.params.id);
      const usuarioId = res.locals.usuario.id;
      const tenis = await prisma.tenis.findFirst({ where: { id, usuario_id: usuarioId } });
      if (!tenis) throw new ApiError(404, 'Tenis nao encontrado.');
      res.json(dto(tenis, await accumulatedKm(prisma, usuarioId, id)));
    } catch (error) { next(error); }
  });

  router.patch('/:id', async (req, res, next) => {
    try {
      const id = idSchema.parse(req.params.id);
      const input = tenisPatchSchema.parse(req.body);
      const result = await prisma.tenis.updateMany({
        where: { id, usuario_id: res.locals.usuario.id },
        data: {
          ...(input.modelo !== undefined ? { modelo: input.modelo } : {}),
          ...(input.km_limite !== undefined ? { km_limite: new Prisma.Decimal(input.km_limite) } : {}),
        },
      });
      if (result.count === 0) throw new ApiError(404, 'Tenis nao encontrado.');
      const tenis = await prisma.tenis.findUniqueOrThrow({ where: { id } });
      res.json(dto(tenis, await accumulatedKm(prisma, res.locals.usuario.id, id)));
    } catch (error) { next(error); }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const id = idSchema.parse(req.params.id);
      const tenis = await prisma.tenis.findFirst({ where: { id, usuario_id: res.locals.usuario.id }, select: { id: true, _count: { select: { treinos: true } } } });
      if (!tenis) throw new ApiError(404, 'Tenis nao encontrado.');
      if (tenis._count.treinos > 0) throw new ApiError(409, 'Tenis possui atividades e nao pode ser excluido.');
      try {
        await prisma.tenis.delete({ where: { id } });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
          throw new ApiError(409, 'Tenis possui atividades e nao pode ser excluido.');
        }
        throw error;
      }
      res.status(204).end();
    } catch (error) { next(error); }
  });

  return router;
}
