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
  -f ../migrations/0002_restringir_funcoes.sql \
  -f ../migrations/0003_fase_pessoas.sql \
  -f teste_isolamento.sql \
  -f teste_pessoas.sql | grep -E "FALHOU|aprovados|^ +[0-9]+ +\|" 
