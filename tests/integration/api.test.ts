import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import request, { type Agent } from 'supertest';
import type { Express } from 'express';
import { createDatabase, type Database } from '../../src/db/prisma.js';
import { createApp } from '../../src/http/app.js';
import type { AppEnv } from '../../src/config/env.js';
import { requireSafeTestDatabase } from './guard.js';

const origin = 'http://localhost:3000';
const env: AppEnv = {
  databaseUrl: '',
  appOrigin: origin,
  cookieSecure: false,
  sessionDays: 30,
  port: 3333,
  nodeEnv: 'test',
};

let database: Database;
let app: Express;
let userA: Agent;
let userB: Agent;
let shoeA = '';
let shoeB = '';
let activityA = '';
let raceA = '';

const currentCivilDate = new Date().toISOString().slice(0, 10);
const futureCivilDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const mutate = (agent: Agent, method: 'post' | 'patch' | 'delete', path: string) => agent[method](path).set('Origin', origin).set('Content-Type', 'application/json');

before(async () => {
  const databaseUrl = requireSafeTestDatabase();
  env.databaseUrl = databaseUrl;
  database = createDatabase(databaseUrl);
  await database.prisma.sessao.deleteMany();
  await database.prisma.usuario.deleteMany();
  app = createApp(database.prisma, env);
  userA = request.agent(app);
  userB = request.agent(app);
});

after(async () => {
  if (database) {
    await database.prisma.sessao.deleteMany();
    await database.prisma.usuario.deleteMany();
    await database.close();
  }
});

test('live e ready distinguem processo e banco', async () => {
  assert.equal((await request(app).get('/health/live')).status, 200);
  assert.equal((await request(app).get('/health/ready')).status, 200);
});

test('mutacoes exigem Origin exato e JSON', async () => {
  const missingOrigin = await request(app).post('/auth/cadastro').send({});
  assert.equal(missingOrigin.status, 403);
  const wrongOrigin = await request(app).post('/auth/cadastro').set('Origin', 'https://invalido.example').send({});
  assert.equal(wrongOrigin.status, 403);
  const wrongType = await request(app).post('/auth/cadastro').set('Origin', origin).set('Content-Type', 'text/plain').send('{}');
  assert.equal(wrongType.status, 415);
});

