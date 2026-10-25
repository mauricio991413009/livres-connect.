-- Testes do Discipulado. Rode depois de teste_escola.sql (reaproveita os dados).
\set ON_ERROR_STOP 1
\set QUIET 1
truncate public._resultados restart identity;
select id as ig1 from public.igrejas where nome = 'Livres em Cristo' \gset
select id as ana from public.pessoas where nome = 'Ana Ribeiro' \gset
-- Discípula de teste: novo convertido acompanhado pelo líder (f)
insert into pessoas (igreja_id, nome, etapa, responsavel_id) values (:'ig1', 'Júlia Nova', 1, '00000000-0000-0000-0000-00000000000f');
select id as julia from public.pessoas where nome = 'Júlia Nova' \gset
select set_config('t.julia', :'julia', false);
select set_config('t.ana', :'ana', false);

-- ===== Secretaria começa o discipulado =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
select public._t('secretaria vê possíveis discipuladores (membros)', (select count(*) from discipuladores_possiveis(:'ig1') where nome = 'Ana Ribeiro') = 1);
insert into discipulados (igreja_id, discipulo_id, discipulador_id) values (:'ig1', :'julia', :'ana');
select public._t('discipulado criado', (select count(*) from discipulados) = 1);
do $$ begin
  insert into discipulados (igreja_id, discipulo_id, discipulador_id)
  select igreja_id, current_setting('t.julia')::uuid, current_setting('t.ana')::uuid from pessoas where id = current_setting('t.ana')::uuid;
  perform public._t('não abre dois discipulados ativos para a mesma pessoa', false);
exception when others then perform public._t('não abre dois discipulados ativos para a mesma pessoa', true); end $$;
do $$ begin
  insert into discipulados (igreja_id, discipulo_id, discipulador_id)
  select igreja_id, id, id from pessoas where id = current_setting('t.ana')::uuid;
  perform public._t('pessoa não discipula a si mesma', false);
exception when others then perform public._t('pessoa não discipula a si mesma', true); end $$;
reset role;
select public._t('novo convertido vai para a etapa Discipulado', (select etapa from pessoas where id = :'julia') = 2);
select public._t('etapa registrada no histórico', (select count(*) from jornada_etapas where pessoa_id = :'julia' and etapa = 2) = 1);
select public._t('inscrição no discipulado marcada', (select count(*) from jornada_atividades ja join jornada_atividades_modelo m on m.id = ja.modelo_id
  where ja.pessoa_id = :'julia' and m.descricao ilike '%inscrição no discipulado%') = 1);
select public._t('discipulador ganha "discipulando outra pessoa"', (select count(*) from jornada_atividades ja join jornada_atividades_modelo m on m.id = ja.modelo_id
  where ja.pessoa_id = :'ana' and m.descricao ilike '%discipulando outra pessoa%') = 1);
select id as disc from discipulados where discipulo_id = :'julia' \gset
select set_config('t.disc', :'disc', false);

-- ===== Líder responsável pela discípula registra os encontros =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', false);
select public._t('líder vê o discipulado de quem acompanha', (select count(*) from discipulados) = 1);
select public._t('lista traz o nome do discipulador', (select discipulador from discipulados_lista(:'ig1')) = 'Ana Ribeiro');
insert into discipulado_encontros (igreja_id, discipulado_id, licao, resumo)
  select :'ig1', :'disc', n, 'Encontro ' || n from generate_series(1, 7) n;
reset role;
select public._t('7 lições ainda não marcam a atividade', (select count(*) from jornada_atividades ja join jornada_atividades_modelo m on m.id = ja.modelo_id
  where ja.pessoa_id = :'julia' and m.descricao ilike '%lições do discipulado%') = 0);
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', false);
insert into discipulado_encontros (igreja_id, discipulado_id, licao) values (:'ig1', :'disc', 8);
select public._t('lista mostra as 8 lições', (select array_length(licoes, 1) from discipulados_lista(:'ig1')) = 8);
update discipulados set status = 'concluido' where id = :'disc';
select public._t('concluir registra a data', (select concluido_em = current_date from discipulados where id = :'disc'));
reset role;
select public._t('8 lições marcam a atividade da Jornada', (select count(*) from jornada_atividades ja join jornada_atividades_modelo m on m.id = ja.modelo_id
  where ja.pessoa_id = :'julia' and m.descricao ilike '%lições do discipulado%' and ja.concluida_em is not null) = 1);

-- ===== Quem não deve ver =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', false);
select public._t('obreiro que não acompanha não vê', (select count(*) from discipulados) = 0);
select public._t('obreiro não vê pela lista', (select count(*) from discipulados_lista(:'ig1')) = 0);
do $$ begin
  insert into discipulado_encontros (igreja_id, discipulado_id, licao)
  select igreja_id, id, 1 from pessoas where id = current_setting('t.julia')::uuid and false;
  insert into discipulado_encontros (igreja_id, discipulado_id, licao)
  values ((select igreja_id from igrejas limit 1), current_setting('t.disc')::uuid, 1);
  perform public._t('obreiro não registra encontro', false);
exception when others then perform public._t('obreiro não registra encontro', true); end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
select public._t('tesouraria não vê discipulados', (select count(*) from discipulados) = 0);
select public._t('tesouraria não lista discipuladores', (select count(*) from discipuladores_possiveis(:'ig1')) = 0);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
select public._t('pastor de outra igreja não vê', (select count(*) from discipulados_lista(:'ig1')) = 0);
reset role;
set role anon;
do $$ begin
  perform count(*) from public.discipulados;
  perform public._t('anônimo não lê discipulados', false);
exception when others then perform public._t('anônimo não lê discipulados', true); end $$;
reset role;

\set QUIET 0
select n, case when ok then 'OK   ' else 'FALHOU' end as resultado, teste from public._resultados order by n;
select count(*) filter (where ok) as aprovados, count(*) filter (where not ok) as falhas from public._resultados;
