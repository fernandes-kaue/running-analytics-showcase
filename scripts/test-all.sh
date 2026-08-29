#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DATABASE_URL="postgresql://running_test:running_test@127.0.0.1:55432/running_test"

compose_test() {
  docker compose -f "$PROJECT_ROOT/compose.test.yaml" "$@"
}

cleanup() {
  compose_test down >/dev/null 2>&1 || true
}
trap cleanup EXIT

compose_test up -d --wait

compose_test exec -T test-db dropdb -U running_test --if-exists running_test
compose_test exec -T test-db createdb -U running_test running_test
DATABASE_URL="$TEST_DATABASE_URL" DIRECT_URL="$TEST_DATABASE_URL" npx prisma migrate deploy

npm run test:unit
TEST_DATABASE_URL="$TEST_DATABASE_URL" npm run test:integration

compose_test exec -T test-db dropdb -U running_test --if-exists running_upgrade_test
compose_test exec -T test-db createdb -U running_test running_upgrade_test
compose_test exec -T test-db psql -U running_test -d running_upgrade_test -v ON_ERROR_STOP=1 < "$PROJECT_ROOT/prisma/migrations/20260721000000_init/migration.sql"
compose_test exec -T test-db psql -U running_test -d running_upgrade_test -v ON_ERROR_STOP=1 < "$PROJECT_ROOT/prisma/migrations/20260721060000_auth_multiusuario/migration.sql"
compose_test exec -T test-db psql -U running_test -d running_upgrade_test -Atc 'SELECT count(*) FROM information_schema.tables WHERE table_schema = '\''public'\'' AND table_name IN ('\''Usuario'\'', '\''Sessao'\'', '\''Tenis'\'', '\''Treino'\'', '\''Prova'\'');' | grep -qx '5'

compose_test exec -T test-db dropdb -U running_test --if-exists running_legacy_test
compose_test exec -T test-db createdb -U running_test running_legacy_test
compose_test exec -T test-db psql -U running_test -d running_legacy_test -v ON_ERROR_STOP=1 < "$PROJECT_ROOT/prisma/migrations/20260721000000_init/migration.sql"
compose_test exec -T test-db psql -U running_test -d running_legacy_test -v ON_ERROR_STOP=1 -c 'INSERT INTO "Tenis" ("id", "modelo", "km_limite") VALUES ('\''legacy-shoe'\'', '\''Legacy'\'', 100);'
if compose_test exec -T test-db psql -U running_test -d running_legacy_test -v ON_ERROR_STOP=1 < "$PROJECT_ROOT/prisma/migrations/20260721060000_auth_multiusuario/migration.sql"; then
  echo "A migration incremental deveria abortar com dados legados." >&2
  exit 1
fi
compose_test exec -T test-db psql -U running_test -d running_legacy_test -Atc 'SELECT count(*) FROM "Tenis";' | grep -qx '1'

npm --prefix "$PROJECT_ROOT/frontend-corrida" run lint
npm --prefix "$PROJECT_ROOT/frontend-corrida" run typecheck
npm --prefix "$PROJECT_ROOT/frontend-corrida" test
npm --prefix "$PROJECT_ROOT/frontend-corrida" run build

echo "Gate completo aprovado."
