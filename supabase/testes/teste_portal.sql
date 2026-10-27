-- Testes do Portal do Membro. Rode depois de teste_comunicacao.sql (reaproveita os dados).
\set ON_ERROR_STOP 1
\set QUIET 1
truncate public._resultados restart identity;
select id as ig1 from public.igrejas where nome = 'Livres em Cristo' \gset
select id as ana from public.pessoas where nome = 'Ana Ribeiro' \gset
select id as bruno from public.pessoas where nome = 'Bruno Lima' \gset
select set_config('t.ana', :'ana', false);

-- ===== Secretaria gera o link da Ana (que é discipuladora e fez a Escola) =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
select portal_gerar_link(:'ana') as tok \gset
select public._t('link tem 64 caracteres', length(:'tok') = 64);
select public._t('situação do link aparece para a equipe', (select count(*) from portal_situacao(:'ig1') where pessoa_id = :'ana') = 1);
do $$ begin
  perform count(*) from public.portal_acessos;
  perform public._t('equipe não lê a tabela de acessos', false);
exception when others then perform public._t('equipe não lê a tabela de acessos', true); end $$;
-- Discípulo ativo para a Ana acompanhar pelo portal
insert into pessoas (igreja_id, nome, etapa) values (:'ig1', 'Lucas Portal', 1);
insert into discipulados (igreja_id, discipulo_id, discipulador_id)
  select :'ig1', id, :'ana' from pessoas where nome = 'Lucas Portal';
select id as disc from discipulados where discipulo_id = (select id from pessoas where nome = 'Lucas Portal') \gset

-- ===== Tesouraria e líder sem acesso à pessoa =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
do $$ begin
  perform portal_gerar_link((select id from pessoas limit 1));
  perform public._t('tesouraria não gera link', false);
exception when others then perform public._t('tesouraria não gera link', true); end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
do $$ begin
  perform portal_gerar_link(current_setting('t.ana')::uuid);
  perform public._t('pastor de outra igreja não gera link', false);
exception when others then perform public._t('pastor de outra igreja não gera link', true); end $$;
reset role;
select public._t('banco guarda só a impressão digital do código', (select token_hash <> convert_to(:'tok', 'UTF8') and length(token_hash) = 32 from portal_acessos where pessoa_id = :'ana'));

insert into comunicados (igreja_id, titulo, texto, alvo) values (:'ig1', 'Só visitantes', 'Bem-vindo!', 'visitantes');
-- ===== Ana usa o portal (anônimo, só com o link) =====
select set_config('t.tok', :'tok', false);
select set_config('t.disc', :'disc', false);
set role anon;
select portal_dados(:'tok') as dados \gset
select public._t('portal mostra o nome', (:'dados'::jsonb)->'pessoa'->>'nome' = 'Ana Ribeiro');
select public._t('portal mostra a igreja', (:'dados'::jsonb)->'igreja'->>'nome' = 'Livres em Cristo');
select public._t('portal mostra a Escola com certificado', ((:'dados'::jsonb)->'escola'->0->>'certificado') is not null and ((:'dados'::jsonb)->'escola'->0->>'frequencia')::int = 100);
select public._t('portal mostra o comunicado para membros', (:'dados'::jsonb)->'avisos' @> '[{"titulo":"Santa Ceia"}]');
select public._t('portal não mostra comunicado de outro público', not ((:'dados'::jsonb)->'avisos' @> '[{"titulo":"Só visitantes"}]'));
select public._t('portal lista os discípulos da Ana', jsonb_array_length((:'dados'::jsonb)->'discipulos') = 1);
select public._t('mural não mostra pedido confidencial', not (((:'dados'::jsonb)->'mural')::text like '%Assunto muito pessoal%'));
select public._t('meus pedidos inclui o confidencial da própria Ana', (:'dados'::jsonb)->'meus_pedidos' @> '[{"pedido":"Assunto muito pessoal"}]');
do $$ declare t text := current_setting('t.tok'); n int; m uuid; begin
  perform portal_pedir_oracao(t, 'Pela minha família', true, true);
  perform portal_pedir_atendimento(t, 'aconselhamento', 'Quero conversar', 'sábado');
  perform portal_registrar_encontro(t, current_setting('t.disc')::uuid, current_date, 1::smallint, 'Primeiro encontro');
  perform portal_atualizar(t, '(47) 99999-4321', 'ana@exemplo.com', 'Rua A, 10', date '1990-05-01', null);
  select (x->>'id')::uuid into m from jsonb_array_elements(portal_dados(t)->'mural') x where x->>'pedido' = 'Pela minha família';
  n := portal_orei(t, m); n := portal_orei(t, m);
  perform public._t('orar duas vezes conta uma', n = 1);
  begin
    perform portal_registrar_encontro(t, current_setting('t.disc')::uuid, current_date + 3, 2::smallint, null);
    perform public._t('encontro no futuro é recusado', false);
  exception when others then perform public._t('encontro no futuro é recusado', true); end;
  begin
    perform portal_dados(repeat('a', 64));
    perform public._t('link inventado não entra', false);
  exception when others then perform public._t('link inventado não entra', sqlerrm like '%não vale mais%'); end;
  begin
    perform count(*) from public.pessoas;
    perform public._t('portal não dá acesso às tabelas', false);
  exception when others then perform public._t('portal não dá acesso às tabelas', true); end;
