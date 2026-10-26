-- Testes das automações. Rode depois de teste_relatorios.sql (reaproveita os dados).
\set ON_ERROR_STOP 1
\set QUIET 1
truncate public._resultados restart identity;
select id as ig1 from public.igrejas where nome = 'Livres em Cristo' \gset
select set_config('t.ig1', :'ig1', false);

-- Dados: visitante sem contato, novo convertido parado, aniversariante,
-- membro sumido do líder, atendimento esperando
insert into pessoas (igreja_id, nome, etapa, primeira_visita, responsavel_id, telefone)
  values (:'ig1', 'Vera Visitante', 0, current_date - 5, null, '11911110001') returning id as vera \gset
insert into pessoas (igreja_id, nome, etapa, primeira_visita, data_conversao, responsavel_id)
  values (:'ig1', 'Nelson Novo', 1, current_date - 30, current_date - 20, '00000000-0000-0000-0000-00000000000f') returning id as nelson \gset
insert into pessoas (igreja_id, nome, etapa, primeira_visita, nascimento, responsavel_id)
  values (:'ig1', 'Ana Aniversário', 4, current_date - 400, (current_date - interval '30 years')::date, '00000000-0000-0000-0000-00000000000f') returning id as aniv \gset
insert into contatos (igreja_id, pessoa_id, canal, data, resumo) values (:'ig1', :'aniv', 'whatsapp', current_date - 3, 'ok');
insert into pessoas (igreja_id, nome, etapa, primeira_visita, responsavel_id)
  values (:'ig1', 'Mário Sumido', 5, current_date - 300, '00000000-0000-0000-0000-00000000000f') returning id as sumido \gset
insert into atendimentos (igreja_id, nome, telefone, assunto, criado_em)
  values (:'ig1', 'Paula Pedido', '11911110009', 'aconselhamento', now() - interval '4 days');
select set_config('t.vera', :'vera', false);

-- ===== Pastor =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
create temp table if not exists _tp as select * from minhas_tarefas(:'ig1') limit 0;
grant all on _tp to authenticated;
insert into _tp select * from minhas_tarefas(:'ig1');
select public._t('pastor vê o visitante sem responsável e sem contato', exists (select 1 from _tp where regra = 'visitante_sem_contato' and pessoa_id = :'vera'));
select public._t('pastor vê o atendimento esperando', exists (select 1 from _tp where regra = 'atendimento_pendente' and nome = 'Paula Pedido'));
select public._t('pastor vê o aniversário de todos', exists (select 1 from _tp where regra = 'aniversario' and pessoa_id = :'aniv'));
select public._t('pastor não recebe o membro sumido do líder', not exists (select 1 from _tp where pessoa_id = :'sumido'));
select public._t('tarefas vêm por prioridade', (select bool_and(prioridade >= 1 and prioridade <= 3) from _tp)
  and (select prioridade from _tp limit 1) = (select min(prioridade) from _tp));
select public._t('10 regras configuráveis', (select count(*) from automacoes_da_igreja(:'ig1')) = 10);

-- adiar some com a tarefa
select adiar_tarefa(:'ig1', 'visitante_sem_contato:' || :'vera', 3);
select public._t('tarefa adiada some da lista', not exists (select 1 from minhas_tarefas(:'ig1') where pessoa_id = :'vera' and regra = 'visitante_sem_contato'));
do $$ begin
  perform adiar_tarefa(current_setting('t.ig1')::uuid, 'x', 0);
  perform public._t('adiar 0 dias é recusado', false);
exception when others then perform public._t('adiar 0 dias é recusado', sqlerrm like '%inválido%'); end $$;

-- desligar a regra
insert into automacoes (igreja_id, regra, ativo, dias) values (:'ig1', 'atendimento_pendente', false, 2);
select public._t('regra desligada não gera tarefa', not exists (select 1 from minhas_tarefas(:'ig1') where regra = 'atendimento_pendente'));
update automacoes set ativo = true, dias = 10 where igreja_id = :'ig1' and regra = 'atendimento_pendente';
select public._t('prazo maior não gera tarefa ainda', not exists (select 1 from minhas_tarefas(:'ig1') where regra = 'atendimento_pendente'));
update automacoes set dias = 2 where igreja_id = :'ig1' and regra = 'atendimento_pendente';
select public._t('prazo volta e a tarefa aparece', exists (select 1 from minhas_tarefas(:'ig1') where regra = 'atendimento_pendente'));

-- ===== Líder =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', false);
truncate _tp; insert into _tp select * from minhas_tarefas(:'ig1');
select public._t('líder vê o novo convertido sem discipulado', exists (select 1 from _tp where regra = 'novo_sem_discipulado' and pessoa_id = :'nelson'));
select public._t('líder vê o acompanhamento do novo convertido', exists (select 1 from _tp where regra = 'acompanhar_novo' and pessoa_id = :'nelson'));
select public._t('líder vê o membro sumido', exists (select 1 from _tp where regra = 'membro_sumido' and pessoa_id = :'sumido'));
select public._t('líder vê o aniversário de quem acompanha', exists (select 1 from _tp where regra = 'aniversario' and pessoa_id = :'aniv'));
select public._t('líder não vê o visitante de outro', not exists (select 1 from _tp where pessoa_id = :'vera'));
select public._t('líder não vê os pedidos de atendimento', not exists (select 1 from _tp where regra = 'atendimento_pendente'));
do $$ begin
  insert into automacoes (igreja_id, regra, ativo, dias) values (current_setting('t.ig1')::uuid, 'aniversario', false, 0);
  perform public._t('líder não muda as automações', false);
exception when others then perform public._t('líder não muda as automações', true); end $$;

-- ===== Tesouraria e outra igreja =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
select public._t('tesouraria não recebe tarefas pastorais', not exists (select 1 from minhas_tarefas(:'ig1') where regra in ('atendimento_pendente','visitante_sem_contato')));
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
select public._t('pastor de outra igreja não vê nada', not exists (select 1 from minhas_tarefas(:'ig1')));
select public._t('pastor de outra igreja não vê as regras', not exists (select 1 from automacoes_da_igreja(:'ig1')));
reset role;
set role anon;
do $$ begin
  perform minhas_tarefas(current_setting('t.ig1')::uuid);
  perform public._t('anônimo não vê', false);
exception when others then perform public._t('anônimo não vê', true); end $$;
reset role;

\set QUIET 0
select n, case when ok then 'OK   ' else 'FALHOU' end as resultado, teste from public._resultados order by n;
select count(*) filter (where ok) as aprovados, count(*) filter (where not ok) as falhas from public._resultados;
