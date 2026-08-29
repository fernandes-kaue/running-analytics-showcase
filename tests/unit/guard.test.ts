import assert from 'node:assert/strict';
import test from 'node:test';
import { loadEnv } from '../../src/config/env.js';
import { requireSafeTestDatabase } from '../integration/guard.js';

test('guard aceita somente banco local running_test', () => {
  assert.equal(requireSafeTestDatabase({ TEST_DATABASE_URL: 'postgresql://postgres:test@127.0.0.1:55432/running_test' }), 'postgresql://postgres:test@127.0.0.1:55432/running_test');
  assert.throws(() => requireSafeTestDatabase({ TEST_DATABASE_URL: 'postgresql://postgres:test@db.example.com/running_test' }));
  assert.throws(() => requireSafeTestDatabase({ TEST_DATABASE_URL: 'postgresql://postgres:test@localhost/postgres' }));
  assert.throws(() => requireSafeTestDatabase({ DATABASE_URL: 'postgresql://postgres:test@localhost/running_test' }));
});

test('producao exige HTTPS e cookie seguro', () => {
  const base = {
    DATABASE_URL: 'postgresql://running:test@db:5432/running',
    APP_ORIGIN: 'https://running.example.com',
    COOKIE_SECURE: 'true',
    NODE_ENV: 'production',
  };
  assert.equal(loadEnv(base).cookieSecure, true);
  assert.throws(() => loadEnv({ ...base, COOKIE_SECURE: 'false' }));
  assert.throws(() => loadEnv({ ...base, APP_ORIGIN: 'http://running.example.com' }));
});
