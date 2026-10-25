-- Simula o mínimo do Supabase (esquema auth, auth.uid(), papéis) num Postgres comum,
-- para testar a migração fora do Supabase. NÃO rode isto no Supabase.
create schema if not exists auth;
create table if not exists auth.users (
  id                  uuid primary key default gen_random_uuid(),
  email               text,
  email_confirmed_at  timestamptz,
  raw_user_meta_data  jsonb default '{}'::jsonb
);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
