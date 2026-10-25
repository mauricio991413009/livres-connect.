-- =====================================================================
-- Livres Connect · migração 0011 · Escola de Obreiros
--
-- Turmas, aulas com chamada, avaliações com notas e certificados com
-- código de verificação. Quem cuida: pastor, pastora e secretaria
-- cadastram turmas e matrículas; o professor da turma faz a chamada,
-- lança notas e define a situação dos alunos; o presbitério acompanha.
-- A matrícula e a aprovação marcam as atividades da Jornada da Alma.
-- =====================================================================

create table public.escola_turmas (
  id                 uuid primary key default gen_random_uuid(),
  igreja_id          uuid not null references public.igrejas(id) on delete cascade,
  nome               text not null check (length(trim(nome)) between 2 and 120),
  curso              text not null default 'Escola de Obreiros',
  inicio             date,
  fim                date,
  horario            text,
  local              text,
  professor_id       uuid references auth.users(id) on delete set null,
  media_minima       numeric(4,2) not null default 7 check (media_minima between 0 and 10),
  frequencia_minima  smallint not null default 75 check (frequencia_minima between 0 and 100),
  status             text not null default 'aberta' check (status in ('aberta','encerrada')),
  criado_em          timestamptz not null default now(),
  unique (id, igreja_id)
);
create index escola_turmas_igreja_idx on public.escola_turmas(igreja_id);

create table public.escola_aulas (
  id         uuid primary key default gen_random_uuid(),
  igreja_id  uuid not null,
  turma_id   uuid not null,
  data       date not null default current_date,
  tema       text not null check (length(trim(tema)) between 2 and 200),
  professor  text,
  criado_em  timestamptz not null default now(),
  unique (id, igreja_id),
  foreign key (turma_id, igreja_id) references public.escola_turmas(id, igreja_id) on delete cascade
);
create index escola_aulas_turma_idx on public.escola_aulas(turma_id);

create table public.escola_alunos (
  id              uuid primary key default gen_random_uuid(),
  igreja_id       uuid not null,
  turma_id        uuid not null,
  pessoa_id       uuid not null,
  matriculado_em  date not null default current_date,
  situacao        text not null default 'cursando'
                  check (situacao in ('cursando','aprovado','reprovado','desistente')),
  concluido_em    date,
  certificado     uuid not null default gen_random_uuid() unique,
  unique (turma_id, pessoa_id),
  unique (id, igreja_id),
  foreign key (turma_id, igreja_id) references public.escola_turmas(id, igreja_id) on delete cascade,
  foreign key (pessoa_id, igreja_id) references public.pessoas(id, igreja_id) on delete cascade
);
create index escola_alunos_pessoa_idx on public.escola_alunos(pessoa_id);

create table public.escola_presencas (
  igreja_id  uuid not null,
  aula_id    uuid not null,
  aluno_id   uuid not null,
  presente   boolean not null,
  primary key (aula_id, aluno_id),
  foreign key (aula_id, igreja_id) references public.escola_aulas(id, igreja_id) on delete cascade,
  foreign key (aluno_id, igreja_id) references public.escola_alunos(id, igreja_id) on delete cascade
);

create table public.escola_avaliacoes (
  id         uuid primary key default gen_random_uuid(),
  igreja_id  uuid not null,
  turma_id   uuid not null,
  titulo     text not null check (length(trim(titulo)) between 2 and 120),
  data       date,
  peso       numeric(4,2) not null default 1 check (peso > 0 and peso <= 10),
  criado_em  timestamptz not null default now(),
  unique (id, igreja_id),
  foreign key (turma_id, igreja_id) references public.escola_turmas(id, igreja_id) on delete cascade
);

create table public.escola_notas (
  igreja_id     uuid not null,
  avaliacao_id  uuid not null,
  aluno_id      uuid not null,
  nota          numeric(4,2) not null check (nota between 0 and 10),
  primary key (avaliacao_id, aluno_id),
  foreign key (avaliacao_id, igreja_id) references public.escola_avaliacoes(id, igreja_id) on delete cascade,
  foreign key (aluno_id, igreja_id) references public.escola_alunos(id, igreja_id) on delete cascade
);

