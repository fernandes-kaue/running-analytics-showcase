import { Router } from 'express';
import { Prisma, type PrismaClient, type Prova } from '@prisma/client';
import { z } from 'zod';
import { ApiError } from '../../http/errors.js';
import { parseCivilDate, serializeCivilDate } from '../../shared/date.js';
import { decimalNumber } from '../../shared/numbers.js';

const provaSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.').max(150),
  data: z.string(),
  distancia_km: z.number().finite().positive().max(1000).multipleOf(0.01, 'Use no maximo duas casas decimais.'),
}).strict();
const provaPatchSchema = provaSchema.partial().refine((value) => Object.keys(value).length > 0, 'Informe ao menos um campo.');
const idSchema = z.string().uuid();
const MAX_RACES_PER_USER = 1_000;

function dto(prova: Prova) {
  return { id: prova.id, nome: prova.nome, data: serializeCivilDate(prova.data), distancia_km: decimalNumber(prova.distancia_km) };
}

export function provasRouter(prisma: PrismaClient): Router {
  const router = Router();
  router.get('/', async (_req, res, next) => {
    try {
      const provas = await prisma.prova.findMany({ where: { usuario_id: res.locals.usuario.id }, orderBy: [{ data: 'asc' }, { criado_em: 'asc' }] });
      res.json({ dados: provas.map(dto) });
    } catch (error) { next(error); }
  });
  router.post('/', async (req, res, next) => {
    try {
      const input = provaSchema.parse(req.body);
      const total = await prisma.prova.count({ where: { usuario_id: res.locals.usuario.id } });
      if (total >= MAX_RACES_PER_USER) throw new ApiError(409, 'Limite de provas atingido.');
      const prova = await prisma.prova.create({ data: { usuario_id: res.locals.usuario.id, nome: input.nome, data: parseCivilDate(input.data), distancia_km: new Prisma.Decimal(input.distancia_km) } });
      res.status(201).json(dto(prova));
    } catch (error) { next(error); }
  });
  router.get('/:id', async (req, res, next) => {
    try {
      const prova = await prisma.prova.findFirst({ where: { id: idSchema.parse(req.params.id), usuario_id: res.locals.usuario.id } });
      if (!prova) throw new ApiError(404, 'Prova nao encontrada.');
      res.json(dto(prova));
    } catch (error) { next(error); }
  });
  router.patch('/:id', async (req, res, next) => {
    try {
      const id = idSchema.parse(req.params.id);
      const input = provaPatchSchema.parse(req.body);
      const result = await prisma.prova.updateMany({ where: { id, usuario_id: res.locals.usuario.id }, data: {
        ...(input.nome !== undefined ? { nome: input.nome } : {}),
        ...(input.data !== undefined ? { data: parseCivilDate(input.data) } : {}),
        ...(input.distancia_km !== undefined ? { distancia_km: new Prisma.Decimal(input.distancia_km) } : {}),
      } });
      if (result.count === 0) throw new ApiError(404, 'Prova nao encontrada.');
      res.json(dto(await prisma.prova.findUniqueOrThrow({ where: { id } })));
    } catch (error) { next(error); }
  });
  router.delete('/:id', async (req, res, next) => {
    try {
      const id = idSchema.parse(req.params.id);
      const result = await prisma.prova.deleteMany({ where: { id, usuario_id: res.locals.usuario.id } });
      if (result.count === 0) throw new ApiError(404, 'Prova nao encontrada.');
      res.status(204).end();
    } catch (error) { next(error); }
  });
  return router;
}
