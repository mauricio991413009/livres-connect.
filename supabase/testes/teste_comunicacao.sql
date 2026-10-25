-- Testes da Comunicação. Rode depois de teste_oracao.sql (reaproveita os dados).
\set ON_ERROR_STOP 1
\set QUIET 1
truncate public._resultados restart identity;
select id as ig1 from public.igrejas where nome = 'Livres em Cristo' \gset
select id as jovens from public.ministerios where igreja_id = :'ig1' and nome = 'Ministério de jovens' \gset
select id as louvor from public.ministerios where igreja_id = :'ig1' and nome = 'Louvor' \gset
select id as ana from public.pessoas where nome = 'Ana Ribeiro' \gset
update pessoas set telefone = '(47) 99111-2222', ministerio_id = :'jovens' where nome = 'Davi Costa';
update pessoas set situacao = 'ativo' where nome = 'Davi Costa';
select set_config('t.ig1', :'ig1', false);
select set_config('t.louvor', :'louvor', false);
select set_config('t.ana', :'ana', false);

-- ===== Secretaria =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
insert into comunicados (igreja_id, titulo, texto, alvo) values (:'ig1', 'Santa Ceia', 'Olá, {nome}! Domingo teremos Santa Ceia.', 'membros');
select id as c1 from comunicados where titulo = 'Santa Ceia' \gset
select public._t('lista de envio traz membros com WhatsApp', (select count(*) from comunicado_destinatarios(:'c1') where nome = 'Ana Ribeiro') = 1);
select public._t('lista de envio não traz visitantes', (select count(*) from comunicado_destinatarios(:'c1') where nome = 'Bruno Lima') = 0);
select comunicado_marcar(:'c1', :'ana', true);
select public._t('marca como enviado', (select enviado_em is not null from comunicado_destinatarios(:'c1') where nome = 'Ana Ribeiro'));
select public._t('resumo conta enviados', (select enviados from comunicados_resumo(:'ig1') where id = :'c1') = 1);
select comunicado_marcar(:'c1', :'ana', false);
select public._t('desmarca o envio', (select enviados from comunicados_resumo(:'ig1') where id = :'c1') = 0);

-- ===== Obreiro que lidera o ministério de jovens =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', false);
insert into comunicados (igreja_id, titulo, texto, alvo, ministerio_id) values (:'ig1', 'Culto jovem', 'Sábado tem culto jovem!', 'ministerio', :'jovens');
select id as c2 from comunicados where titulo = 'Culto jovem' \gset
select public._t('obreiro envia para o próprio ministério', (select count(*) from comunicado_destinatarios(:'c2') where nome = 'Davi Costa') = 1);
reset role;
select public._t('ministério recebe só quem é dele', (select count(*) from comunicado_destinatarios(:'c2') d join pessoas p on p.id = d.pessoa_id
  where p.ministerio_id is distinct from :'jovens') = 0);
set role authenticated;
do $$ begin
  insert into comunicados (igreja_id, titulo, texto, alvo) values (current_setting('t.ig1')::uuid, 'X', 'Para todos', 'todos');
  perform public._t('obreiro não envia para a igreja toda', false);
exception when others then perform public._t('obreiro não envia para a igreja toda', true); end $$;
do $$ begin
  insert into comunicados (igreja_id, titulo, texto, alvo, ministerio_id) values (current_setting('t.ig1')::uuid, 'X', 'Louvor', 'ministerio', current_setting('t.louvor')::uuid);
  perform public._t('obreiro não envia para outro ministério', false);
exception when others then perform public._t('obreiro não envia para outro ministério', true); end $$;
select public._t('obreiro não vê a lista de envio dos membros', (select count(*) from comunicado_destinatarios(:'c1')) = 0);
do $$ begin
  perform comunicado_marcar((select id from comunicados where titulo = 'Santa Ceia'), current_setting('t.ana')::uuid, true);
  perform public._t('obreiro não marca envio de comunicado alheio', false);
exception when others then perform public._t('obreiro não marca envio de comunicado alheio', true); end $$;
do $$ begin
  delete from comunicados where titulo = 'Santa Ceia';
  perform public._t('obreiro não apaga comunicado alheio', (select count(*) from comunicados where titulo = 'Santa Ceia') = 1);
end $$;

-- ===== Quem não deve ver =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
select public._t('tesouraria não vê comunicados', (select count(*) from comunicados) = 0);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
select public._t('pastor de outra igreja não vê comunicados', (select count(*) from comunicados) = 0);
select public._t('pastor de outra igreja não vê a lista', (select count(*) from comunicado_destinatarios(:'c1')) = 0);
do $$ begin
  perform count(*) from public.comunicado_envios;
  perform public._t('envios só pela função', false);
exception when others then perform public._t('envios só pela função', true); end $$;
reset role;

\set QUIET 0
select n, case when ok then 'OK   ' else 'FALHOU' end as resultado, teste from public._resultados order by n;
select count(*) filter (where ok) as aprovados, count(*) filter (where not ok) as falhas from public._resultados;