end $$;
reset role;
select public._t('pedido do portal entra com o nome da Ana', (select count(*) from pedidos_oracao where origem = 'portal' and pessoa_id = :'ana') = 1);
select public._t('atendimento do portal entra', (select count(*) from atendimentos where origem = 'portal' and pessoa_id = :'ana') = 1);
select public._t('encontro registrado pelo portal', (select count(*) from discipulado_encontros where discipulado_id = :'disc' and via_portal) = 1);
select public._t('dados atualizados', (select email from pessoas where id = :'ana') = 'ana@exemplo.com');
select public._t('último acesso registrado', (select ultimo_acesso is not null from portal_acessos where pessoa_id = :'ana'));

-- ===== Link novo invalida o antigo; revogar tira o acesso =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
select portal_gerar_link(:'ana') as tok2 \gset
reset role;
set role anon;
do $$ begin
  perform portal_dados(current_setting('t.tok'));
  perform public._t('link antigo deixa de valer', false);
exception when others then perform public._t('link antigo deixa de valer', true); end $$;
select public._t('link novo funciona', (portal_dados(:'tok2'))->'pessoa'->>'nome' = 'Ana Ribeiro');
reset role;
-- Foto da carteirinha
update public.pessoas set foto_mini = 'data:image/jpeg;base64,AAAA' where id = :'ana';
set role anon;
select public._t('portal entrega a foto a quem tem o link', portal_foto(:'tok2') = 'data:image/jpeg;base64,AAAA');
do $$ begin
  perform portal_foto(repeat('b', 64));
  perform public._t('portal_foto recusa link inválido', false);
exception when others then perform public._t('portal_foto recusa link inválido', true); end $$;
reset role;
do $$ begin
  update public.pessoas set foto_mini = 'javascript:alert(1)' where id = current_setting('t.ana')::uuid;
  perform public._t('foto_mini só aceita JPEG em data URL', false);
exception when check_violation then perform public._t('foto_mini só aceita JPEG em data URL', true); end $$;
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
select portal_revogar(:'ana');
reset role;
set role anon;
select set_config('t.tok2', :'tok2', false);
do $$ begin
  perform portal_dados(current_setting('t.tok2'));
  perform public._t('revogar tira o acesso', false);
exception when others then perform public._t('revogar tira o acesso', true); end $$;
reset role;

\set QUIET 0
select n, case when ok then 'OK   ' else 'FALHOU' end as resultado, teste from public._resultados order by n;
select count(*) filter (where ok) as aprovados, count(*) filter (where not ok) as falhas from public._resultados;
