-- =====================================================================
-- Livres Connect · migração 0017 · Automações
--
-- Regras que geram, sozinhas, a lista "Suas tarefas de hoje" de cada
-- pessoa da equipe: visitante sem contato, novo convertido sem
-- acompanhamento, membro sumido, aniversário, escala sem resposta,
-- discipulado parado, novo convertido sem discipulado, pedido de
-- atendimento esperando, faltas seguidas na Escola e estudos parados.
-- O pastor liga, desliga e ajusta o prazo de cada regra. Cada pessoa vê
-- só as tarefas das pessoas que já pode acompanhar.
-- =====================================================================

create table public.automacoes (
  igreja_id  uuid not null references public.igrejas(id) on delete cascade,
  regra      text not null,
  ativo      boolean not null default true,
  dias       smallint not null check (dias between 0 and 365),
  primary key (igreja_id, regra)
);

create table public.tarefas_adiadas (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  igreja_id  uuid not null references public.igrejas(id) on delete cascade,
  chave      text not null,
  ate        date not null,
  primary key (user_id, chave)
);

alter table public.automacoes enable row level security;
alter table public.tarefas_adiadas enable row level security;
create policy automacoes_ver on public.automacoes for select to authenticated using (tem_perfil(igreja_id));
create policy automacoes_gerir on public.automacoes for all to authenticated
  using (tem_perfil(igreja_id, '{pastor}')) with check (tem_perfil(igreja_id, '{pastor}'));
create policy adiadas_minhas on public.tarefas_adiadas for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and tem_perfil(igreja_id));
grant select, insert, update, delete on public.automacoes, public.tarefas_adiadas to authenticated;
revoke all on public.automacoes, public.tarefas_adiadas from anon;

-- Regras disponíveis e prazos padrão
create or replace function public.regras_automacao()
returns table (regra text, titulo text, descricao text, dias smallint, unidade text)
language sql immutable set search_path = public as $$
  values
    ('visitante_sem_contato', 'Visitante sem contato', 'Visitante que ainda não recebeu nenhum contato depois da primeira visita.', 2::smallint, 'dias'),
    ('acompanhar_novo', 'Acompanhar novo convertido', 'Novo convertido, discipulado ou batismo sem contato registrado há algum tempo.', 7::smallint, 'dias'),
    ('novo_sem_discipulado', 'Novo convertido sem discipulado', 'Convertido há algum tempo e ainda sem discipulador.', 14::smallint, 'dias'),
    ('estudos_parado', 'Estudos parados', 'Começou os estudos do novo convertido e parou.', 10::smallint, 'dias'),
    ('discipulado_parado', 'Discipulado parado', 'Discipulado em andamento sem encontro registrado.', 14::smallint, 'dias'),
    ('membro_sumido', 'Membro sem contato', 'Membro ativo sem nenhum contato registrado há muito tempo.', 45::smallint, 'dias'),
    ('aniversario', 'Aniversário', 'Pessoa que faz aniversário hoje.', 0::smallint, 'dias de antecedência'),
    ('escala_pendente', 'Escala sem resposta', 'Voluntário que ainda não confirmou a escala de um culto próximo.', 3::smallint, 'dias antes do culto'),
    ('atendimento_pendente', 'Pedido de atendimento esperando', 'Alguém pediu para conversar com um pastor e ainda não teve retorno.', 2::smallint, 'dias'),
    ('faltas_escola', 'Faltas seguidas na Escola', 'Aluno da Escola de Obreiros que faltou às últimas aulas seguidas.', 2::smallint, 'faltas seguidas');
$$;

create or replace function public.automacoes_da_igreja(p_igreja uuid)
returns table (regra text, titulo text, descricao text, unidade text, ativo boolean, dias smallint, padrao smallint)
language sql stable security definer set search_path = public as $$
  select r.regra, r.titulo, r.descricao, r.unidade, coalesce(a.ativo, true), coalesce(a.dias, r.dias), r.dias
  from regras_automacao() r left join automacoes a on a.igreja_id = p_igreja and a.regra = r.regra
  where tem_perfil(p_igreja);
$$;

-- ---------------------------------------------------------------------
-- As tarefas de hoje do usuário atual
-- ---------------------------------------------------------------------
create or replace function public.minhas_tarefas(p_igreja uuid)
returns table (chave text, regra text, prioridade smallint, pessoa_id uuid, nome text, telefone text, detalhe text, extra jsonb)
language plpgsql stable security definer set search_path = public as $$
declare
  eu uuid := auth.uid();
  v_pastoral boolean := tem_perfil(p_igreja, '{pastor,pastora}');
  v_todos boolean := tem_perfil(p_igreja, '{pastor,presbiterio,secretaria}');
  cfg record;
  d jsonb := '{}';