test('cadastro autentica, normaliza email e nao expoe segredo', async () => {
  const response = await mutate(userA, 'post', '/auth/cadastro').send({ nome: 'Usuario A', email: '  A@Example.COM ', senha: 'senha-segura-a', confirmar_senha: 'senha-segura-a' });
  assert.equal(response.status, 201);
  assert.equal(response.body.usuario.email, 'a@example.com');
  assert.equal(response.body.usuario.password_hash, undefined);
  assert.ok(response.headers['ratelimit-policy']);
  const cookie = response.headers['set-cookie']?.[0] ?? '';
  assert.match(cookie, /^running-session=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Path=\//);
  const stored = await database.prisma.usuario.findUniqueOrThrow({ where: { email: 'a@example.com' }, include: { sessoes: true } });
  assert.match(stored.password_hash, /^\$argon2id\$/);
  assert.equal(stored.sessoes.length, 1);
  assert.equal(cookie.includes(stored.sessoes[0]!.token_hash), false);
});

test('cadastro duplicado conflita e login ausente permanece generico', async () => {
  const duplicate = await mutate(request.agent(app), 'post', '/auth/cadastro').send({ nome: 'Outra', email: 'A@example.com', senha: 'senha-segura-b', confirmar_senha: 'senha-segura-b' });
  assert.equal(duplicate.status, 409);
  const missing = await mutate(request.agent(app), 'post', '/auth/entrar').send({ email: 'ninguem@example.com', senha: 'senha-qualquer' });
  assert.equal(missing.status, 401);
  assert.equal(missing.body.error, 'Email ou senha invalidos.');
  const createdB = await mutate(userB, 'post', '/auth/cadastro').send({ nome: 'Usuario B', email: 'b@example.com', senha: 'senha-segura-b', confirmar_senha: 'senha-segura-b' });
  assert.equal(createdB.status, 201);
});

test('CRUD de tenis e isolamento entre usuarios', async () => {
  const createdA = await mutate(userA, 'post', '/tenis').send({ modelo: 'Nimbus 26', km_limite: 600 });
  const createdB = await mutate(userB, 'post', '/tenis').send({ modelo: 'Pegasus 41', km_limite: 700 });
  assert.equal(createdA.status, 201);
  assert.equal(createdA.body.km_acumulada, 0);
  shoeA = createdA.body.id;
  shoeB = createdB.body.id;
  assert.equal((await userB.get(`/tenis/${shoeA}`)).status, 404);
  assert.equal((await mutate(userB, 'patch', `/tenis/${shoeA}`).send({ modelo: 'Invasao' })).status, 404);
  assert.equal((await mutate(userB, 'delete', `/tenis/${shoeA}`).send({})).status, 404);
  const listA = await userA.get('/tenis');
  assert.deepEqual(listA.body.dados.map((item: { id: string }) => item.id), [shoeA]);
  const patched = await mutate(userA, 'patch', `/tenis/${shoeA}`).send({ km_limite: 500 });
  assert.equal(patched.body.km_limite, 500);
});

test('atividades rejeitam tenis alheio e recalculam dashboard', async () => {
  const foreign = await mutate(userB, 'post', '/atividades').send({ data: currentCivilDate, distancia_km: 5, duracao_segundos: 1500, tenis_id: shoeA });
  assert.equal(foreign.status, 404);
  const future = await mutate(userA, 'post', '/atividades').send({ data: '2999-01-01', distancia_km: 5, duracao_segundos: 1500, tenis_id: shoeA });
  assert.equal(future.status, 422);
  const unknown = await mutate(userA, 'post', '/atividades').send({ data: currentCivilDate, distancia_km: 5, duracao_segundos: 1500, tenis_id: shoeA, pace: 300 });
  assert.equal(unknown.status, 422);
  const precision = await mutate(userA, 'post', '/atividades').send({ data: currentCivilDate, distancia_km: 0.001, duracao_segundos: 1500, tenis_id: shoeA });
  assert.equal(precision.status, 422);
  const created = await mutate(userA, 'post', '/atividades').send({ data: currentCivilDate, distancia_km: 5, duracao_segundos: 1500, tenis_id: shoeA, observacoes: 'Rodagem leve' });
  assert.equal(created.status, 201);
  activityA = created.body.id;
  assert.deepEqual(created.body.tenis, { id: shoeA, modelo: 'Nimbus 26' });
  assert.equal((await userB.get(`/atividades/${activityA}`)).status, 404);
  assert.equal((await mutate(userB, 'patch', `/atividades/${activityA}`).send({ tenis_id: shoeB })).status, 404);
  assert.equal((await mutate(userB, 'delete', `/atividades/${activityA}`).send({})).status, 404);
  assert.deepEqual((await userB.get('/atividades')).body.dados, []);
  assert.equal((await userB.get('/dashboard')).body.resumo_mes.total_atividades, 0);
  const dashboard = await userA.get('/dashboard');
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.resumo_mes.distancia_km, 5);
  assert.equal(dashboard.body.resumo_mes.pace_medio_segundos_km, 300);
  assert.equal(dashboard.body.tenis[0].km_acumulada, 5);
  const patched = await mutate(userA, 'patch', `/atividades/${activityA}`).send({ distancia_km: 10, duracao_segundos: 2700 });
  assert.equal(patched.status, 200);
  const updatedDashboard = await userA.get('/dashboard');
  assert.equal(updatedDashboard.body.resumo_mes.distancia_km, 10);
  assert.equal(updatedDashboard.body.resumo_mes.pace_medio_segundos_km, 270);
  assert.equal((await mutate(userA, 'delete', `/tenis/${shoeA}`).send({})).status, 409);
});

test('paginacao e cursor invalidos sao tratados', async () => {
  const list = await userA.get('/atividades?limit=1');
  assert.equal(list.status, 200);
  assert.equal(list.body.dados.length, 1);
  assert.equal(list.body.proximo_cursor, null);
  assert.equal((await userA.get('/atividades?cursor=lixo')).status, 422);
});

test('CRUD de provas e isolamento entre usuarios', async () => {
  const created = await mutate(userA, 'post', '/provas').send({ nome: '10K Salvador', data: futureCivilDate, distancia_km: 10 });
  assert.equal(created.status, 201);
  raceA = created.body.id;
  assert.equal((await userB.get(`/provas/${raceA}`)).status, 404);
  assert.equal((await mutate(userB, 'delete', `/provas/${raceA}`).send({})).status, 404);
  assert.equal((await mutate(userB, 'patch', `/provas/${raceA}`).send({ nome: 'Invasao' })).status, 404);
  const patched = await mutate(userA, 'patch', `/provas/${raceA}`).send({ nome: '10K Bahia' });
  assert.equal(patched.body.nome, '10K Bahia');
  const listB = await userB.get('/provas');
  assert.deepEqual(listB.body.dados, []);
});

test('logout revoga somente a sessao atual e limpa cookie', async () => {
  const logout = await mutate(userA, 'post', '/auth/sair').send({});
  assert.equal(logout.status, 204);
  assert.match(logout.headers['set-cookie']?.[0] ?? '', /Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
  assert.equal((await userA.get('/auth/sessao')).status, 401);
  const login = await mutate(userA, 'post', '/auth/entrar').send({ email: 'a@example.com', senha: 'senha-segura-a' });
  assert.equal(login.status, 200);
  assert.equal((await userA.get('/auth/sessao')).status, 200);
});

test('exclusoes liberam tenis apenas depois da atividade', async () => {
  assert.equal((await mutate(userA, 'delete', `/atividades/${activityA}`).send({})).status, 204);
  assert.equal((await mutate(userA, 'delete', `/provas/${raceA}`).send({})).status, 204);
  assert.equal((await mutate(userA, 'delete', `/tenis/${shoeA}`).send({})).status, 204);
});
