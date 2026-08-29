import { randomUUID } from 'node:crypto';
import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { PrismaClient } from '@prisma/client';
import type { AppEnv } from '../config/env.js';
import { errorHandler, notFoundHandler } from './errors.js';
import { mutationGuard } from '../middleware/origin.js';
import { requireAuth } from '../middleware/auth.js';
import { authRouter } from '../modules/auth/router.js';
import { atividadesRouter } from '../modules/atividades/router.js';
import { dashboardRouter } from '../modules/dashboard/router.js';
import { provasRouter } from '../modules/provas/router.js';
import { tenisRouter } from '../modules/tenis/router.js';

export function createApp(prisma: PrismaClient, env: AppEnv): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.nodeEnv === 'test' ? 10_000 : 1_000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.path.startsWith('/health'),
    message: { error: 'Limite de requisicoes excedido. Tente novamente mais tarde.' },
  }));
  const readinessLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.nodeEnv === 'test' ? 10_000 : 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Limite de verificacoes excedido.' },
  });
  app.use((req, res, next) => {
    const startedAt = process.hrtime.bigint();
    const requestId = req.get('x-request-id')?.slice(0, 100) || randomUUID();
    res.locals.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    res.setHeader('Cache-Control', 'no-store');
    res.once('finish', () => {
      if (req.path === '/health/live' || req.path === '/health/ready' || req.path === '/health') return;
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      console.log(JSON.stringify({
        level: 'info',
        request_id: requestId,
        method: req.method,
        path: req.originalUrl.split('?')[0],
        status: res.statusCode,
        duration_ms: Math.round(durationMs * 100) / 100,
      }));
    });
    next();
  });
  app.use(cookieParser());
  app.use(mutationGuard(env.appOrigin));
  app.use(express.json({ limit: '100kb', strict: true }));

  app.get('/health/live', (_req, res) => res.json({ status: 'ok' }));
  app.get(['/health/ready', '/health'], readinessLimiter, async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'unavailable' });
    }
  });

  app.use('/auth', authRouter(prisma, env));
  const authenticated = requireAuth(prisma, env);
  const userRequestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.nodeEnv === 'test' ? 10_000 : 3_000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (_req, res) => res.locals.usuario.id,
    message: { error: 'Limite de consultas excedido. Tente novamente mais tarde.' },
  });
  const userMutationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: env.nodeEnv === 'test' ? 10_000 : 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
    keyGenerator: (_req, res) => res.locals.usuario.id,
    message: { error: 'Limite de alteracoes excedido. Tente novamente mais tarde.' },
  });
  app.use('/dashboard', authenticated, userRequestLimiter, userMutationLimiter, dashboardRouter(prisma));
  app.use('/atividades', authenticated, userRequestLimiter, userMutationLimiter, atividadesRouter(prisma));
  app.use('/tenis', authenticated, userRequestLimiter, userMutationLimiter, tenisRouter(prisma));
  app.use('/provas', authenticated, userRequestLimiter, userMutationLimiter, provasRouter(prisma));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
