-- Testes da fase Gestão. Rode depois de teste_pessoas.sql (reaproveita os dados).
\set ON_ERROR_STOP 1
\set QUIET 1
truncate public._resultados restart identity;
select id as ig1 from public.igrejas where nome = 'Livres em Cristo' \gset
select id as louvor from public.ministerios where igreja_id = :'ig1' and nome = 'Louvor' \gset
select id as recepcao from public.ministerios where igreja_id = :'ig1' and nome = 'Recepção' \gset
select id as davi from public.pessoas where nome = 'Davi Costa' \gset
select id as ana from public.pessoas where nome = 'Ana Ribeiro' \gset

-- ===== Pastor cria culto e escala =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
insert into eventos (igreja_id, titulo, tipo, data, hora) values (:'ig1', 'Culto de domingo', 'culto', current_date + 7, '19:00') returning id as culto \gset
insert into eventos (igreja_id, titulo, tipo, data, hora) values (:'ig1', 'Culto passado', 'culto', current_date - 7, '19:00') returning id as passado \gset
insert into escalas (igreja_id, evento_id, ministerio_id, pessoa_id) values (:'ig1', :'culto', :'louvor', :'davi');
insert into escalas (igreja_id, evento_id, ministerio_id, pessoa_id) values (:'ig1', :'culto', :'recepcao', :'ana');
insert into escalas (igreja_id, evento_id, ministerio_id, pessoa_id) values (:'ig1', :'passado', :'recepcao', :'ana');
select public._t('pastor vê a escala com nomes', (select count(*) from public.escala_do_evento(:'culto')) = 2);
select public._t('pastor recebe o link de confirmação', (select count(token) from public.escala_do_evento(:'culto')) = 2);
select public._t('pastor vê voluntários', (select count(*) from public.voluntarios(:'ig1')) >= 2);
select token as tk_davi from escalas where pessoa_id = :'davi' and evento_id = :'culto' \gset
select token as tk_passado from escalas where evento_id = :'passado' \gset

-- ===== Líder do Louvor =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', false);
select public._t('líder vê a escala inteira', (select count(*) from public.escala_do_evento(:'culto')) = 2);
select public._t('líder só recebe link do próprio ministério', (select count(token) from public.escala_do_evento(:'culto')) = 1);
do $$ begin
  insert into public.escalas (igreja_id, evento_id, ministerio_id, pessoa_id)
  select e.igreja_id, e.id, m.id, p.id from public.eventos e, public.ministerios m, public.pessoas p
  where e.titulo = 'Culto de domingo' and m.nome = 'Recepção' and m.igreja_id = e.igreja_id and p.nome = 'Davi Costa';
  perform public._t('líder não escala em outro ministério', false);
exception when others then perform public._t('líder não escala em outro ministério', true); end $$;

-- ===== Secretaria e tesouraria =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
select public._t('secretaria vê a escala sem os links', (select count(*) from public.escala_do_evento(:'culto')) = 2 and (select count(token) from public.escala_do_evento(:'culto')) = 0);
select public._t('secretaria não lista voluntários para escalar', (select count(*) from public.voluntarios(:'ig1')) = 0);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
select public._t('tesouraria não vê escalas', (select count(*) from public.escala_do_evento(:'culto')) = 0);
insert into lancamentos (igreja_id, tipo, categoria_id, descricao, valor_centavos, forma)
  select :'ig1', 'saida', id, 'Conta de luz', 35000, 'pix' from categorias_financeiras where igreja_id = :'ig1' and nome = 'Energia e água';
select public._t('tesouraria lança despesa com forma de pagamento', (select count(*) from lancamentos where forma = 'pix') = 1);
do $$ begin
  insert into public.lancamentos (igreja_id, tipo, categoria_id, descricao, valor_centavos, forma)
  select igreja_id, 'saida', id, 'x', 100, 'cheque' from public.categorias_financeiras limit 1;
  perform public._t('forma de pagamento inválida é recusada', false);
exception when others then perform public._t('forma de pagamento inválida é recusada', true); end $$;
reset role;

-- ===== Voluntário pelo link (sem login) =====
set role anon;
select public._t('link mostra a escala', (select ministerio from public.escala_publica(:'tk_davi')) = 'Louvor');
select public._t('link mostra só o primeiro nome', (select pessoa from public.escala_publica(:'tk_davi')) = 'Davi');
select public.responder_escala(:'tk_davi', 'confirmado');
do $$ begin
  perform public.responder_escala('00000000-0000-0000-0000-000000000000', 'confirmado');
  perform public._t('link inexistente é recusado', false);
exception when others then perform public._t('link inexistente é recusado', true); end $$;
reset role;
do $$ declare t uuid; begin
  select s.token into t from public.escalas s join public.eventos e on e.id = s.evento_id where e.titulo = 'Culto passado';
  set local role anon;
  begin
    perform public.responder_escala(t, 'confirmado');
    perform public._t('culto que já passou não aceita resposta', false);
  exception when others then perform public._t('culto que já passou não aceita resposta', sqlerrm like '%já passou%'); end;
  begin
    perform public.responder_escala(t, 'qualquer');
    perform public._t('resposta inválida é recusada', false);
  exception when others then perform public._t('resposta inválida é recusada', true); end;
  begin
    perform count(*) from public.escalas;
    perform public._t('anônimo não lê a tabela de escalas', false);
  exception when others then perform public._t('anônimo não lê a tabela de escalas', true); end;
end $$;
reset role;
select public._t('confirmação foi gravada', (select status = 'confirmado' and respondido_em is not null from escalas where token = :'tk_davi'));

\set QUIET 0
select n, case when ok then 'OK   ' else 'FALHOU' end as resultado, teste from public._resultados order by n;
select count(*) filter (where ok) as aprovados, count(*) filter (where not ok) as falhas from public._resultados;
