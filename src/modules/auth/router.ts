import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Prisma, type PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { AppEnv } from '../../config/env.js';
import { ApiError } from '../../http/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import {
  clearSessionCookie,
  cookieName,
  createSession,
  hashPassword,
  hashSessionToken,
  newSession,
  normalizeEmail,
  publicUser,
  setSessionCookie,
  verifyPassword,
} from './service.js';

const cadastroSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.').max(100),
  email: z.string().trim().email('Email invalido.').max(320),
  senha: z.string().min(10, 'A senha deve ter pelo menos 10 caracteres.').max(128),
  confirmar_senha: z.string().min(10).max(128),
}).strict().superRefine((value, ctx) => {
  if (value.senha !== value.confirmar_senha) ctx.addIssue({ code: 'custom', path: ['confirmar_senha'], message: 'As senhas nao conferem.' });
});

const loginSchema = z.object({
  email: z.string().trim().email('Email invalido.').max(320),
  senha: z.string().min(1).max(128),
}).strict();

export function authRouter(prisma: PrismaClient, env: AppEnv): Router {
  const router = Router();
  const limiterOptions = {
    windowMs: 15 * 60 * 1000,
    limit: env.nodeEnv === 'test' ? 1000 : 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitas tentativas. Tente novamente mais tarde.' },
  } as const;
  const cadastroIpLimiter = rateLimit(limiterOptions);
  const loginIpLimiter = rateLimit(limiterOptions);
  const loginIdentityLimiter = rateLimit({
    ...limiterOptions,
    keyGenerator: (req) => {
      if (typeof req.body?.email === 'string') return `email:${normalizeEmail(req.body.email)}`;
      return `ip:${ipKeyGenerator(req.ip ?? '0.0.0.0')}`;
    },
  });

  router.post('/cadastro', cadastroIpLimiter, async (req, res, next) => {
    try {
      const input = cadastroSchema.parse(req.body);
      const passwordHash = await hashPassword(input.senha);
      const usuario = await prisma.$transaction(async (tx) => {
        const created = await tx.usuario.create({
          data: { nome: input.nome, email: normalizeEmail(input.email), password_hash: passwordHash },
        });
        const session = newSession(created.id, env);
        await tx.sessao.create({ data: session.data });
        return { created, token: session.token };
      });
      setSessionCookie(res, env, usuario.token);
      res.status(201).json({ usuario: publicUser(usuario.created) });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return next(new ApiError(409, 'Email ja cadastrado.', { email: 'Email ja cadastrado.' }));
      next(error);
    }
  });

  router.post('/entrar', loginIpLimiter, loginIdentityLimiter, async (req, res, next) => {
    try {
      const input = loginSchema.parse(req.body);
      const usuario = await prisma.usuario.findUnique({ where: { email: normalizeEmail(input.email) } });
      const valid = await verifyPassword(usuario?.password_hash ?? null, input.senha);
      if (!usuario || !valid) throw new ApiError(401, 'Email ou senha invalidos.');
      await createSession(prisma, usuario.id, env, res);
      res.json({ usuario: publicUser(usuario) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/sair', async (req, res, next) => {
    try {
      const token = req.cookies?.[cookieName(env)] as unknown;
      if (typeof token === 'string') await prisma.sessao.deleteMany({ where: { token_hash: hashSessionToken(token) } });
      clearSessionCookie(res, env);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  router.get('/sessao', requireAuth(prisma, env), (_req, res) => {
    res.json({ usuario: res.locals.usuario });
  });

  return router;
}
