import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeCursor, encodeCursor } from '../../src/shared/cursor.js';
import { parseCivilDate, serializeCivilDate } from '../../src/shared/date.js';
import { paceSeconds, round2 } from '../../src/shared/numbers.js';
import { cookieName, cookieOptions, hashPassword, hashSessionToken, normalizeEmail, verifyPassword } from '../../src/modules/auth/service.js';

test('normaliza email sem alterar senha', () => {
  assert.equal(normalizeEmail('  Pessoa@EXEMPLO.COM '), 'pessoa@exemplo.com');
});

test('hash de sessao e deterministico, hexadecimal e nao revela token', () => {
  const token = 'token-super-secreto';
  const digest = hashSessionToken(token);
  assert.equal(digest.length, 64);
  assert.match(digest, /^[a-f0-9]+$/);
  assert.notEqual(digest, token);
  assert.equal(digest, hashSessionToken(token));
});

test('Argon2id valida apenas a senha correta', async () => {
  const encoded = await hashPassword('senha-muito-segura');
  assert.match(encoded, /^\$argon2id\$/);
  assert.equal(await verifyPassword(encoded, 'senha-muito-segura'), true);
  assert.equal(await verifyPassword(encoded, 'senha-incorreta'), false);
});

test('data civil aceita calendario real e serializa sem fuso', () => {
  assert.equal(serializeCivilDate(parseCivilDate('2024-02-29')), '2024-02-29');
  assert.throws(() => parseCivilDate('2023-02-29'));
  assert.throws(() => parseCivilDate('21/07/2026'));
});

test('pace e arredondamento sao derivados', () => {
  assert.equal(paceSeconds(1500, 5), 300);
  assert.equal(round2(10.555), 10.56);
  assert.throws(() => paceSeconds(100, 0));
});

test('cursor base64url preserva a tupla e rejeita lixo', () => {
  const cursor = { data: '2026-07-20T00:00:00.000Z', criado_em: '2026-07-20T10:00:00.000Z', id: '123e4567-e89b-42d3-a456-426614174000' };
  assert.deepEqual(decodeCursor(encodeCursor(cursor)), cursor);
  assert.throws(() => decodeCursor('invalido'));
});

test('cookie de producao usa prefixo Host e flags obrigatorias', () => {
  const env = { databaseUrl: 'postgresql://localhost/running_test', appOrigin: 'https://running.example', cookieSecure: true, sessionDays: 30, port: 3333, nodeEnv: 'production' as const };
  assert.equal(cookieName(env), '__Host-running-session');
  assert.deepEqual(cookieOptions(env), { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 2_592_000_000 });
});
