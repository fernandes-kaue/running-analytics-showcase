export function requireSafeTestDatabase(source: NodeJS.ProcessEnv = process.env): string {
  const value = source.TEST_DATABASE_URL;
  if (!value) throw new Error('TEST_DATABASE_URL obrigatoria para testes integrados.');
  const url = new URL(value);
  const database = url.pathname.replace(/^\//, '');
  if (!['127.0.0.1', 'localhost'].includes(url.hostname) || database !== 'running_test') {
    throw new Error('TEST_DATABASE_URL deve apontar para localhost/running_test.');
  }
  return value;
}
