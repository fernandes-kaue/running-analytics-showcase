import { z } from 'zod';

const booleanString = z.enum(['true', 'false']).default('true').transform((value) => value === 'true');

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  APP_ORIGIN: z.string().url().transform((value) => value.replace(/\/$/, '')),
  COOKIE_SECURE: booleanString,
  SESSION_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
}).superRefine((value, ctx) => {
  if (value.NODE_ENV !== 'production') return;
  if (!value.COOKIE_SECURE) {
    ctx.addIssue({ code: 'custom', path: ['COOKIE_SECURE'], message: 'COOKIE_SECURE deve ser true em producao.' });
  }
  if (new URL(value.APP_ORIGIN).protocol !== 'https:') {
    ctx.addIssue({ code: 'custom', path: ['APP_ORIGIN'], message: 'APP_ORIGIN deve usar HTTPS em producao.' });
  }
});

export type AppEnv = {
  databaseUrl: string;
  appOrigin: string;
  cookieSecure: boolean;
  sessionDays: number;
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
};

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Configuracao de ambiente invalida: ${parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')}`);
  }
  return {
    databaseUrl: parsed.data.DATABASE_URL,
    appOrigin: parsed.data.APP_ORIGIN,
    cookieSecure: parsed.data.COOKIE_SECURE,
    sessionDays: parsed.data.SESSION_DAYS,
    port: parsed.data.PORT,
    nodeEnv: parsed.data.NODE_ENV,
  };
}
