-- =====================================================================
-- Livres Connect · migração 0013 · pedidos de oração e atendimento pastoral
--
-- Pedidos de oração chegam pela página pública (QR Code), pelo Portal do
-- Membro ou pela equipe. Quem pede escolhe: só os pastores leem, ou a
-- equipe de intercessão também, e se pode aparecer no mural da igreja
-- (só com o primeiro nome). Pedidos de atendimento (conversar com um
-- pastor) são vistos só pelo pastor, pela pastora e por quem foi
-- designado para atender. Os textos nunca vão para a auditoria.
-- =====================================================================

create table public.pedidos_oracao (
  id             uuid primary key default gen_random_uuid(),
  igreja_id      uuid not null references public.igrejas(id) on delete cascade,
  pessoa_id      uuid references public.pessoas(id) on delete set null,
  nome           text not null check (length(trim(nome)) between 2 and 120),
  telefone       text,
  pedido         text not null check (length(trim(pedido)) between 3 and 2000),
  compartilhar   boolean not null default false,
  mural          boolean not null default false,
  status         text not null default 'aberto' check (status in ('aberto','respondido','arquivado')),
  testemunho     text check (testemunho is null or length(testemunho) <= 2000),
  oracoes        integer not null default 0 check (oracoes >= 0),
  origem         text not null default 'equipe' check (origem in ('publico','portal','equipe')),
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  check (compartilhar or not mural)
);
create index pedidos_oracao_igreja_idx on public.pedidos_oracao(igreja_id, criado_em desc);
create index pedidos_oracao_pessoa_idx on public.pedidos_oracao(pessoa_id);

-- Quem já orou (membros pelo portal): cada um conta uma vez
create table public.pedido_oracoes (
  pedido_id  uuid not null references public.pedidos_oracao(id) on delete cascade,
  pessoa_id  uuid not null references public.pessoas(id) on delete cascade,
  em         timestamptz not null default now(),
  primary key (pedido_id, pessoa_id)
);

create table public.atendimentos (
  id             uuid primary key default gen_random_uuid(),
  igreja_id      uuid not null references public.igrejas(id) on delete cascade,
  pessoa_id      uuid references public.pessoas(id) on delete set null,
  nome           text not null check (length(trim(nome)) between 2 and 120),
  telefone       text,
  assunto        text not null default 'aconselhamento'
                 check (assunto in ('aconselhamento','oracao','visita','familia','casamento','batismo','outro')),
  mensagem       text check (mensagem is null or length(mensagem) <= 2000),
  preferencia    text check (preferencia is null or length(preferencia) <= 200),
  status         text not null default 'pendente' check (status in ('pendente','agendado','realizado','cancelado')),
  agendado_para  timestamptz,
  local          text,
  atendente_id   uuid references auth.users(id) on delete set null,
  origem         text not null default 'equipe' check (origem in ('publico','portal','equipe')),
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);
create index atendimentos_igreja_idx on public.atendimentos(igreja_id, status);

-- ---------------------------------------------------------------------
-- Quem vê
-- ---------------------------------------------------------------------
create or replace function public.ve_pedido(p_igreja uuid, p_compartilhar boolean)
returns boolean language sql stable security definer set search_path = public as $$
  select tem_perfil(p_igreja, '{pastor,pastora}')
      or (p_compartilhar and tem_perfil(p_igreja, '{presbiterio,secretaria,lider,diacono}'));
