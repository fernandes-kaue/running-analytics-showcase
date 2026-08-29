import type { PrismaClient } from '@prisma/client';
import type { RequestHandler } from 'express';
import type { AppEnv } from '../config/env.js';
import { ApiError } from '../http/errors.js';
import { clearSessionCookie, cookieName, hashSessionToken } from '../modules/auth/service.js';

export function requireAuth(prisma: PrismaClient, env: AppEnv): RequestHandler {
  return async (req, res, next) => {
    const token = req.cookies?.[cookieName(env)] as unknown;
    if (typeof token !== 'string' || token.length < 32) return next(new ApiError(401, 'Autenticacao necessaria.'));
    try {
      const sessao = await prisma.sessao.findUnique({
        where: { token_hash: hashSessionToken(token) },
        include: { usuario: true },
      });
      if (!sessao) {
        clearSessionCookie(res, env);
        return next(new ApiError(401, 'Sessao invalida.'));
      }
      if (sessao.expira_em <= new Date()) {
        await prisma.sessao.delete({ where: { id: sessao.id } }).catch(() => undefined);
        clearSessionCookie(res, env);
        return next(new ApiError(401, 'Sessao expirada.'));
      }
      res.locals.usuario = { id: sessao.usuario.id, nome: sessao.usuario.nome, email: sessao.usuario.email };
      res.locals.sessaoId = sessao.id;
      next();
    } catch (error) {
      next(error);
    }
  };
}
