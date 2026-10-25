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
  -f ../migrations/0005_fase_gestao.sql \
  -f ../migrations/0007_novos_perfis.sql \
  -f ../migrations/0008_perfis_e_ministerios.sql \
  -f ../migrations/0009_search_path.sql \
  -f ../migrations/0010_estudos_alunos.sql \
  -f ../migrations/0011_escola_obreiros.sql \
  -f ../migrations/0012_discipulado.sql \
  -f ../migrations/0013_oracao_atendimento.sql \
  -f ../migrations/0014_comunicacao.sql \
  -f teste_isolamento.sql \
  -f teste_pessoas.sql \
  -f teste_gestao.sql \
  -f teste_perfis.sql \
  -f teste_estudos.sql \
  -f teste_escola.sql \
  -f teste_discipulado.sql \
  -f teste_oracao.sql \
  -f teste_comunicacao.sql | grep -E "FALHOU|aprovados|^ +[0-9]+ +\|" 
