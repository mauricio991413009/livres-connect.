-- Testes da Escola de Obreiros. Rode depois de teste_estudos.sql (reaproveita os dados).
\set ON_ERROR_STOP 1
\set QUIET 1
truncate public._resultados restart identity;
select id as ig1 from public.igrejas where nome = 'Livres em Cristo' \gset
select id as ana from public.pessoas where nome = 'Ana Ribeiro' \gset
select id as davi from public.pessoas where nome = 'Davi Costa' \gset
select id as bruno from public.pessoas where nome = 'Bruno Lima' \gset

-- ===== Secretaria cria a turma (professor: obreiro) e matricula =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
insert into escola_turmas (igreja_id, nome, inicio, professor_id)
  values (:'ig1', 'Turma 2026', '2026-08-01', '00000000-0000-0000-0000-000000000012');
insert into escola_turmas (igreja_id, nome) values (:'ig1', 'Turma B');
select id as t1 from escola_turmas where nome = 'Turma 2026' \gset
select id as t2 from escola_turmas where nome = 'Turma B' \gset
insert into escola_alunos (igreja_id, turma_id, pessoa_id) values (:'ig1', :'t1', :'ana'), (:'ig1', :'t1', :'davi');
insert into escola_alunos (igreja_id, turma_id, pessoa_id) values (:'ig1', :'t2', :'bruno');
select public._t('secretaria vê as turmas', (select count(*) from escola_turmas) = 2);
select public._t('secretaria vê os alunos com nome', (select count(*) from escola_alunos_da_turma(:'t1') where nome = 'Ana Ribeiro') = 1);
do $$ begin
  insert into escola_alunos (igreja_id, turma_id, pessoa_id)
  select igreja_id, turma_id, pessoa_id from escola_alunos limit 1;
  perform public._t('não matricula a mesma pessoa duas vezes na turma', false);
exception when others then perform public._t('não matricula a mesma pessoa duas vezes na turma', true); end $$;
reset role;
select public._t('matrícula marca a atividade da Jornada', (select count(*) from jornada_atividades ja join jornada_atividades_modelo m on m.id = ja.modelo_id
  where ja.pessoa_id = :'ana' and m.descricao ilike '%matrícula na escola%' and ja.concluida_em is not null) = 1);

select set_config('t.carla', (select id::text from pessoas where nome = 'Carla Souza'), false);
select set_config('t.aluno_bruno', (select id::text from escola_alunos where pessoa_id = :'bruno'), false);
select set_config('t.turma1', :'t1', false);

-- ===== Tesouraria e outras igrejas =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
select public._t('tesouraria não vê turmas', (select count(*) from escola_turmas) = 0);
do $$ begin
  insert into escola_turmas (igreja_id, nome) select id, 'Invasão' from igrejas limit 1;
  perform public._t('tesouraria não cria turma', false);
exception when others then perform public._t('tesouraria não cria turma', true); end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
select public._t('pastor de outra igreja não vê turmas', (select count(*) from escola_turmas) = 0);
select public._t('pastor de outra igreja não vê alunos pela função', (select count(*) from escola_alunos_da_turma(:'t1')) = 0);

-- ===== Líder que não é professor =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', false);
select public._t('líder que não é professor não vê turmas', (select count(*) from escola_turmas) = 0);

-- ===== Professor (obreiro) =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', false);
select public._t('professor vê só a turma dele', (select count(*) from escola_turmas) = 1);
select public._t('professor vê os alunos com nome', (select count(*) from escola_alunos_da_turma(:'t1')) = 2);
insert into escola_aulas (igreja_id, turma_id, data, tema) values (:'ig1', :'t1', '2026-08-02', 'Chamado e caráter do obreiro');
insert into escola_aulas (igreja_id, turma_id, data, tema) values (:'ig1', :'t1', '2026-08-09', 'Vida de oração');
insert into escola_presencas (igreja_id, aula_id, aluno_id, presente)
  select :'ig1', au.id, al.id, true from escola_aulas au cross join escola_alunos al where al.turma_id = :'t1';
