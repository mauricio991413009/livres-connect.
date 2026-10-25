-- =====================================================================
-- Livres Connect · migração 0001 · base da plataforma
--
-- Cria todas as tabelas da 1ª etapa, as regras de acesso por igreja e
-- por perfil (Row Level Security), a auditoria de alterações e os
-- convites de usuários.
--
-- Como usar: no Supabase, abra "SQL Editor", cole este arquivo inteiro
-- e clique em "Run". Rode uma única vez, num projeto novo.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
do $$ begin
  create type public.perfil as enum
    ('pastor','presbiterio','tesouraria','secretaria','lider','diacono','membro');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Plataforma: igrejas, usuários, vínculos e convites
-- ---------------------------------------------------------------------
create table public.igrejas (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null check (length(trim(nome)) between 2 and 120),
  cidade        text,
  uf            char(2),
  cnpj          text,
  logotipo_url  text,
  status        text not null default 'ativa' check (status in ('ativa','suspensa')),
  criada_em     timestamptz not null default now()
);

-- Quem administra a plataforma inteira (cadastra igrejas). Não vê dados internos.
create table public.admins_plataforma (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  criado_em  timestamptz not null default now()
);

-- Espelho público das contas (nome e e-mail), preenchido automaticamente.
create table public.usuarios (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text not null default '',
  email      text not null,
  criado_em  timestamptz not null default now()
);

create table public.ministerios (
  id         uuid primary key default gen_random_uuid(),
  igreja_id  uuid not null references public.igrejas(id) on delete cascade,
  nome       text not null,
  ativo      boolean not null default true,
  unique (igreja_id, nome),
  unique (id, igreja_id)
);

