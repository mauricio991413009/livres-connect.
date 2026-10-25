-- =====================================================================
-- Livres Connect · migração 0010 · progresso dos estudos do novo convertido
--
-- O aluno se identifica (nome e WhatsApp) na página pública dos estudos.
-- Cada estudo concluído fica registrado e a equipe acompanha pelo sistema.
-- Se o WhatsApp já pertence a alguém cadastrado, o aluno é ligado a essa
-- pessoa; se não, a pessoa é criada como Novo convertido e encaminhada a
-- quem acompanha.
-- =====================================================================

alter table public.pessoas drop constraint if exists pessoas_origem_check;
alter table public.pessoas add constraint pessoas_origem_check check (origem in ('cadastro','qr','estudos'));

create table public.estudos_alunos (
  id             uuid primary key default gen_random_uuid(),   -- também é o "código" guardado no celular do aluno
  igreja_id      uuid not null references public.igrejas(id) on delete cascade,
  pessoa_id      uuid references public.pessoas(id) on delete set null,
  nome           text not null check (length(trim(nome)) between 3 and 120),
  telefone       text not null,
  criado_em      timestamptz not null default now(),
  ultimo_acesso  timestamptz not null default now()
);
create index estudos_alunos_igreja_idx on public.estudos_alunos(igreja_id);
create index estudos_alunos_pessoa_idx on public.estudos_alunos(pessoa_id);

create table public.estudos_concluidos (
  aluno_id      uuid not null references public.estudos_alunos(id) on delete cascade,
  igreja_id     uuid not null references public.igrejas(id) on delete cascade,
  estudo        smallint not null check (estudo between 1 and 10),
  concluido_em  timestamptz not null default now(),
  primary key (aluno_id, estudo)
);

alter table public.estudos_alunos enable row level security;
alter table public.estudos_concluidos enable row level security;

-- A equipe vê os alunos; o líder vê os alunos das pessoas que acompanha
create policy estudos_alunos_ver on public.estudos_alunos for select to authenticated
  using (tem_perfil(igreja_id, '{pastor,presbiterio,secretaria}')
         or (pessoa_id is not null and lidera_pessoa(pessoa_id, igreja_id)));
create policy estudos_alunos_excluir on public.estudos_alunos for delete to authenticated
  using (tem_perfil(igreja_id, '{pastor}'));
create policy estudos_concluidos_ver on public.estudos_concluidos for select to authenticated
  using (exists (select 1 from public.estudos_alunos a where a.id = aluno_id));

revoke all on public.estudos_alunos, public.estudos_concluidos from anon;
grant select, delete on public.estudos_alunos to authenticated;
grant select on public.estudos_concluidos to authenticated;

-- ---------------------------------------------------------------------
-- Funções públicas (página dos estudos, sem login)
-- ---------------------------------------------------------------------
create or replace function public.estudos_progresso(p_aluno uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'nome', a.nome,
    'concluidos', coalesce((select jsonb_agg(c.estudo order by c.estudo) from estudos_concluidos c where c.aluno_id = a.id), '[]'::jsonb))
  from estudos_alunos a join igrejas i on i.id = a.igreja_id
  where a.id = p_aluno and i.status = 'ativa';
$$;