$$;
create or replace function public.ve_atendimento(p_igreja uuid, p_atendente uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select tem_perfil(p_igreja, '{pastor,pastora}') or (p_atendente = auth.uid() and tem_perfil(p_igreja));
$$;

alter table public.pedidos_oracao enable row level security;
alter table public.pedido_oracoes enable row level security;
alter table public.atendimentos enable row level security;

create policy pedidos_ver on public.pedidos_oracao for select to authenticated
  using (ve_pedido(igreja_id, compartilhar));
create policy pedidos_criar on public.pedidos_oracao for insert to authenticated
  with check (tem_perfil(igreja_id) and origem = 'equipe' and oracoes = 0);
create policy pedidos_editar on public.pedidos_oracao for update to authenticated
  using (tem_perfil(igreja_id, '{pastor,pastora}') or (compartilhar and tem_perfil(igreja_id, '{secretaria,lider}')))
  with check (tem_perfil(igreja_id, '{pastor,pastora}') or (compartilhar and tem_perfil(igreja_id, '{secretaria,lider}')));
create policy pedidos_excluir on public.pedidos_oracao for delete to authenticated
  using (tem_perfil(igreja_id, '{pastor}'));

create policy atendimentos_ver on public.atendimentos for select to authenticated
  using (ve_atendimento(igreja_id, atendente_id));
create policy atendimentos_criar on public.atendimentos for insert to authenticated
  with check (tem_perfil(igreja_id, '{pastor,pastora,secretaria,lider}') and origem = 'equipe');
create policy atendimentos_editar on public.atendimentos for update to authenticated
  using (ve_atendimento(igreja_id, atendente_id))
  with check (tem_perfil(igreja_id, '{pastor,pastora}') or (atendente_id = auth.uid() and tem_perfil(igreja_id)));
create policy atendimentos_excluir on public.atendimentos for delete to authenticated
  using (tem_perfil(igreja_id, '{pastor}'));

grant select, insert, update, delete on public.pedidos_oracao, public.atendimentos to authenticated;
revoke all on public.pedidos_oracao, public.pedido_oracoes, public.atendimentos from anon;
revoke all on public.pedido_oracoes from authenticated;

-- Só pastores mudam o texto, o contato ou a privacidade escolhida por quem pediu
create or replace function public.proteger_pedido()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not tem_perfil(old.igreja_id, '{pastor,pastora}')
     and (new.pedido is distinct from old.pedido or new.nome is distinct from old.nome
          or new.telefone is distinct from old.telefone or new.compartilhar is distinct from old.compartilhar
          or new.mural is distinct from old.mural or new.pessoa_id is distinct from old.pessoa_id
          or new.oracoes < old.oracoes) then
    raise exception 'Só os pastores alteram o pedido ou a privacidade dele.';
  end if;
  new.atualizado_em := now();
  return new;
end $$;
create trigger proteger_pedido before update on public.pedidos_oracao
  for each row execute function public.proteger_pedido();

create or replace function public.ao_mudar_atendimento()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not tem_perfil(old.igreja_id, '{pastor,pastora}')
     and (new.atendente_id is distinct from old.atendente_id or new.mensagem is distinct from old.mensagem) then
    raise exception 'Só o pastor ou a pastora repassam o atendimento.';
  end if;
  new.atualizado_em := now();
  return new;
end $$;
create trigger ao_mudar_atendimento before update on public.atendimentos
  for each row execute function public.ao_mudar_atendimento();
revoke execute on function public.proteger_pedido(), public.ao_mudar_atendimento() from public, anon, authenticated;

-- A equipe registra "orei por este pedido"
create or replace function public.orar_por(p_pedido uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v integer;
begin
  update pedidos_oracao set oracoes = oracoes + 1
  where id = p_pedido and ve_pedido(igreja_id, compartilhar) and status = 'aberto'
  returning oracoes into v;
  if v is null then raise exception 'Pedido não encontrado.'; end if;
  return v;
end $$;
revoke execute on function public.orar_por(uuid) from public, anon;
grant execute on function public.orar_por(uuid) to authenticated;
revoke execute on function public.ve_pedido(uuid, boolean), public.ve_atendimento(uuid, uuid) from public, anon;
grant execute on function public.ve_pedido(uuid, boolean), public.ve_atendimento(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Página pública (QR Code de oração)
-- ---------------------------------------------------------------------
create or replace function public.pessoa_pelo_telefone(p_igreja uuid, p_telefone text)
returns uuid language sql stable security definer set search_path = public as $$
  select id from pessoas
  where igreja_id = p_igreja and length(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g')) >= 10
    and regexp_replace(coalesce(telefone, ''), '\D', '', 'g') = regexp_replace(p_telefone, '\D', '', 'g')
  order by criado_em limit 1;
$$;
revoke execute on function public.pessoa_pelo_telefone(uuid, text) from public, anon, authenticated;

create or replace function public.registrar_pedido_oracao(
  p_igreja uuid, p_nome text, p_telefone text, p_pedido text,
  p_compartilhar boolean, p_mural boolean, p_consentimento boolean)
returns text language plpgsql security definer set search_path = public as $$
declare v_tel text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
begin
  if not exists (select 1 from igrejas where id = p_igreja and status = 'ativa') then
    raise exception 'Igreja não encontrada.';
  end if;
  if not coalesce(p_consentimento, false) then
    raise exception 'É preciso autorizar o uso dos dados para enviar o pedido.';
  end if;
  if length(trim(coalesce(p_nome, ''))) < 2 or length(p_nome) > 120 then
    raise exception 'Informe o seu nome.';
  end if;
  if length(trim(coalesce(p_pedido, ''))) < 3 or length(p_pedido) > 2000 then
    raise exception 'Escreva o seu pedido (até 2.000 letras).';
  end if;
  if v_tel <> '' and (length(v_tel) < 10 or length(v_tel) > 13) then
    raise exception 'Confira o WhatsApp: use o DDD e o número.';
  end if;
  if (select count(*) from pedidos_oracao where igreja_id = p_igreja and origem = 'publico'
        and criado_em > now() - interval '1 hour') >= 60 then
    raise exception 'Muitos pedidos agora. Tente de novo em alguns minutos.';
  end if;
  insert into pedidos_oracao (igreja_id, pessoa_id, nome, telefone, pedido, compartilhar, mural, origem)
  values (p_igreja, pessoa_pelo_telefone(p_igreja, p_telefone), trim(p_nome), nullif(trim(coalesce(p_telefone, '')), ''),
          trim(p_pedido), coalesce(p_compartilhar, false), coalesce(p_compartilhar, false) and coalesce(p_mural, false), 'publico');
  return 'ok';
end $$;

create or replace function public.solicitar_atendimento(
  p_igreja uuid, p_nome text, p_telefone text, p_assunto text, p_mensagem text,
  p_preferencia text, p_consentimento boolean)
returns text language plpgsql security definer set search_path = public as $$
declare v_tel text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
begin
  if not exists (select 1 from igrejas where id = p_igreja and status = 'ativa') then
    raise exception 'Igreja não encontrada.';
  end if;
  if not coalesce(p_consentimento, false) then
    raise exception 'É preciso autorizar o uso dos dados para enviar o pedido.';
  end if;
  if length(trim(coalesce(p_nome, ''))) < 2 or length(p_nome) > 120 then
    raise exception 'Informe o seu nome.';
  end if;
  if length(v_tel) < 10 or length(v_tel) > 13 then
    raise exception 'Informe um WhatsApp com DDD para o pastor falar com você.';
  end if;
  if coalesce(p_assunto, '') not in ('aconselhamento','oracao','visita','familia','casamento','batismo','outro') then
    raise exception 'Escolha o assunto.';
  end if;
  if length(coalesce(p_mensagem, '')) > 2000 or length(coalesce(p_preferencia, '')) > 200 then
    raise exception 'O texto ficou muito longo.';
  end if;
  if (select count(*) from atendimentos where igreja_id = p_igreja and origem = 'publico'
        and criado_em > now() - interval '1 hour') >= 30 then
    raise exception 'Muitos pedidos agora. Tente de novo em alguns minutos.';
  end if;
  insert into atendimentos (igreja_id, pessoa_id, nome, telefone, assunto, mensagem, preferencia, origem)
  values (p_igreja, pessoa_pelo_telefone(p_igreja, p_telefone), trim(p_nome), trim(p_telefone), p_assunto,
          nullif(trim(coalesce(p_mensagem, '')), ''), nullif(trim(coalesce(p_preferencia, '')), ''), 'publico');
  return 'ok';
end $$;
revoke execute on function public.registrar_pedido_oracao(uuid, text, text, text, boolean, boolean, boolean),
  public.solicitar_atendimento(uuid, text, text, text, text, text, boolean) from public;
grant execute on function public.registrar_pedido_oracao(uuid, text, text, text, boolean, boolean, boolean),
  public.solicitar_atendimento(uuid, text, text, text, text, text, boolean) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Auditoria: registra quem mexeu, mas nunca o texto dos pedidos
-- ---------------------------------------------------------------------
create or replace function public.registrar_auditoria()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_old jsonb; v_new jsonb; v_row jsonb; v_ig uuid;
  v_ocultar text[] := case tg_table_name
    when 'anotacoes_pastorais' then array['texto']
    when 'pedidos_oracao' then array['pedido','testemunho','telefone']
    when 'atendimentos' then array['mensagem','telefone']
    else array[]::text[] end;
begin
  if tg_op <> 'INSERT' then v_old := to_jsonb(old) - v_ocultar; end if;
  if tg_op <> 'DELETE' then v_new := to_jsonb(new) - v_ocultar; end if;
  v_row := coalesce(v_new, v_old);
  if tg_table_name = 'igrejas' then
    v_ig := (v_row->>'id')::uuid;
  else
    v_ig := (v_row->>'igreja_id')::uuid;
  end if;
  insert into auditoria (igreja_id, tabela, registro_id, acao, antes, depois, user_id)
  values (v_ig, tg_table_name, (v_row->>'id')::uuid, lower(tg_op), v_old, v_new, auth.uid());
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['pedidos_oracao','atendimentos'] loop
    execute format('create trigger auditoria_%1$s after insert or update or delete on public.%1$I
                    for each row execute function public.registrar_auditoria()', t);
  end loop;
end $$;
