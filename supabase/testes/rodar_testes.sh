#!/usr/bin/env bash
# Roda os testes de isolamento num Postgres local descartável (para desenvolvedores).
# Uso: PGHOST=... PGPORT=... PGUSER=postgres ./rodar_testes.sh
set -euo pipefail
cd "$(dirname "$0")"
DB="livres_teste_$$"
createdb "$DB"
trap 'dropdb "$DB"' EXIT
psql -d "$DB" -q -v ON_ERROR_STOP=1 \
  -f simular_supabase.sql \
  -f ../migrations/0001_base.sql \
  -f teste_isolamento.sql | tail -50