create or replace function public.estudos_iniciar(
  p_igreja uuid, p_nome text, p_telefone text, p_consentimento boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_tel    text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  v_aluno  uuid;
  v_pessoa uuid;
  v_resp   uuid;
begin
  if not exists (select 1 from igrejas where id = p_igreja and status = 'ativa') then
    raise exception 'Igreja não encontrada.';
  end if;
  if not coalesce(p_consentimento, false) then
    raise exception 'É preciso autorizar o uso dos dados para continuar.';
  end if;
  if length(trim(coalesce(p_nome, ''))) < 3 or length(p_nome) > 120 then
    raise exception 'Informe o seu nome completo.';
  end if;
  if length(v_tel) < 10 or length(v_tel) > 13 then
    raise exception 'Informe um WhatsApp com DDD.';
  end if;

  -- Já começou antes (outro celular, por exemplo)? Continua de onde parou.
  select id into v_aluno from estudos_alunos
  where igreja_id = p_igreja and regexp_replace(telefone, '\D', '', 'g') = v_tel
  order by criado_em limit 1;
  if v_aluno is not null then
    update estudos_alunos set nome = trim(p_nome), ultimo_acesso = now() where id = v_aluno;
    return v_aluno;
  end if;

  if (select count(*) from estudos_alunos where igreja_id = p_igreja and criado_em > now() - interval '1 hour') >= 60 then
    raise exception 'Muitos cadastros agora. Tente de novo em alguns minutos.';
  end if;

  -- Já está cadastrado na igreja?
  select id into v_pessoa from pessoas
  where igreja_id = p_igreja and regexp_replace(coalesce(telefone, ''), '\D', '', 'g') = v_tel
  order by criado_em limit 1;

  if v_pessoa is null then
    select v.user_id into v_resp
    from vinculos v
    where v.igreja_id = p_igreja and v.ativo
      and (v.perfil = 'pastor' or v.perfil = any (perfis_lideranca()))
    order by case when v.perfil = 'pastor' then 1 else 0 end,
             (select count(*) from pessoas p where p.responsavel_id = v.user_id
                and p.igreja_id = p_igreja and p.etapa <= 2),
             random()
    limit 1;
    insert into pessoas (igreja_id, nome, telefone, etapa, origem, responsavel_id,
                         data_conversao, consentimento_lgpd_em)
    values (p_igreja, trim(p_nome), trim(p_telefone), 1, 'estudos', v_resp, current_date, now())
    returning id into v_pessoa;
  end if;

  insert into estudos_alunos (igreja_id, pessoa_id, nome, telefone)
  values (p_igreja, v_pessoa, trim(p_nome), trim(p_telefone))
  returning id into v_aluno;
  return v_aluno;
end $$;

create or replace function public.estudos_concluir(p_aluno uuid, p_estudo smallint, p_feito boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a estudos_alunos%rowtype; v_total int;
begin
  select ea.* into a from estudos_alunos ea join igrejas i on i.id = ea.igreja_id
  where ea.id = p_aluno and i.status = 'ativa';
  if not found then
    raise exception 'Cadastro dos estudos não encontrado. Coloque seu nome de novo.';
  end if;
  if p_estudo < 1 or p_estudo > 10 then
    raise exception 'Estudo inválido.';
  end if;
  if coalesce(p_feito, true) then
    insert into estudos_concluidos (aluno_id, igreja_id, estudo) values (a.id, a.igreja_id, p_estudo)
    on conflict do nothing;
  else
    delete from estudos_concluidos where aluno_id = a.id and estudo = p_estudo;
  end if;
  update estudos_alunos set ultimo_acesso = now() where id = a.id;

  -- Concluiu os 10? Marca a atividade de estudos na Jornada da Alma.
  select count(*) into v_total from estudos_concluidos where aluno_id = a.id;
  if v_total = 10 and a.pessoa_id is not null then
    insert into jornada_atividades (igreja_id, pessoa_id, modelo_id, concluida_em)
    select a.igreja_id, a.pessoa_id, m.id, now()
    from jornada_atividades_modelo m
    where m.igreja_id = a.igreja_id and m.ativo
      and (m.descricao ilike '%lições%' or m.descricao ilike '%estudos%')
    on conflict (pessoa_id, modelo_id) do update set concluida_em = coalesce(jornada_atividades.concluida_em, excluded.concluida_em);
  end if;
  return estudos_progresso(a.id);
end $$;

revoke execute on function public.estudos_progresso(uuid) from public;
revoke execute on function public.estudos_iniciar(uuid, text, text, boolean) from public;
revoke execute on function public.estudos_concluir(uuid, smallint, boolean) from public;
grant execute on function public.estudos_progresso(uuid) to anon, authenticated;
grant execute on function public.estudos_iniciar(uuid, text, text, boolean) to anon, authenticated;
grant execute on function public.estudos_concluir(uuid, smallint, boolean) to anon, authenticated;
