-- =====================================================================
-- Livres Connect · migração 0014 · Comunicação
--
-- Comunicados com público (todos, membros, novos convertidos, visitantes,
-- quem serve, um ministério). O sistema monta a lista de quem deve
-- receber, com o WhatsApp de cada um, e marca quem já recebeu. O
-- comunicado também pode aparecer no Portal do Membro.
-- Pastor, pastora e secretaria enviam para qualquer público; quem lidera
-- um ministério envia para o próprio ministério.
-- =====================================================================

create table public.comunicados (
  id             uuid primary key default gen_random_uuid(),
  igreja_id      uuid not null references public.igrejas(id) on delete cascade,
  titulo         text not null check (length(trim(titulo)) between 2 and 120),
  texto          text not null check (length(trim(texto)) between 2 and 3000),
  alvo           text not null default 'membros'
                 check (alvo in ('todos','membros','novos','visitantes','servindo','ministerio')),
  ministerio_id  uuid,
  no_portal      boolean not null default true,
  expira_em      date,
  autor_id       uuid default auth.uid() references auth.users(id) on delete set null,
  criado_em      timestamptz not null default now(),
  check (alvo <> 'ministerio' or ministerio_id is not null),
  unique (id, igreja_id),
  foreign key (ministerio_id, igreja_id) references public.ministerios(id, igreja_id) on delete cascade
);
create index comunicados_igreja_idx on public.comunicados(igreja_id, criado_em desc);

create table public.comunicado_envios (
  comunicado_id  uuid not null,
  pessoa_id      uuid not null,
  igreja_id      uuid not null,
  enviado_em     timestamptz not null default now(),
  enviado_por    uuid default auth.uid() references auth.users(id) on delete set null,
  primary key (comunicado_id, pessoa_id),
  foreign key (comunicado_id, igreja_id) references public.comunicados(id, igreja_id) on delete cascade,
  foreign key (pessoa_id, igreja_id) references public.pessoas(id, igreja_id) on delete cascade
);

-- A pessoa faz parte do público do comunicado?
create or replace function public.no_publico(p_etapa smallint, p_ministerio uuid, p_alvo text, p_alvo_ministerio uuid)
returns boolean language sql immutable set search_path = public as $$
  select case p_alvo
    when 'todos' then true
    when 'membros' then p_etapa >= 4
    when 'novos' then p_etapa between 1 and 3
    when 'visitantes' then p_etapa = 0
    when 'servindo' then p_etapa >= 5
    when 'ministerio' then p_ministerio is not distinct from p_alvo_ministerio
    else false end;
$$;

create or replace function public.gere_comunicado(p_igreja uuid, p_alvo text, p_ministerio uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select tem_perfil(p_igreja, '{pastor,secretaria}')
      or (p_alvo = 'ministerio' and lidera_ministerio(p_igreja, p_ministerio));
$$;

alter table public.comunicados enable row level security;
alter table public.comunicado_envios enable row level security;

create policy comunicados_ver on public.comunicados for select to authenticated
  using (tem_perfil(igreja_id, '{pastor,presbiterio,secretaria,lider}'));
create policy comunicados_criar on public.comunicados for insert to authenticated
  with check (gere_comunicado(igreja_id, alvo, ministerio_id));
create policy comunicados_editar on public.comunicados for update to authenticated
  using (gere_comunicado(igreja_id, alvo, ministerio_id)) with check (gere_comunicado(igreja_id, alvo, ministerio_id));
create policy comunicados_excluir on public.comunicados for delete to authenticated
  using (gere_comunicado(igreja_id, alvo, ministerio_id));

grant select, insert, update, delete on public.comunicados to authenticated;
revoke all on public.comunicados, public.comunicado_envios from anon;
revoke all on public.comunicado_envios from authenticated;

-- ---------------------------------------------------------------------
-- Lista de envio
-- ---------------------------------------------------------------------
create or replace function public.comunicado_destinatarios(p_comunicado uuid)
returns table (pessoa_id uuid, nome text, telefone text, enviado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.telefone, e.enviado_em
  from comunicados c
  join pessoas p on p.igreja_id = c.igreja_id
  left join comunicado_envios e on e.comunicado_id = c.id and e.pessoa_id = p.id
  where c.id = p_comunicado and gere_comunicado(c.igreja_id, c.alvo, c.ministerio_id)
    and p.situacao = 'ativo' and length(regexp_replace(coalesce(p.telefone, ''), '\D', '', 'g')) >= 10
    and no_publico(p.etapa, p.ministerio_id, c.alvo, c.ministerio_id)
  order by e.enviado_em nulls first, p.nome;
$$;

-- Resumo para a lista: quantos devem receber e quantos já receberam
create or replace function public.comunicados_resumo(p_igreja uuid)
returns table (id uuid, total integer, enviados integer, pode_enviar boolean)
language sql stable security definer set search_path = public as $$
  select c.id,
         (select count(*)::int from pessoas p where p.igreja_id = c.igreja_id and p.situacao = 'ativo'
            and length(regexp_replace(coalesce(p.telefone, ''), '\D', '', 'g')) >= 10
            and no_publico(p.etapa, p.ministerio_id, c.alvo, c.ministerio_id)),
         (select count(*)::int from comunicado_envios e where e.comunicado_id = c.id),
         gere_comunicado(c.igreja_id, c.alvo, c.ministerio_id)
  from comunicados c
  where c.igreja_id = p_igreja and tem_perfil(p_igreja, '{pastor,presbiterio,secretaria,lider}');
$$;

create or replace function public.comunicado_marcar(p_comunicado uuid, p_pessoa uuid, p_enviado boolean)
returns void language plpgsql security definer set search_path = public as $$
declare c comunicados%rowtype;
begin
  select * into c from comunicados where id = p_comunicado;
  if not found or not gere_comunicado(c.igreja_id, c.alvo, c.ministerio_id) then
    raise exception 'Seu perfil não tem permissão para enviar este comunicado.';
  end if;
  if coalesce(p_enviado, true) then
    insert into comunicado_envios (comunicado_id, pessoa_id, igreja_id)
    select c.id, p.id, c.igreja_id from pessoas p where p.id = p_pessoa and p.igreja_id = c.igreja_id
    on conflict do nothing;
  else
    delete from comunicado_envios where comunicado_id = c.id and pessoa_id = p_pessoa;
  end if;
end $$;

revoke execute on function public.gere_comunicado(uuid, text, uuid), public.comunicado_destinatarios(uuid),
  public.comunicados_resumo(uuid), public.comunicado_marcar(uuid, uuid, boolean) from public, anon;
grant execute on function public.gere_comunicado(uuid, text, uuid), public.comunicado_destinatarios(uuid),
  public.comunicados_resumo(uuid), public.comunicado_marcar(uuid, uuid, boolean) to authenticated;

create trigger auditoria_comunicados after insert or update or delete on public.comunicados
  for each row execute function public.registrar_auditoria();
