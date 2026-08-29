import 'dotenv/config';
import { loadEnv } from './src/config/env.js';
import { createDatabase } from './src/db/prisma.js';
import { startServer } from './src/http/server.js';

const env = loadEnv();
const database = createDatabase(env.databaseUrl);
startServer(database, env);