-- ---------------------------------------------------------------------
-- Quem pode o quê
-- ---------------------------------------------------------------------
-- Cadastra turmas e matrículas (pastora entra pela equivalência com secretaria)
create or replace function public.gere_escola(p_igreja uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select tem_perfil(p_igreja, '{pastor,secretaria}');
$$;
-- Vê todas as turmas
create or replace function public.ve_escola(p_igreja uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select tem_perfil(p_igreja, '{pastor,presbiterio,secretaria}');
$$;
-- É o professor desta turma (e tem acesso ativo à igreja)?
create or replace function public.leciona_turma(p_turma uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from escola_turmas t
                 where t.id = p_turma and t.professor_id = auth.uid() and tem_perfil(t.igreja_id));
$$;
create or replace function public.cuida_turma(p_turma uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select leciona_turma(p_turma)
      or exists (select 1 from escola_turmas t where t.id = p_turma and gere_escola(t.igreja_id));
$$;
create or replace function public.ve_turma(p_turma uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select leciona_turma(p_turma)
      or exists (select 1 from escola_turmas t where t.id = p_turma and ve_escola(t.igreja_id));
$$;

alter table public.escola_turmas     enable row level security;
alter table public.escola_aulas      enable row level security;
alter table public.escola_alunos     enable row level security;
alter table public.escola_presencas  enable row level security;
alter table public.escola_avaliacoes enable row level security;
alter table public.escola_notas      enable row level security;

create policy turmas_ver on public.escola_turmas for select to authenticated
  using (ve_escola(igreja_id) or (professor_id = auth.uid() and tem_perfil(igreja_id)));
create policy turmas_criar on public.escola_turmas for insert to authenticated
  with check (gere_escola(igreja_id));
create policy turmas_editar on public.escola_turmas for update to authenticated
  using (gere_escola(igreja_id)) with check (gere_escola(igreja_id));
create policy turmas_excluir on public.escola_turmas for delete to authenticated
  using (tem_perfil(igreja_id, '{pastor}'));

create policy aulas_ver on public.escola_aulas for select to authenticated using (ve_turma(turma_id));
create policy aulas_gerir on public.escola_aulas for all to authenticated
  using (cuida_turma(turma_id)) with check (cuida_turma(turma_id));

create policy avaliacoes_ver on public.escola_avaliacoes for select to authenticated using (ve_turma(turma_id));
create policy avaliacoes_gerir on public.escola_avaliacoes for all to authenticated
  using (cuida_turma(turma_id)) with check (cuida_turma(turma_id));

create policy alunos_ver on public.escola_alunos for select to authenticated using (ve_turma(turma_id));
create policy alunos_matricular on public.escola_alunos for insert to authenticated
  with check (gere_escola(igreja_id));
create policy alunos_editar on public.escola_alunos for update to authenticated
  using (cuida_turma(turma_id)) with check (cuida_turma(turma_id));
create policy alunos_excluir on public.escola_alunos for delete to authenticated
  using (gere_escola(igreja_id));

create policy presencas_ver on public.escola_presencas for select to authenticated
  using (exists (select 1 from escola_aulas a where a.id = aula_id and ve_turma(a.turma_id)));
create policy presencas_gerir on public.escola_presencas for all to authenticated
  using (exists (select 1 from escola_aulas a where a.id = aula_id and cuida_turma(a.turma_id)))
  with check (exists (select 1 from escola_aulas a join escola_alunos al on al.id = aluno_id
                      where a.id = aula_id and al.turma_id = a.turma_id and cuida_turma(a.turma_id)));

create policy notas_ver on public.escola_notas for select to authenticated
  using (exists (select 1 from escola_avaliacoes a where a.id = avaliacao_id and ve_turma(a.turma_id)));
create policy notas_gerir on public.escola_notas for all to authenticated
  using (exists (select 1 from escola_avaliacoes a where a.id = avaliacao_id and cuida_turma(a.turma_id)))
  with check (exists (select 1 from escola_avaliacoes a join escola_alunos al on al.id = aluno_id
                      where a.id = avaliacao_id and al.turma_id = a.turma_id and cuida_turma(a.turma_id)));

grant select, insert, update, delete on public.escola_turmas, public.escola_aulas, public.escola_alunos,
  public.escola_presencas, public.escola_avaliacoes, public.escola_notas to authenticated;
revoke all on public.escola_turmas, public.escola_aulas, public.escola_alunos,
  public.escola_presencas, public.escola_avaliacoes, public.escola_notas from anon;

-- O aluno só muda de turma/pessoa sendo excluído e matriculado de novo
create or replace function public.proteger_matricula()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.turma_id <> old.turma_id or new.pessoa_id <> old.pessoa_id or new.certificado <> old.certificado then
    raise exception 'Para trocar o aluno de turma, cancele a matrícula e matricule de novo.';
  end if;
  if new.situacao in ('aprovado','reprovado') and old.situacao not in ('aprovado','reprovado') then
    new.concluido_em := coalesce(new.concluido_em, current_date);
  elsif new.situacao in ('cursando','desistente') then
    new.concluido_em := null;
  end if;
  return new;
end $$;
create trigger proteger_matricula before update on public.escola_alunos
  for each row execute function public.proteger_matricula();

-- ---------------------------------------------------------------------
-- Ligação com a Jornada da Alma
-- ---------------------------------------------------------------------
create or replace function public.marcar_atividade(p_pessoa uuid, p_padrao text)
returns void language sql security definer set search_path = public as $$
  insert into jornada_atividades (igreja_id, pessoa_id, modelo_id, concluida_em)
  select p.igreja_id, p.id, m.id, now()
  from pessoas p join jornada_atividades_modelo m on m.igreja_id = p.igreja_id and m.ativo
  where p.id = p_pessoa and m.descricao ilike p_padrao
  on conflict (pessoa_id, modelo_id) do update
    set concluida_em = coalesce(jornada_atividades.concluida_em, excluded.concluida_em);
$$;
revoke execute on function public.marcar_atividade(uuid, text) from public, anon, authenticated;

create or replace function public.escola_na_jornada()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform marcar_atividade(new.pessoa_id, '%matrícula na escola%');
  elsif new.situacao = 'aprovado' and old.situacao <> 'aprovado' then
    perform marcar_atividade(new.pessoa_id, '%avaliação final%');
  end if;
  return new;
end $$;
create trigger escola_na_jornada after insert or update of situacao on public.escola_alunos
  for each row execute function public.escola_na_jornada();
revoke execute on function public.escola_na_jornada() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Alunos da turma com nome e WhatsApp (o professor nem sempre tem acesso
-- à ficha completa da pessoa)
-- ---------------------------------------------------------------------
create or replace function public.escola_alunos_da_turma(p_turma uuid)
returns table (id uuid, pessoa_id uuid, nome text, telefone text, matriculado_em date,
               situacao text, concluido_em date, certificado uuid)
language sql stable security definer set search_path = public as $$
  select a.id, a.pessoa_id, p.nome, p.telefone, a.matriculado_em, a.situacao, a.concluido_em,
         case when a.situacao = 'aprovado' then a.certificado end
  from escola_alunos a join pessoas p on p.id = a.pessoa_id
  where a.turma_id = p_turma and ve_turma(p_turma)
  order by p.nome;
$$;
revoke execute on function public.escola_alunos_da_turma(uuid) from public, anon;
grant execute on function public.escola_alunos_da_turma(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Certificado: qualquer pessoa confere pelo código (QR Code impresso)
-- ---------------------------------------------------------------------
create or replace function public.certificado_publico(p_codigo uuid)
returns table (nome text, curso text, turma text, inicio date, fim date, concluido_em date,
               aulas integer, igreja text, cidade text, uf text)
language sql stable security definer set search_path = public as $$
  select p.nome, t.curso, t.nome, t.inicio, t.fim, a.concluido_em,
         (select count(*)::int from escola_aulas x where x.turma_id = t.id),
         i.nome, i.cidade, i.uf
  from escola_alunos a
  join escola_turmas t on t.id = a.turma_id
  join pessoas p on p.id = a.pessoa_id
  join igrejas i on i.id = a.igreja_id
  where a.certificado = p_codigo and a.situacao = 'aprovado' and i.status = 'ativa';
$$;
revoke execute on function public.certificado_publico(uuid) from public;
grant execute on function public.certificado_publico(uuid) to anon, authenticated;

revoke execute on function public.gere_escola(uuid), public.ve_escola(uuid), public.leciona_turma(uuid),
  public.cuida_turma(uuid), public.ve_turma(uuid) from public, anon;
grant execute on function public.gere_escola(uuid), public.ve_escola(uuid), public.leciona_turma(uuid),
  public.cuida_turma(uuid), public.ve_turma(uuid) to authenticated;

-- Auditoria (chamada e notas ficam de fora para não encher o registro)
do $$
declare t text;
begin
  foreach t in array array['escola_turmas','escola_aulas','escola_alunos','escola_avaliacoes'] loop
    execute format('create trigger auditoria_%1$s after insert or update or delete on public.%1$I
                    for each row execute function public.registrar_auditoria()', t);
  end loop;
end $$;