select public._t('professor faz a chamada', (select count(*) from escola_presencas) = 4);
insert into escola_avaliacoes (igreja_id, turma_id, titulo, peso) values (:'ig1', :'t1', 'Prova final', 2);
insert into escola_notas (igreja_id, avaliacao_id, aluno_id, nota)
  select :'ig1', av.id, al.id, 8.5 from escola_avaliacoes av cross join escola_alunos al where al.turma_id = :'t1';
select public._t('professor lança notas', (select count(*) from escola_notas) = 2);
do $$ begin
  insert into escola_alunos (igreja_id, turma_id, pessoa_id)
  select t.igreja_id, t.id, current_setting('t.carla')::uuid from escola_turmas t where t.id = current_setting('t.turma1')::uuid;
  perform public._t('professor não matricula alunos', false);
exception when others then perform public._t('professor não matricula alunos', true); end $$;
do $$ begin
  update escola_turmas set nome = 'Outra' where true;
  perform public._t('professor não altera a turma', (select count(*) from escola_turmas where nome = 'Outra') = 0);
end $$;
update escola_alunos set situacao = 'aprovado' where pessoa_id = :'ana';
select public._t('aprovar registra a data de conclusão', (select concluido_em = current_date from escola_alunos where pessoa_id = :'ana'));
select public._t('certificado aparece só para aprovado', (select count(*) from escola_alunos_da_turma(:'t1') where certificado is not null) = 1);
do $$ begin
  update escola_alunos set turma_id = (select id from escola_turmas where nome = 'Turma 2026') where false;
  update escola_alunos set certificado = gen_random_uuid() where situacao = 'aprovado';
  perform public._t('não troca o código do certificado', false);
exception when others then perform public._t('não troca o código do certificado', sqlerrm like '%matrícula%'); end $$;
reset role;

-- Professor tenta registrar presença de aluno de outra turma
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', false);
do $$ begin
  insert into escola_presencas (igreja_id, aula_id, aluno_id, presente)
  select au.igreja_id, au.id, current_setting('t.aluno_bruno')::uuid, true from escola_aulas au limit 1;
  perform public._t('professor não marca presença de aluno de outra turma', false);
exception when others then perform public._t('professor não marca presença de aluno de outra turma', true); end $$;
reset role;
select public._t('aprovação marca a avaliação final na Jornada', (select count(*) from jornada_atividades ja join jornada_atividades_modelo m on m.id = ja.modelo_id
  where ja.pessoa_id = :'ana' and m.descricao ilike '%avaliação final%' and ja.concluida_em is not null) = 1);

-- ===== Certificado público =====
select certificado as cert_ana from escola_alunos where pessoa_id = :'ana' \gset
select certificado as cert_davi from escola_alunos where pessoa_id = :'davi' \gset
set role anon;
select public._t('certificado confere pelo código', (select nome from certificado_publico(:'cert_ana')) = 'Ana Ribeiro');
select public._t('certificado conta as aulas', (select aulas from certificado_publico(:'cert_ana')) = 2);
select public._t('aluno cursando não tem certificado', (select count(*) from certificado_publico(:'cert_davi')) = 0);
do $$ begin
  perform count(*) from public.escola_turmas;
  perform public._t('anônimo não lê turmas', false);
exception when others then perform public._t('anônimo não lê turmas', true); end $$;
reset role;

-- ===== Pastora administra a Escola =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
select public._t('pastora vê as turmas', (select count(*) from escola_turmas) = 2);
update escola_turmas set horario = 'Sábados, 9h' where nome = 'Turma B';
select public._t('pastora edita turma', (select horario from escola_turmas where nome = 'Turma B') = 'Sábados, 9h');
do $$ begin
  delete from escola_turmas where nome = 'Turma B';
  perform public._t('só o pastor exclui turma', (select count(*) from escola_turmas where nome = 'Turma B') = 1);
end $$;
reset role;

\set QUIET 0
select n, case when ok then 'OK   ' else 'FALHOU' end as resultado, teste from public._resultados order by n;
select count(*) filter (where ok) as aprovados, count(*) filter (where not ok) as falhas from public._resultados;
