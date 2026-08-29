import type { Server } from 'node:http';
import type { AppEnv } from '../config/env.js';
import type { Database } from '../db/prisma.js';
import { createApp } from './app.js';

export function startServer(database: Database, env: AppEnv): Server {
  const app = createApp(database.prisma, env);
  const server = app.listen(env.port, () => console.log(`API ativa na porta ${env.port}`));
  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Encerrando API apos ${signal}.`);
    server.close(() => {
      void database.close().then(() => process.exit(0)).catch(() => process.exit(1));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
  return server;
}