begin
  if not tem_perfil(p_igreja) then return; end if;
  for cfg in select * from automacoes_da_igreja(p_igreja) loop
    d := d || jsonb_build_object(cfg.regra, case when cfg.ativo then cfg.dias end);
  end loop;

  return query
  with ultimo as (select c.pessoa_id, max(c.data) dt from contatos c where c.igreja_id = p_igreja group by c.pessoa_id),
  minhas as (  -- pessoas que eu acompanho (ou sem responsável, para o pastor e a pastora)
    select p.* from pessoas p
    where p.igreja_id = p_igreja and p.situacao = 'ativo'
      and (p.responsavel_id = eu or (p.responsavel_id is null and v_pastoral) or lidera_ministerio(p_igreja, p.ministerio_id))),
  todas (chave, regra, prioridade, pessoa_id, nome, telefone, detalhe, extra) as (
    -- 1. visitante sem nenhum contato
    select 'visitante_sem_contato:' || p.id, 'visitante_sem_contato', 1::smallint, p.id, p.nome, p.telefone,
           'Primeira visita há ' || (current_date - p.primeira_visita) || ' dias e ninguém falou com ele ainda.', null::jsonb
    from minhas p where (d->>'visitante_sem_contato') is not null and p.etapa = 0
      and not exists (select 1 from ultimo u where u.pessoa_id = p.id)
      and current_date - p.primeira_visita >= (d->>'visitante_sem_contato')::int
    union all
    -- 2. novo convertido / discipulado / batismo sem contato recente
    select 'acompanhar_novo:' || p.id || ':' || coalesce(u.dt, p.primeira_visita), 'acompanhar_novo', 2::smallint, p.id, p.nome, p.telefone,
           (select e from unnest(array['Novo convertido','Discipulado','Batismo']) with ordinality x(e, n) where n = p.etapa) ||
           ' · último contato há ' || (current_date - coalesce(u.dt, p.data_conversao, p.primeira_visita)) || ' dias.', null
    from minhas p left join ultimo u on u.pessoa_id = p.id
    where (d->>'acompanhar_novo') is not null and p.etapa between 1 and 3
      and current_date - coalesce(u.dt, p.data_conversao, p.primeira_visita) >= (d->>'acompanhar_novo')::int
    union all
    -- 3. novo convertido sem discipulado
    select 'novo_sem_discipulado:' || p.id, 'novo_sem_discipulado', 2::smallint, p.id, p.nome, p.telefone,
           'Convertido há ' || (current_date - coalesce(p.data_conversao, p.primeira_visita)) || ' dias e ainda sem discipulador.', null
    from minhas p where (d->>'novo_sem_discipulado') is not null and p.etapa = 1
      and current_date - coalesce(p.data_conversao, p.primeira_visita) >= (d->>'novo_sem_discipulado')::int
      and not exists (select 1 from discipulados x where x.discipulo_id = p.id and x.status = 'ativo')
    union all
    -- 4. estudos parados
    select 'estudos_parado:' || a.id || ':' || a.ultimo_acesso::date, 'estudos_parado', 3::smallint, p.id, p.nome, coalesce(p.telefone, a.telefone),
           (select count(*) from estudos_concluidos c where c.aluno_id = a.id) || ' de 10 estudos · sem avançar há ' || (current_date - a.ultimo_acesso::date) || ' dias.', null
    from estudos_alunos a join minhas p on p.id = a.pessoa_id
    where (d->>'estudos_parado') is not null and current_date - a.ultimo_acesso::date >= (d->>'estudos_parado')::int
      and (select count(*) from estudos_concluidos c where c.aluno_id = a.id) < 10
    union all
    -- 5. discipulado parado
    select 'discipulado_parado:' || x.id || ':' || coalesce((select max(e.data) from discipulado_encontros e where e.discipulado_id = x.id), x.inicio),
           'discipulado_parado', 2::smallint, p.id, p.nome, p.telefone,
           'Discipulado com ' || dr.nome || ' sem encontro há ' || (current_date - coalesce((select max(e.data) from discipulado_encontros e where e.discipulado_id = x.id), x.inicio)) || ' dias.',
           jsonb_build_object('discipulador', dr.nome, 'discipulador_tel', dr.telefone)
    from discipulados x join minhas p on p.id = x.discipulo_id join pessoas dr on dr.id = x.discipulador_id
    where (d->>'discipulado_parado') is not null and x.status = 'ativo'
      and current_date - coalesce((select max(e.data) from discipulado_encontros e where e.discipulado_id = x.id), x.inicio) >= (d->>'discipulado_parado')::int
    union all
    -- 6. membro sem contato (só os que eu acompanho; sem responsável, para o pastor)
    (select 'membro_sumido:' || p.id || ':' || coalesce(u.dt, p.primeira_visita), 'membro_sumido', 3::smallint, p.id, p.nome, p.telefone,
           'Membro sem contato há ' || (current_date - coalesce(u.dt, p.primeira_visita)) || ' dias.', null
    from minhas p left join ultimo u on u.pessoa_id = p.id
    where (d->>'membro_sumido') is not null and p.etapa >= 4
      and current_date - coalesce(u.dt, p.primeira_visita) >= (d->>'membro_sumido')::int
    order by coalesce(u.dt, p.primeira_visita) limit 15)
    union all
    -- 7. aniversário (hoje, ou daqui a N dias)
    select 'aniversario:' || p.id || ':' || extract(year from current_date), 'aniversario', 2::smallint, p.id, p.nome, p.telefone,
           case when (d->>'aniversario')::int = 0 then 'Faz aniversário hoje' else 'Aniversário em ' || to_char(p.nascimento, 'DD/MM') end ||
           ' (' || (extract(year from current_date) - extract(year from p.nascimento))::int || ' anos).', null
    from pessoas p
    where (d->>'aniversario') is not null and p.igreja_id = p_igreja and p.situacao = 'ativo' and p.nascimento is not null
      and to_char(p.nascimento, 'MM-DD') = to_char(current_date + (d->>'aniversario')::int, 'MM-DD')
      and (v_todos or p.responsavel_id = eu or lidera_ministerio(p_igreja, p.ministerio_id))
    union all
    -- 8. escala sem resposta perto do culto
    select 'escala_pendente:' || s.id, 'escala_pendente', 1::smallint, p.id, p.nome, p.telefone,
           m.nome || ' · ' || e.titulo || ' em ' || to_char(e.data, 'DD/MM') || coalesce(' às ' || to_char(e.hora, 'HH24:MI'), '') || ' · ainda sem resposta.',
           jsonb_build_object('token', s.token, 'evento', e.titulo, 'data', e.data, 'hora', e.hora, 'ministerio', m.nome)
    from escalas s join eventos e on e.id = s.evento_id join pessoas p on p.id = s.pessoa_id join ministerios m on m.id = s.ministerio_id
    where (d->>'escala_pendente') is not null and s.igreja_id = p_igreja and s.status = 'pendente'
      and e.data between current_date and current_date + (d->>'escala_pendente')::int
      and (tem_perfil(p_igreja, '{pastor}') or lidera_ministerio(p_igreja, s.ministerio_id))
    union all
    -- 9. pedido de atendimento esperando retorno
    select 'atendimento_pendente:' || a.id, 'atendimento_pendente', 1::smallint, a.pessoa_id, a.nome, a.telefone,
           'Pediu para conversar com um pastor há ' || (current_date - a.criado_em::date) || ' dias' || coalesce(' (prefere ' || a.preferencia || ')', '') || '.',
           jsonb_build_object('atendimento', a.id, 'assunto', a.assunto)
    from atendimentos a
    where (d->>'atendimento_pendente') is not null and a.igreja_id = p_igreja and a.status = 'pendente'
      and current_date - a.criado_em::date >= (d->>'atendimento_pendente')::int
      and (v_pastoral or a.atendente_id = eu)
    union all
    -- 10. faltas seguidas na Escola
    select 'faltas_escola:' || al.id || ':' || (select max(au.data) from escola_aulas au where au.turma_id = al.turma_id), 'faltas_escola', 2::smallint,
           p.id, p.nome, p.telefone, 'Faltou às últimas ' || (d->>'faltas_escola') || ' aulas da ' || t.nome || '.', null
    from escola_alunos al join escola_turmas t on t.id = al.turma_id join pessoas p on p.id = al.pessoa_id
    where (d->>'faltas_escola') is not null and al.igreja_id = p_igreja and al.situacao = 'cursando' and cuida_turma(al.turma_id)
      and (d->>'faltas_escola')::int > 0
      and (select count(*) from (select pr.presente from escola_presencas pr join escola_aulas au on au.id = pr.aula_id
            where pr.aluno_id = al.id order by au.data desc limit (d->>'faltas_escola')::int) ult where not ult.presente) = (d->>'faltas_escola')::int
  )
  select t.* from todas t
  where not exists (select 1 from tarefas_adiadas x where x.user_id = eu and x.chave = t.chave and x.ate > current_date)
  order by 3, 5;
end $$;

create or replace function public.adiar_tarefa(p_igreja uuid, p_chave text, p_dias integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not tem_perfil(p_igreja) then raise exception 'Sem acesso.'; end if;
  if p_dias < 1 or p_dias > 365 or length(p_chave) > 200 then raise exception 'Valor inválido.'; end if;
  insert into tarefas_adiadas (user_id, igreja_id, chave, ate) values (auth.uid(), p_igreja, p_chave, current_date + p_dias)
  on conflict (user_id, chave) do update set ate = excluded.ate;
  delete from tarefas_adiadas where user_id = auth.uid() and ate < current_date - 30;
end $$;

revoke execute on function public.automacoes_da_igreja(uuid), public.minhas_tarefas(uuid), public.adiar_tarefa(uuid, text, integer) from public, anon;
grant execute on function public.automacoes_da_igreja(uuid), public.minhas_tarefas(uuid), public.adiar_tarefa(uuid, text, integer) to authenticated;
grant execute on function public.regras_automacao() to authenticated;

create trigger auditoria_automacoes after insert or update or delete on public.automacoes
  for each row execute function public.registrar_auditoria();
