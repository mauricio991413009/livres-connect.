-- Testes do progresso dos estudos. Rode depois de teste_perfis.sql (reaproveita os dados).
\set ON_ERROR_STOP 1
\set QUIET 1
truncate public._resultados restart identity;
select id as ig1 from public.igrejas where nome = 'Livres em Cristo' \gset
select id as ig2 from public.igrejas where nome = 'Vida Nova' \gset
reset role;
select set_config('request.jwt.claim.sub', '', false);
update igrejas set status = 'ativa' where id = :'ig2';
update pessoas set telefone = '(47) 98888-1234' where nome = 'Carla Souza';

-- ===== Aluno anônimo =====
set role anon;
do $$ begin
  perform public.estudos_iniciar((select null::uuid), 'Teste Nome', '47999990000', true);
  perform public._t('igreja inexistente é recusada', false);
exception when others then perform public._t('igreja inexistente é recusada', true); end $$;
reset role;
do $$ declare ig uuid; a uuid; b uuid; r jsonb; begin
  select id into ig from public.igrejas where nome = 'Livres em Cristo';
  set local role anon;
  begin
    perform public.estudos_iniciar(ig, 'Pedro Novo', '(47) 97777-1111', false);
    perform public._t('sem consentimento é recusado', false);
  exception when others then perform public._t('sem consentimento é recusado', sqlerrm like '%autorizar%'); end;
  a := public.estudos_iniciar(ig, 'Pedro Novo', '(47) 97777-1111', true);
  perform public._t('aluno novo recebe código', a is not null);
  r := public.estudos_concluir(a, 1::smallint, true);
  r := public.estudos_concluir(a, 2::smallint, true);
  perform public._t('progresso tem 2 estudos', jsonb_array_length(r->'concluidos') = 2);
  r := public.estudos_concluir(a, 2::smallint, false);
  perform public._t('desmarcar remove o estudo', jsonb_array_length(r->'concluidos') = 1);
  perform public._t('progresso mostra o nome', (public.estudos_progresso(a))->>'nome' = 'Pedro Novo');
  b := public.estudos_iniciar(ig, 'Pedro Novo Silva', '47977771111', true);
  perform public._t('mesmo WhatsApp continua o mesmo aluno', a = b);
  begin
    perform public.estudos_concluir(a, 11::smallint, true);
    perform public._t('estudo 11 é recusado', false);
  exception when others then perform public._t('estudo 11 é recusado', true); end;
  begin
    perform count(*) from public.estudos_alunos;
    perform public._t('anônimo não lê a lista de alunos', false);
  exception when others then perform public._t('anônimo não lê a lista de alunos', true); end;
  -- Carla já está cadastrada: o aluno é ligado a ela
  a := public.estudos_iniciar(ig, 'Carla Souza', '(47) 98888-1234', true);
  for i in 1..10 loop r := public.estudos_concluir(a, i::smallint, true); end loop;
  perform public._t('Carla concluiu os 10', jsonb_array_length(r->'concluidos') = 10);
end $$;
reset role;
select public._t('aluno novo virou Novo convertido', (select etapa = 1 and origem = 'estudos' and responsavel_id is not null from pessoas where nome = 'Pedro Novo Silva' or nome = 'Pedro Novo' limit 1));
select public._t('Carla não foi duplicada', (select count(*) from pessoas where nome = 'Carla Souza') = 1);
select public._t('aluno ligado à pessoa já cadastrada', (select a.pessoa_id = p.id from estudos_alunos a join pessoas p on p.nome = 'Carla Souza' where a.nome = 'Carla Souza'));
select public._t('concluir os 10 marca a atividade da Jornada', (select count(*) from jornada_atividades ja join jornada_atividades_modelo m on m.id = ja.modelo_id
  join pessoas p on p.id = ja.pessoa_id where p.nome = 'Carla Souza' and m.descricao ilike '%lições%' and ja.concluida_em is not null) = 1);

-- ===== Equipe =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
select public._t('secretaria vê os alunos', (select count(*) from estudos_alunos) = 2);
select public._t('secretaria vê os estudos concluídos', (select count(*) from estudos_concluidos) = 11);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', false);
select public._t('líder vê só o aluno que acompanha (Carla)', (select count(*) from estudos_alunos) = (select count(*) from estudos_alunos a where a.nome = 'Carla Souza'));
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
select public._t('tesouraria não vê alunos', (select count(*) from estudos_alunos) = 0);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
select public._t('pastor de outra igreja não vê alunos', (select count(*) from estudos_alunos) = 0);
reset role;

\set QUIET 0
select n, case when ok then 'OK   ' else 'FALHOU' end as resultado, teste from public._resultados order by n;
select count(*) filter (where ok) as aprovados, count(*) filter (where not ok) as falhas from public._resultados;