-- Um usuário pode ter um ou mais perfis em uma ou mais igrejas.
create table public.vinculos (
  id             uuid primary key default gen_random_uuid(),
  igreja_id      uuid not null references public.igrejas(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  perfil         public.perfil not null,
  ministerio_id  uuid,
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now(),
  unique (igreja_id, user_id, perfil),
  foreign key (ministerio_id, igreja_id) references public.ministerios(id, igreja_id)
);
create index vinculos_user_idx on public.vinculos(user_id);

-- O pastor convida pelo e-mail; quando a pessoa confirma a conta, o vínculo é criado.
create table public.convites (
  id             uuid primary key default gen_random_uuid(),
  igreja_id      uuid not null references public.igrejas(id) on delete cascade,
  email          text not null check (email = lower(trim(email)) and email like '%_@_%'),
  perfil         public.perfil not null,
  ministerio_id  uuid,
  convidado_por  uuid default auth.uid() references auth.users(id) on delete set null,
  criado_em      timestamptz not null default now(),
  aceito_em      timestamptz,
  unique (igreja_id, email, perfil),
  foreign key (ministerio_id, igreja_id) references public.ministerios(id, igreja_id)
);

-- ---------------------------------------------------------------------
-- Pessoas e Jornada da Alma
-- Visitantes e membros ficam na mesma tabela; a etapa diz o que cada um é.
-- 0 Visitante · 1 Novo convertido · 2 Discipulado · 3 Batismo
-- 4 Membro · 5 Formação · 6 Serviço ministerial
-- ---------------------------------------------------------------------
create table public.pessoas (
  id                     uuid primary key default gen_random_uuid(),
  igreja_id              uuid not null references public.igrejas(id) on delete cascade,
  user_id                uuid references auth.users(id) on delete set null,
  nome                   text not null check (length(trim(nome)) >= 2),
  foto_url               text,
  nascimento             date,
  casamento              date,
  telefone               text,
  email                  text,
  endereco               text,
  etapa                  smallint not null default 0 check (etapa between 0 and 6),
  situacao               text not null default 'ativo'
                         check (situacao in ('ativo','afastado','transferido','falecido')),
  responsavel_id         uuid references auth.users(id) on delete set null,
  ministerio_id          uuid,
  convidado_por          text,
  primeira_visita        date default current_date,
  data_conversao         date,
  data_batismo           date,
  batismo_programado     date,
  consentimento_lgpd_em  timestamptz,
  criado_em              timestamptz not null default now(),
  unique (id, igreja_id),
  foreign key (ministerio_id, igreja_id) references public.ministerios(id, igreja_id)
);
create index pessoas_igreja_etapa_idx on public.pessoas(igreja_id, etapa);
create index pessoas_responsavel_idx on public.pessoas(responsavel_id);

create table public.jornada_etapas (
  id           uuid primary key default gen_random_uuid(),
  igreja_id    uuid not null,
  pessoa_id    uuid not null,
  etapa        smallint not null check (etapa between 0 and 6),
  data_inicio  date not null default current_date,
  autor_id     uuid default auth.uid() references auth.users(id) on delete set null,
  criado_em    timestamptz not null default now(),
  foreign key (pessoa_id, igreja_id) references public.pessoas(id, igreja_id) on delete cascade
);

create table public.jornada_atividades_modelo (
  id         uuid primary key default gen_random_uuid(),
  igreja_id  uuid not null references public.igrejas(id) on delete cascade,
  etapa      smallint not null check (etapa between 0 and 6),
  descricao  text not null,
  ordem      smallint not null default 0,
  ativo      boolean not null default true,
  unique (id, igreja_id)
);

create table public.jornada_atividades (
  id            uuid primary key default gen_random_uuid(),
  igreja_id     uuid not null,
  pessoa_id     uuid not null,
  modelo_id     uuid not null,
  concluida_em  timestamptz,
  autor_id      uuid default auth.uid() references auth.users(id) on delete set null,
  unique (pessoa_id, modelo_id),
  foreign key (pessoa_id, igreja_id) references public.pessoas(id, igreja_id) on delete cascade,
  foreign key (modelo_id, igreja_id) references public.jornada_atividades_modelo(id, igreja_id) on delete cascade
);

create table public.contatos (
  id         uuid primary key default gen_random_uuid(),
  igreja_id  uuid not null,
  pessoa_id  uuid not null,
  canal      text not null check (canal in ('whatsapp','ligacao','visita','culto','outro')),
  data       date not null default current_date,
  resumo     text,
  autor_id   uuid default auth.uid() references auth.users(id) on delete set null,
  criado_em  timestamptz not null default now(),
  foreign key (pessoa_id, igreja_id) references public.pessoas(id, igreja_id) on delete cascade
);

-- Acesso restrito: só o pastor e o líder responsável pela pessoa.
-- O texto nunca é copiado para a auditoria nem para relatórios.
create table public.anotacoes_pastorais (
  id         uuid primary key default gen_random_uuid(),
  igreja_id  uuid not null,
  pessoa_id  uuid not null,
  texto      text not null,
  autor_id   uuid default auth.uid() references auth.users(id) on delete set null,
  criado_em  timestamptz not null default now(),
  foreign key (pessoa_id, igreja_id) references public.pessoas(id, igreja_id) on delete cascade
);

-- ---------------------------------------------------------------------
-- Agenda e escalas
-- ---------------------------------------------------------------------
create table public.eventos (
  id           uuid primary key default gen_random_uuid(),
  igreja_id    uuid not null references public.igrejas(id) on delete cascade,
  titulo       text not null,
  tipo         text not null default 'culto'
               check (tipo in ('culto','formacao','oracao','evangelismo','lideranca','especial')),
  data         date not null,
  hora         time,
  local        text,
  recorrencia  text check (recorrencia is null or recorrencia in ('semanal')),
  criado_em    timestamptz not null default now(),
  unique (id, igreja_id)
);
create index eventos_igreja_data_idx on public.eventos(igreja_id, data);

create table public.presencas (
  id             uuid primary key default gen_random_uuid(),
  igreja_id      uuid not null,
  evento_id      uuid not null,
  pessoa_id      uuid not null,
  confirmado_em  timestamptz not null default now(),
  compareceu     boolean,
  unique (evento_id, pessoa_id),
  foreign key (evento_id, igreja_id) references public.eventos(id, igreja_id) on delete cascade,
  foreign key (pessoa_id, igreja_id) references public.pessoas(id, igreja_id) on delete cascade
);

create table public.escalas (
  id                   uuid primary key default gen_random_uuid(),
  igreja_id            uuid not null,
  evento_id            uuid not null,
  ministerio_id        uuid not null,
  pessoa_id            uuid not null,
  status               text not null default 'pendente'
                       check (status in ('pendente','confirmado','recusado')),
  lembrete_enviado_em  timestamptz,
  criado_em            timestamptz not null default now(),
  unique (evento_id, ministerio_id, pessoa_id),
  foreign key (evento_id, igreja_id) references public.eventos(id, igreja_id) on delete cascade,
  foreign key (ministerio_id, igreja_id) references public.ministerios(id, igreja_id) on delete cascade,
  foreign key (pessoa_id, igreja_id) references public.pessoas(id, igreja_id) on delete cascade
);

-- ---------------------------------------------------------------------
-- Financeiro (valores sempre em centavos, número inteiro)
-- ---------------------------------------------------------------------
create table public.categorias_financeiras (
  id         uuid primary key default gen_random_uuid(),
  igreja_id  uuid not null references public.igrejas(id) on delete cascade,
  nome       text not null,
  tipo       text not null check (tipo in ('entrada','saida')),
  unique (igreja_id, nome, tipo),
  unique (id, igreja_id)
);

create table public.campanhas (
  id             uuid primary key default gen_random_uuid(),
  igreja_id      uuid not null references public.igrejas(id) on delete cascade,
  nome           text not null,
  meta_centavos  bigint check (meta_centavos is null or meta_centavos > 0),
  inicio         date,
  fim            date,
  unique (id, igreja_id)
);

create table public.lancamentos (
  id               uuid primary key default gen_random_uuid(),
  igreja_id        uuid not null,
  tipo             text not null check (tipo in ('entrada','saida')),
  categoria_id     uuid not null,
  campanha_id      uuid,
  descricao        text not null,
  valor_centavos   bigint not null check (valor_centavos > 0),
  data             date not null default current_date,
  vencimento       date,
  pago_em          date,
  comprovante_url  text,
  autor_id         uuid default auth.uid() references auth.users(id) on delete set null,
  criado_em        timestamptz not null default now(),
  foreign key (categoria_id, igreja_id) references public.categorias_financeiras(id, igreja_id),
  foreign key (campanha_id, igreja_id) references public.campanhas(id, igreja_id)
);
create index lancamentos_igreja_data_idx on public.lancamentos(igreja_id, data);

-- ---------------------------------------------------------------------
-- Auditoria: toda criação, edição e exclusão fica registrada
-- (sem chave estrangeira, para o registro sobreviver à exclusão)
-- ---------------------------------------------------------------------
create table public.auditoria (
  id           bigint generated always as identity primary key,
  igreja_id    uuid,
  tabela       text not null,
  registro_id  uuid,
  acao         text not null,
  antes        jsonb,
  depois       jsonb,
  user_id      uuid,
  em           timestamptz not null default now()
);
create index auditoria_igreja_em_idx on public.auditoria(igreja_id, em desc);

-- =====================================================================
-- Funções de apoio às regras de acesso
-- =====================================================================
create or replace function public.eh_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins_plataforma where user_id = auth.uid());
$$;

