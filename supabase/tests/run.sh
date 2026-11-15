#!/usr/bin/env bash
# Paleidžia duomenų bazės testus tuščioje PostgreSQL duomenų bazėje.
# Naudojimas: DATABASE_URL=postgres://... supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/.."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f tests/00_stub_auth.sql
for f in migrations/*.sql; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$f"
done
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f tests/10_rls_test.sql
