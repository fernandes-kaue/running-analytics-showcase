import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { addUtcDays, serializeCivilDate, startOfNextUtcMonth, startOfUtcMonth, startOfUtcWeek, todayUtc } from '../../shared/date.js';
import { decimalNumber, paceSeconds, round2 } from '../../shared/numbers.js';

export function dashboardRouter(prisma: PrismaClient): Router {
  const router = Router();
  router.get('/', async (_req, res, next) => {
    try {
      const usuarioId = res.locals.usuario.id;
      const today = todayUtc();
      const monthStart = startOfUtcMonth();
      const monthEnd = startOfNextUtcMonth();
      const weekEnd = addUtcDays(startOfUtcWeek(today), 7);
      const weekStart = addUtcDays(weekEnd, -42);

      const [monthSummary, recent, shoes, shoeTotals, races, weeklyRows] = await Promise.all([
        prisma.treino.aggregate({
          where: { usuario_id: usuarioId, data: { gte: monthStart, lt: monthEnd } },
          _sum: { distancia_km: true, duracao_segundos: true },
          _count: { _all: true },
        }),
        prisma.treino.findMany({ where: { usuario_id: usuarioId }, include: { tenis: { select: { id: true, modelo: true } } }, orderBy: [{ data: 'desc' }, { criado_em: 'desc' }, { id: 'desc' }], take: 5 }),
        prisma.tenis.findMany({ where: { usuario_id: usuarioId }, orderBy: { criado_em: 'desc' } }),
        prisma.treino.groupBy({ by: ['tenis_id'], where: { usuario_id: usuarioId }, _sum: { distancia_km: true } }),
        prisma.prova.findMany({ where: { usuario_id: usuarioId, data: { gte: today } }, orderBy: [{ data: 'asc' }, { criado_em: 'asc' }], take: 5 }),
        prisma.treino.groupBy({ by: ['data'], where: { usuario_id: usuarioId, data: { gte: weekStart, lt: weekEnd } }, _sum: { distancia_km: true } }),
      ]);

      const monthDistance = round2(monthSummary._sum.distancia_km ? decimalNumber(monthSummary._sum.distancia_km) : 0);
      const monthDuration = monthSummary._sum.duracao_segundos ?? 0;
      const shoeTotalsById = new Map(shoeTotals.map((total) => [total.tenis_id, total._sum.distancia_km]));
      const semanas = Array.from({ length: 6 }, (_, index) => {
        const inicio = addUtcDays(weekStart, index * 7);
        const fimExclusivo = addUtcDays(inicio, 7);
        const distancia = weeklyRows
          .filter((row) => row.data >= inicio && row.data < fimExclusivo)
          .reduce((sum, row) => sum + (row._sum.distancia_km ? decimalNumber(row._sum.distancia_km) : 0), 0);
        return { inicio: serializeCivilDate(inicio), fim: serializeCivilDate(addUtcDays(fimExclusivo, -1)), distancia_km: round2(distancia) };
      });

      res.json({
        resumo_mes: {
          distancia_km: monthDistance,
          duracao_segundos: monthDuration,
          total_atividades: monthSummary._count._all,
          pace_medio_segundos_km: monthDistance > 0 ? paceSeconds(monthDuration, monthDistance) : null,
        },
        atividades_recentes: recent.map((row) => {
          const distancia = decimalNumber(row.distancia_km);
          return { id: row.id, data: serializeCivilDate(row.data), distancia_km: distancia, duracao_segundos: row.duracao_segundos, pace_medio_segundos_km: paceSeconds(row.duracao_segundos, distancia), observacoes: row.observacoes, tenis: row.tenis };
        }),
        tenis: shoes.map((shoe) => {
          const limite = decimalNumber(shoe.km_limite);
          const total = shoeTotalsById.get(shoe.id);
          const acumulada = round2(total ? decimalNumber(total) : 0);
          return { id: shoe.id, modelo: shoe.modelo, km_limite: limite, km_acumulada: acumulada, percentual_uso: round2(acumulada / limite * 100) };
        }),
        proximas_provas: races.map((race) => ({ id: race.id, nome: race.nome, data: serializeCivilDate(race.data), distancia_km: decimalNumber(race.distancia_km) })),
        semanas,
      });
    } catch (error) { next(error); }
  });
  return router;
}
