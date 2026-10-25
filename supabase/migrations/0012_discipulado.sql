-- =====================================================================
-- Livres Connect · migração 0012 · Discipulado
--
-- Um membro (discipulador) acompanha uma pessoa (discípulo) por 8 lições.
-- Cada encontro fica registrado, com a lição estudada. O acesso segue as
-- regras da pessoa discipulada: quem pode vê-la vê o discipulado; quem
-- pode editá-la registra encontros. Começar o discipulado e concluir as
-- 8 lições marcam as atividades da Jornada da Alma.
-- =====================================================================

create table public.discipulados (
  id               uuid primary key default gen_random_uuid(),
  igreja_id        uuid not null,
  discipulo_id     uuid not null,
  discipulador_id  uuid not null,
  inicio           date not null default current_date,
  status           text not null default 'ativo' check (status in ('ativo','concluido','interrompido')),
  concluido_em     date,
  criado_em        timestamptz not null default now(),
  check (discipulo_id <> discipulador_id),
  unique (id, igreja_id),
  foreign key (discipulo_id, igreja_id) references public.pessoas(id, igreja_id) on delete cascade,
  foreign key (discipulador_id, igreja_id) references public.pessoas(id, igreja_id) on delete cascade
);
-- Cada pessoa tem no máximo um discipulado em andamento
create unique index discipulados_um_ativo on public.discipulados(discipulo_id) where status = 'ativo';
create index discipulados_igreja_idx on public.discipulados(igreja_id);
create index discipulados_discipulador_idx on public.discipulados(discipulador_id);

create table public.discipulado_encontros (
  id              uuid primary key default gen_random_uuid(),
  igreja_id       uuid not null,
  discipulado_id  uuid not null,
  data            date not null default current_date,
  licao           smallint check (licao between 1 and 8),
  resumo          text check (resumo is null or length(resumo) <= 1000),
  registrado_por  uuid default auth.uid() references auth.users(id) on delete set null,
  via_portal      boolean not null default false,
  criado_em       timestamptz not null default now(),
  foreign key (discipulado_id, igreja_id) references public.discipulados(id, igreja_id) on delete cascade
);
create index discipulado_encontros_disc_idx on public.discipulado_encontros(discipulado_id);

alter table public.discipulados enable row level security;
alter table public.discipulado_encontros enable row level security;

create policy discipulados_ver on public.discipulados for select to authenticated
  using (pode_ver_pessoa(discipulo_id, igreja_id));
create policy discipulados_criar on public.discipulados for insert to authenticated
  with check (pode_editar_pessoa(discipulo_id, igreja_id));
create policy discipulados_editar on public.discipulados for update to authenticated
  using (pode_editar_pessoa(discipulo_id, igreja_id)) with check (pode_editar_pessoa(discipulo_id, igreja_id));
create policy discipulados_excluir on public.discipulados for delete to authenticated
  using (tem_perfil(igreja_id, '{pastor}'));

create policy encontros_ver on public.discipulado_encontros for select to authenticated
  using (exists (select 1 from discipulados d where d.id = discipulado_id and pode_ver_pessoa(d.discipulo_id, d.igreja_id)));
create policy encontros_gerir on public.discipulado_encontros for all to authenticated
  using (exists (select 1 from discipulados d where d.id = discipulado_id and pode_editar_pessoa(d.discipulo_id, d.igreja_id)))
  with check (exists (select 1 from discipulados d where d.id = discipulado_id and pode_editar_pessoa(d.discipulo_id, d.igreja_id)));

grant select, insert, update, delete on public.discipulados, public.discipulado_encontros to authenticated;
revoke all on public.discipulados, public.discipulado_encontros from anon;

-- ---------------------------------------------------------------------
-- Regras automáticas
-- ---------------------------------------------------------------------
create or replace function public.ao_mudar_discipulado()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if new.discipulo_id <> old.discipulo_id then
      raise exception 'Para mudar o discípulo, comece um novo discipulado.';
    end if;
    if new.status = 'concluido' and old.status <> 'concluido' then
      new.concluido_em := coalesce(new.concluido_em, current_date);
    elsif new.status = 'ativo' then
      new.concluido_em := null;
    end if;
  end if;
  return new;
