import { createHash, randomBytes } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
import type { PrismaClient, Usuario } from '@prisma/client';
import type { CookieOptions, Response } from 'express';
import type { AppEnv } from '../../config/env.js';

const DUMMY_HASH = '$argon2id$v=19$m=19456,t=2,p=1$bZuEUynnhhxp759pXyLr4g$/tghpUHPs5CZmeHijc+lYX6NzqSb3DcbuuKagiz0LDQ';
const ARGON2ID_ALGORITHM = 2 as const;

export type PublicUser = Pick<Usuario, 'id' | 'nome' | 'email'>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, { algorithm: ARGON2ID_ALGORITHM, memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

export async function verifyPassword(passwordHash: string | null, password: string): Promise<boolean> {
  return verify(passwordHash ?? DUMMY_HASH, password);
}

export function publicUser(usuario: Usuario): PublicUser {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email };
}

export function cookieName(env: AppEnv): string {
  return env.cookieSecure ? '__Host-running-session' : 'running-session';
}

export function cookieOptions(env: AppEnv): CookieOptions {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: env.sessionDays * 24 * 60 * 60 * 1000,
  };
}

export function newSession(usuarioId: string, env: AppEnv) {
  const token = randomBytes(32).toString('base64url');
  const expiraEm = new Date(Date.now() + env.sessionDays * 24 * 60 * 60 * 1000);
  return { token, data: { token_hash: hashSessionToken(token), usuario_id: usuarioId, expira_em: expiraEm } };
}

export function setSessionCookie(res: Response, env: AppEnv, token: string): void {
  res.cookie(cookieName(env), token, cookieOptions(env));
}

export async function createSession(prisma: PrismaClient, usuarioId: string, env: AppEnv, res: Response): Promise<void> {
  const session = newSession(usuarioId, env);
  await prisma.sessao.create({ data: session.data });
  setSessionCookie(res, env, session.token);
}

export function clearSessionCookie(res: Response, env: AppEnv): void {
  const { maxAge: _maxAge, ...options } = cookieOptions(env);
  res.clearCookie(cookieName(env), options);
}