-- O usuário atual tem (algum / um destes) perfil(is) ativo(s) nesta igreja ativa?
create or replace function public.tem_perfil(p_igreja uuid, p_perfis public.perfil[] default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from vinculos v join igrejas i on i.id = v.igreja_id
    where v.user_id = auth.uid() and v.igreja_id = p_igreja and v.ativo
      and i.status = 'ativa'
      and (p_perfis is null or v.perfil = any (p_perfis)));
$$;

create or replace function public.lidera_pessoa(p_pessoa uuid, p_igreja uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select tem_perfil(p_igreja, '{lider}') and exists (
    select 1 from pessoas p
    where p.id = p_pessoa and p.igreja_id = p_igreja and (
      p.responsavel_id = auth.uid()
      or (p.ministerio_id is not null and exists (
            select 1 from vinculos v
            where v.user_id = auth.uid() and v.igreja_id = p_igreja and v.ativo
              and v.perfil = 'lider' and v.ministerio_id = p.ministerio_id))));
$$;

create or replace function public.pode_ver_pessoa(p_pessoa uuid, p_igreja uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select tem_perfil(p_igreja, '{pastor,presbiterio,secretaria}')
      or lidera_pessoa(p_pessoa, p_igreja)
      or exists (select 1 from pessoas p where p.id = p_pessoa and p.igreja_id = p_igreja
                 and p.user_id = auth.uid() and tem_perfil(p_igreja));
$$;

create or replace function public.pode_editar_pessoa(p_pessoa uuid, p_igreja uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select tem_perfil(p_igreja, '{pastor,secretaria}') or lidera_pessoa(p_pessoa, p_igreja);
$$;

create or replace function public.pode_ver_anotacao(p_pessoa uuid, p_igreja uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select tem_perfil(p_igreja, '{pastor}')
      or (tem_perfil(p_igreja, '{lider}') and exists (
            select 1 from pessoas p where p.id = p_pessoa and p.igreja_id = p_igreja
            and p.responsavel_id = auth.uid()));
$$;

-- Dois usuários compartilham alguma igreja ativa?
create or replace function public.pode_ver_usuario(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from vinculos a join vinculos b on a.igreja_id = b.igreja_id
    where a.user_id = auth.uid() and b.user_id = p_user and a.ativo and b.ativo);
$$;

-- =====================================================================
-- Gatilhos (triggers)
-- =====================================================================

-- Auditoria genérica
create or replace function public.registrar_auditoria()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_old jsonb; v_new jsonb; v_row jsonb; v_ig uuid;
begin
  if tg_op <> 'INSERT' then v_old := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then v_new := to_jsonb(new); end if;
  v_row := coalesce(v_new, v_old);
  if tg_table_name = 'igrejas' then
    v_ig := (v_row->>'id')::uuid;
  else
    v_ig := (v_row->>'igreja_id')::uuid;
  end if;
  if tg_table_name = 'anotacoes_pastorais' then
    v_old := v_old - 'texto';
    v_new := v_new - 'texto';
  end if;
  insert into auditoria (igreja_id, tabela, registro_id, acao, antes, depois, user_id)
  values (v_ig, tg_table_name, (v_row->>'id')::uuid, lower(tg_op), v_old, v_new, auth.uid());
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'igrejas','ministerios','vinculos','convites','pessoas','jornada_etapas',
    'jornada_atividades_modelo','jornada_atividades','contatos','anotacoes_pastorais',
    'eventos','presencas','escalas','categorias_financeiras','campanhas','lancamentos']
  loop
    execute format(
      'create trigger auditoria_%1$s after insert or update or delete on public.%1$I
       for each row execute function public.registrar_auditoria()', t);
  end loop;
end $$;

-- Só o administrador da plataforma suspende ou reativa uma igreja
create or replace function public.proteger_status_igreja()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and auth.uid() is not null and not eh_admin() then
    raise exception 'Somente o administrador da plataforma pode suspender ou reativar uma igreja.';
  end if;
  return new;
end $$;
create trigger proteger_status before update on public.igrejas
  for each row execute function public.proteger_status_igreja();

-- A igreja nunca fica sem um pastor presidente ativo
create or replace function public.proteger_ultimo_pastor()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or eh_admin() then
    return coalesce(new, old);
  end if;
  if old.perfil = 'pastor' and old.ativo
     and (tg_op = 'DELETE' or not new.ativo or new.perfil <> 'pastor')
     and not exists (select 1 from vinculos v where v.igreja_id = old.igreja_id
                     and v.perfil = 'pastor' and v.ativo and v.id <> old.id) then
    raise exception 'A igreja precisa ter pelo menos um pastor presidente ativo.';
  end if;
  return coalesce(new, old);
end $$;
create trigger proteger_ultimo_pastor before update or delete on public.vinculos
  for each row execute function public.proteger_ultimo_pastor();

-- Transforma convites pendentes em vínculos
create or replace function public.aplicar_convites(p_user uuid, p_email text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into vinculos (igreja_id, user_id, perfil, ministerio_id)
  select c.igreja_id, p_user, c.perfil, c.ministerio_id
  from convites c where c.email = lower(p_email) and c.aceito_em is null
  on conflict (igreja_id, user_id, perfil) do update set ativo = true;
  update convites set aceito_em = now()
  where email = lower(p_email) and aceito_em is null;
end $$;

-- Nova conta: cria o espelho em "usuarios" e, se o e-mail já foi confirmado, aplica convites
create or replace function public.ao_mudar_conta()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into usuarios (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', ''), lower(coalesce(new.email, '')))
  on conflict (id) do update set email = excluded.email;
  if new.email_confirmed_at is not null then
    perform aplicar_convites(new.id, new.email);
  end if;
  return new;
end $$;
create trigger ao_criar_conta after insert on auth.users
  for each row execute function public.ao_mudar_conta();
create trigger ao_confirmar_conta after update of email_confirmed_at, email on auth.users
  for each row execute function public.ao_mudar_conta();

-- Convite para alguém que já tem conta confirmada: vínculo imediato
create or replace function public.ao_criar_convite()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  select id into v_user from auth.users
  where lower(email) = new.email and email_confirmed_at is not null limit 1;
  if v_user is not null then
    perform aplicar_convites(v_user, new.email);
  end if;
  return new;
end $$;
create trigger ao_criar_convite after insert on public.convites
  for each row execute function public.ao_criar_convite();

-- =====================================================================
-- Criar uma igreja nova com tudo o que ela precisa para começar
-- (só o administrador da plataforma)
-- =====================================================================
create or replace function public.criar_igreja(
  p_nome text, p_cidade text, p_uf text, p_email_pastor text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not eh_admin() then
    raise exception 'Somente o administrador da plataforma cadastra igrejas.';
  end if;
  if coalesce(trim(p_email_pastor), '') not like '%_@_%' then
    raise exception 'Informe um e-mail válido para o pastor presidente.';
  end if;

  insert into igrejas (nome, cidade, uf)
  values (trim(p_nome), nullif(trim(p_cidade), ''), nullif(upper(trim(p_uf)), ''))
  returning id into v_id;

  insert into ministerios (igreja_id, nome)
  select v_id, n from unnest(array['Louvor','Recepção','Diáconos','Intercessão',
    'Mídia e transmissão','Limpeza','Infantil','Segurança e estacionamento']) n;

  insert into categorias_financeiras (igreja_id, nome, tipo)
  select v_id, n, 'entrada' from unnest(array['Dízimos','Ofertas','Mantenedores','Campanhas']) n
  union all
  select v_id, n, 'saida' from unnest(array['Aluguel','Energia e água','Internet e mídia',
    'Prebenda pastoral','Missões','Manutenção','Limpeza','Campanhas']) n;

  insert into jornada_atividades_modelo (igreja_id, etapa, descricao, ordem) values
    (v_id,0,'Contato em até 48 horas',1),(v_id,0,'Convite para o próximo culto',2),(v_id,0,'Apresentar a um líder',3),
    (v_id,1,'Visita do consolidador',1),(v_id,1,'Entrega do material de boas-vindas',2),(v_id,1,'Inscrição no discipulado',3),
    (v_id,2,'Concluir as lições do discipulado',1),(v_id,2,'Participar de um grupo',2),(v_id,2,'Conversa com o pastor',3),
    (v_id,3,'Classe de batismo',1),(v_id,3,'Entrevista pastoral',2),(v_id,3,'Data do batismo marcada',3),
    (v_id,4,'Cadastro completo',1),(v_id,4,'Carteirinha emitida',2),(v_id,4,'Integração a um ministério',3),
    (v_id,5,'Matrícula na Escola de Obreiros',1),(v_id,5,'Curso de liderança',2),(v_id,5,'Avaliação final',3),
    (v_id,6,'Escalado em um ministério',1),(v_id,6,'Acompanhamento do líder',2),(v_id,6,'Discipulando outra pessoa',3);

  insert into convites (igreja_id, email, perfil)
  values (v_id, lower(trim(p_email_pastor)), 'pastor');

  return v_id;
end $$;

-- =====================================================================
-- Regras de acesso (Row Level Security)
-- =====================================================================
alter table public.igrejas                   enable row level security;
alter table public.admins_plataforma         enable row level security;
alter table public.usuarios                  enable row level security;
alter table public.ministerios               enable row level security;
alter table public.vinculos                  enable row level security;
alter table public.convites                  enable row level security;
alter table public.pessoas                   enable row level security;
alter table public.jornada_etapas            enable row level security;
alter table public.jornada_atividades_modelo enable row level security;
alter table public.jornada_atividades        enable row level security;
alter table public.contatos                  enable row level security;
alter table public.anotacoes_pastorais       enable row level security;
alter table public.eventos                   enable row level security;
alter table public.presencas                 enable row level security;
alter table public.escalas                   enable row level security;
alter table public.categorias_financeiras    enable row level security;
alter table public.campanhas                 enable row level security;
alter table public.lancamentos               enable row level security;
alter table public.auditoria                 enable row level security;

-- Igrejas
create policy igrejas_ver on public.igrejas for select to authenticated
  using (eh_admin() or tem_perfil(id));
create policy igrejas_criar on public.igrejas for insert to authenticated
  with check (eh_admin());
create policy igrejas_editar on public.igrejas for update to authenticated
  using (eh_admin() or tem_perfil(id, '{pastor}'))
  with check (eh_admin() or tem_perfil(id, '{pastor}'));
create policy igrejas_excluir on public.igrejas for delete to authenticated
  using (eh_admin());

-- Administradores (só leitura; inclusão é feita direto no SQL Editor)
create policy admins_ver on public.admins_plataforma for select to authenticated
  using (user_id = auth.uid() or eh_admin());

-- Usuários
create policy usuarios_ver on public.usuarios for select to authenticated
  using (id = auth.uid() or eh_admin() or pode_ver_usuario(id));
create policy usuarios_editar on public.usuarios for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Ministérios
create policy ministerios_ver on public.ministerios for select to authenticated
  using (tem_perfil(igreja_id) or eh_admin());
create policy ministerios_gerir on public.ministerios for all to authenticated
  using (tem_perfil(igreja_id, '{pastor}')) with check (tem_perfil(igreja_id, '{pastor}'));

-- Vínculos
create policy vinculos_ver on public.vinculos for select to authenticated
  using (user_id = auth.uid() or tem_perfil(igreja_id, '{pastor}') or eh_admin());
create policy vinculos_gerir on public.vinculos for all to authenticated
  using (tem_perfil(igreja_id, '{pastor}') or eh_admin())
  with check (tem_perfil(igreja_id, '{pastor}') or eh_admin());

-- Convites
create policy convites_gerir on public.convites for all to authenticated
  using (tem_perfil(igreja_id, '{pastor}') or eh_admin())
  with check (tem_perfil(igreja_id, '{pastor}') or eh_admin());

-- Pessoas
create policy pessoas_ver on public.pessoas for select to authenticated
  using (pode_ver_pessoa(id, igreja_id));
create policy pessoas_criar on public.pessoas for insert to authenticated
  with check (tem_perfil(igreja_id, '{pastor,secretaria}'));
create policy pessoas_editar on public.pessoas for update to authenticated
  using (pode_editar_pessoa(id, igreja_id)) with check (pode_editar_pessoa(id, igreja_id));
create policy pessoas_excluir on public.pessoas for delete to authenticated
  using (tem_perfil(igreja_id, '{pastor}'));

-- Jornada, contatos (seguem o acesso à pessoa)
create policy jornada_etapas_ver on public.jornada_etapas for select to authenticated
  using (pode_ver_pessoa(pessoa_id, igreja_id));
create policy jornada_etapas_criar on public.jornada_etapas for insert to authenticated
  with check (pode_editar_pessoa(pessoa_id, igreja_id));
create policy jornada_etapas_excluir on public.jornada_etapas for delete to authenticated
  using (tem_perfil(igreja_id, '{pastor}'));

create policy atividades_modelo_ver on public.jornada_atividades_modelo for select to authenticated
  using (tem_perfil(igreja_id));
create policy atividades_modelo_gerir on public.jornada_atividades_modelo for all to authenticated
  using (tem_perfil(igreja_id, '{pastor}')) with check (tem_perfil(igreja_id, '{pastor}'));

create policy atividades_ver on public.jornada_atividades for select to authenticated
  using (pode_ver_pessoa(pessoa_id, igreja_id));
create policy atividades_gerir on public.jornada_atividades for all to authenticated
  using (pode_editar_pessoa(pessoa_id, igreja_id)) with check (pode_editar_pessoa(pessoa_id, igreja_id));

create policy contatos_ver on public.contatos for select to authenticated
  using (pode_ver_pessoa(pessoa_id, igreja_id));
create policy contatos_criar on public.contatos for insert to authenticated
  with check (pode_editar_pessoa(pessoa_id, igreja_id));
create policy contatos_editar on public.contatos for update to authenticated
  using (autor_id = auth.uid() and pode_editar_pessoa(pessoa_id, igreja_id))
  with check (autor_id = auth.uid() and pode_editar_pessoa(pessoa_id, igreja_id));
create policy contatos_excluir on public.contatos for delete to authenticated
  using (tem_perfil(igreja_id, '{pastor}'));

-- Anotações pastorais
create policy anotacoes_ver on public.anotacoes_pastorais for select to authenticated
  using (pode_ver_anotacao(pessoa_id, igreja_id));
create policy anotacoes_criar on public.anotacoes_pastorais for insert to authenticated
  with check (pode_ver_anotacao(pessoa_id, igreja_id) and autor_id = auth.uid());
create policy anotacoes_editar on public.anotacoes_pastorais for update to authenticated
  using (autor_id = auth.uid() and pode_ver_anotacao(pessoa_id, igreja_id))
  with check (autor_id = auth.uid() and pode_ver_anotacao(pessoa_id, igreja_id));
create policy anotacoes_excluir on public.anotacoes_pastorais for delete to authenticated
  using (autor_id = auth.uid() or tem_perfil(igreja_id, '{pastor}'));

-- Eventos
create policy eventos_ver on public.eventos for select to authenticated
  using (tem_perfil(igreja_id));
create policy eventos_gerir on public.eventos for all to authenticated
  using (tem_perfil(igreja_id, '{pastor,presbiterio,secretaria,lider}'))
  with check (tem_perfil(igreja_id, '{pastor,presbiterio,secretaria,lider}'));

-- Presenças
create policy presencas_ver on public.presencas for select to authenticated
  using (tem_perfil(igreja_id, '{pastor,presbiterio,secretaria,lider}')
         or exists (select 1 from pessoas p where p.id = pessoa_id and p.user_id = auth.uid()));
create policy presencas_gerir on public.presencas for all to authenticated
  using (tem_perfil(igreja_id, '{pastor,secretaria}')
         or exists (select 1 from pessoas p where p.id = pessoa_id and p.user_id = auth.uid()))
  with check (tem_perfil(igreja_id, '{pastor,secretaria}')
         or exists (select 1 from pessoas p where p.id = pessoa_id and p.user_id = auth.uid()
                    and p.igreja_id = presencas.igreja_id));

-- Escalas
create policy escalas_ver on public.escalas for select to authenticated
  using (tem_perfil(igreja_id, '{pastor,presbiterio,secretaria,lider,diacono}')
         or exists (select 1 from pessoas p where p.id = pessoa_id and p.user_id = auth.uid()));
create policy escalas_gerir on public.escalas for all to authenticated
  using (tem_perfil(igreja_id, '{pastor}')
         or exists (select 1 from vinculos v where v.user_id = auth.uid() and v.igreja_id = escalas.igreja_id
                    and v.ativo and v.perfil = 'lider' and v.ministerio_id = escalas.ministerio_id))
  with check (tem_perfil(igreja_id, '{pastor}')
         or exists (select 1 from vinculos v where v.user_id = auth.uid() and v.igreja_id = escalas.igreja_id
                    and v.ativo and v.perfil = 'lider' and v.ministerio_id = escalas.ministerio_id));

-- Financeiro
create policy categorias_ver on public.categorias_financeiras for select to authenticated
  using (tem_perfil(igreja_id, '{pastor,presbiterio,tesouraria}'));
create policy categorias_gerir on public.categorias_financeiras for all to authenticated
  using (tem_perfil(igreja_id, '{pastor,tesouraria}')) with check (tem_perfil(igreja_id, '{pastor,tesouraria}'));
create policy campanhas_ver on public.campanhas for select to authenticated
  using (tem_perfil(igreja_id, '{pastor,presbiterio,tesouraria}'));
create policy campanhas_gerir on public.campanhas for all to authenticated
  using (tem_perfil(igreja_id, '{pastor,tesouraria}')) with check (tem_perfil(igreja_id, '{pastor,tesouraria}'));
create policy lancamentos_ver on public.lancamentos for select to authenticated
  using (tem_perfil(igreja_id, '{pastor,presbiterio,tesouraria}'));
create policy lancamentos_gerir on public.lancamentos for all to authenticated
  using (tem_perfil(igreja_id, '{pastor,tesouraria}')) with check (tem_perfil(igreja_id, '{pastor,tesouraria}'));

-- Auditoria (só leitura, pelo pastor da igreja)
create policy auditoria_ver on public.auditoria for select to authenticated
  using (tem_perfil(igreja_id, '{pastor}') or (eh_admin() and tabela = 'igrejas'));

-- =====================================================================
-- Permissões de tabela
-- =====================================================================
revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke insert, update, delete on public.auditoria, public.admins_plataforma from authenticated;
revoke update on public.usuarios from authenticated;
revoke insert, delete on public.usuarios from authenticated;
grant update (nome) on public.usuarios to authenticated;

revoke execute on function public.aplicar_convites(uuid, text) from public, anon, authenticated;
revoke execute on function public.criar_igreja(text, text, text, text) from public, anon;
grant execute on function public.criar_igreja(text, text, text, text) to authenticated;