end $$;
create trigger ao_mudar_discipulado before update on public.discipulados
  for each row execute function public.ao_mudar_discipulado();

-- Começou: marca a inscrição, a atividade do discipulador e leva o novo
-- convertido para a etapa Discipulado
create or replace function public.discipulado_na_jornada()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform marcar_atividade(new.discipulo_id, '%inscrição no discipulado%');
  perform marcar_atividade(new.discipulador_id, '%discipulando outra pessoa%');
  if (select etapa from pessoas where id = new.discipulo_id) = 1 then
    update pessoas set etapa = 2 where id = new.discipulo_id;
    insert into jornada_etapas (igreja_id, pessoa_id, etapa) values (new.igreja_id, new.discipulo_id, 2);
  end if;
  return new;
end $$;
create trigger discipulado_na_jornada after insert on public.discipulados
  for each row execute function public.discipulado_na_jornada();

-- Estudou as 8 lições: marca a atividade da Jornada
create or replace function public.encontro_na_jornada()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_disc uuid;
begin
  if new.licao is null then return new; end if;
  select discipulo_id into v_disc from discipulados where id = new.discipulado_id;
  if (select count(distinct licao) from discipulado_encontros
      where discipulado_id = new.discipulado_id and licao is not null) >= 8 then
    perform marcar_atividade(v_disc, '%lições do discipulado%');
  end if;
  return new;
end $$;
create trigger encontro_na_jornada after insert or update of licao on public.discipulado_encontros
  for each row execute function public.encontro_na_jornada();
revoke execute on function public.ao_mudar_discipulado(), public.discipulado_na_jornada(),
  public.encontro_na_jornada() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Lista com nomes (o líder pode não ter acesso à ficha do discipulador)
-- ---------------------------------------------------------------------
create or replace function public.discipulados_lista(p_igreja uuid, p_pessoa uuid default null)
returns table (id uuid, discipulo_id uuid, discipulo text, discipulo_tel text,
               discipulador_id uuid, discipulador text, discipulador_tel text,
               inicio date, status text, concluido_em date, licoes smallint[],
               encontros integer, ultimo_encontro date)
language sql stable security definer set search_path = public as $$
  select d.id, d.discipulo_id, a.nome, a.telefone, d.discipulador_id, b.nome, b.telefone,
         d.inicio, d.status, d.concluido_em,
         coalesce((select array_agg(distinct e.licao order by e.licao) from discipulado_encontros e
                   where e.discipulado_id = d.id and e.licao is not null), '{}'),
         (select count(*)::int from discipulado_encontros e where e.discipulado_id = d.id),
         (select max(e.data) from discipulado_encontros e where e.discipulado_id = d.id)
  from discipulados d
  join pessoas a on a.id = d.discipulo_id
  join pessoas b on b.id = d.discipulador_id
  where d.igreja_id = p_igreja
    and (p_pessoa is null or d.discipulo_id = p_pessoa or d.discipulador_id = p_pessoa)
    and pode_ver_pessoa(d.discipulo_id, d.igreja_id)
  order by (d.status = 'ativo') desc, a.nome;
$$;

-- Quem pode ser discipulador: membros ativos (etapa Membro em diante)
create or replace function public.discipuladores_possiveis(p_igreja uuid)
returns table (pessoa_id uuid, nome text, etapa smallint, discipulos integer)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.etapa,
         (select count(*)::int from discipulados d where d.discipulador_id = p.id and d.status = 'ativo')
  from pessoas p
  where p.igreja_id = p_igreja and p.etapa >= 4 and p.situacao = 'ativo'
    and tem_perfil(p_igreja, '{pastor,secretaria,lider}')
  order by p.nome;
$$;
revoke execute on function public.discipulados_lista(uuid, uuid), public.discipuladores_possiveis(uuid) from public, anon;
grant execute on function public.discipulados_lista(uuid, uuid), public.discipuladores_possiveis(uuid) to authenticated;

do $$
declare t text;
begin
  foreach t in array array['discipulados','discipulado_encontros'] loop
    execute format('create trigger auditoria_%1$s after insert or update or delete on public.%1$I
                    for each row execute function public.registrar_auditoria()', t);
  end loop;
end $$;
