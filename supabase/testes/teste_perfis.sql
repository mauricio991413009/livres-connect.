-- Testes dos perfis pastora, obreiro, missionário e evangelista e dos novos ministérios.
-- Rode depois de teste_gestao.sql (reaproveita os dados).
\set ON_ERROR_STOP 1
\set QUIET 1
truncate public._resultados restart identity;
select id as ig1 from public.igrejas where nome = 'Livres em Cristo' \gset
select id as jovens from public.ministerios where igreja_id = :'ig1' and nome = 'Ministério de jovens' \gset
select id as louvor from public.ministerios where igreja_id = :'ig1' and nome = 'Louvor' \gset
select public._t('igreja tem os 5 novos ministérios', (select count(*) from ministerios where igreja_id = :'ig1' and nome in
  ('Grupos familiares (células)','Ministério de jovens','Ministério de casais','Ministério de homens','Ministério de mulheres')) = 5);

-- Pastor convida a pastora e um obreiro do ministério de jovens
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
insert into convites (igreja_id, email, perfil) values (:'ig1', 'pastora@igreja1.test', 'pastora');
insert into convites (igreja_id, email, perfil, ministerio_id) values (:'ig1', 'obreiro@igreja1.test', 'obreiro', :'jovens');
insert into convites (igreja_id, email, perfil) values (:'ig1', 'evangelista@igreja1.test', 'evangelista');
reset role;
insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-000000000011', 'pastora@igreja1.test', now()),
  ('00000000-0000-0000-0000-000000000012', 'obreiro@igreja1.test', now()),
  ('00000000-0000-0000-0000-000000000013', 'evangelista@igreja1.test', now());
select public._t('convites viram vínculos com os novos perfis', (select count(*) from vinculos where perfil in ('pastora','obreiro','evangelista')) = 3);
select count(*) as total_pessoas from pessoas where igreja_id = :'ig1' \gset

-- ===== Pastora =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
select public._t('pastora vê todas as pessoas', (select count(*) from pessoas) = :total_pessoas);
update pessoas set observacoes = 'visitada pela pastora' where nome = 'Bruno Lima';
select public._t('pastora edita pessoa', (select observacoes from pessoas where nome = 'Bruno Lima') = 'visitada pela pastora');
select public._t('pastora vê os relatórios financeiros', (select count(*) from lancamentos) >= 1);
do $$ begin
  insert into public.lancamentos (igreja_id, tipo, categoria_id, descricao, valor_centavos)
  select igreja_id, 'entrada', id, 'x', 100 from public.categorias_financeiras limit 1;
  perform public._t('pastora não lança no financeiro', false);
exception when others then perform public._t('pastora não lança no financeiro', true); end $$;
select public._t('pastora não vê a auditoria', (select count(*) from auditoria) = 0);
do $$ begin
  insert into public.convites (igreja_id, email, perfil) select igreja_id, 'x@y.test', 'lider' from public.pessoas limit 1;
  perform public._t('pastora não convida usuários', false);
exception when others then perform public._t('pastora não convida usuários', true); end $$;
select public._t('pastora aparece na equipe de acompanhamento', (select count(*) from public.equipe_acompanhamento(:'ig1') where perfil = 'pastora') = 1);
select public._t('obreiro e evangelista aparecem na equipe', (select count(*) from public.equipe_acompanhamento(:'ig1') where perfil in ('obreiro','evangelista')) = 2);
select id as bruno from pessoas where nome = 'Bruno Lima' \gset
update pessoas set responsavel_id = '00000000-0000-0000-0000-000000000011' where id = :'bruno';
insert into anotacoes_pastorais (igreja_id, pessoa_id, texto, autor_id) values (:'ig1', :'bruno', 'Conversa pastoral', '00000000-0000-0000-0000-000000000011');
select public._t('pastora registra anotação de quem acompanha', (select count(*) from anotacoes_pastorais where pessoa_id = :'bruno') = 1);

-- ===== Obreiro do ministério de jovens =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', false);
select public._t('obreiro sem acompanhados não vê pessoas', (select count(*) from pessoas) = 0);
select public._t('obreiro não vê financeiro', (select count(*) from lancamentos) = 0);
reset role;
update pessoas set ministerio_id = :'jovens' where nome = 'Ana Ribeiro';
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', false);
select public._t('obreiro vê quem é do seu ministério', (select count(*) from pessoas) = 1);
select id as culto from eventos where titulo = 'Culto de domingo' \gset
select id as ana from pessoas where nome = 'Ana Ribeiro' \gset
insert into escalas (igreja_id, evento_id, ministerio_id, pessoa_id) values (:'ig1', :'culto', :'jovens', :'ana');
select public._t('obreiro monta escala do seu ministério', (select count(*) from escalas where ministerio_id = :'jovens') = 1);
select public._t('obreiro recebe o link de quem escalou', (select count(token) from public.escala_do_evento(:'culto') where ministerio_id = :'jovens') = 1);
do $$ begin
  insert into public.escalas (igreja_id, evento_id, ministerio_id, pessoa_id)
  select e.igreja_id, e.id, m.id, p.id from public.eventos e, public.ministerios m, public.pessoas p
  where e.titulo = 'Culto de domingo' and m.nome = 'Louvor' and m.igreja_id = e.igreja_id and p.nome = 'Ana Ribeiro';
  perform public._t('obreiro não escala em outro ministério', false);
exception when others then perform public._t('obreiro não escala em outro ministério', true); end $$;

-- ===== Evangelista recebe visitante do QR Code =====
reset role;
update pessoas set responsavel_id = '00000000-0000-0000-0000-00000000000f' where responsavel_id is null and igreja_id = :'ig1';
do $$ declare ig uuid; begin
  select id into ig from public.igrejas where nome = 'Livres em Cristo';
  set local role anon;
  perform public.registrar_visitante(ig, 'Paula Visitante', '(47) 97777-0000', null, null, null, true);
end $$;
select public._t('visitante novo vai para quem acompanha menos pessoas',
  (select v.perfil::text from pessoas p join vinculos v on v.user_id = p.responsavel_id and v.igreja_id = p.igreja_id
   where p.nome = 'Paula Visitante' limit 1) in ('obreiro','evangelista','pastora','lider'));
select public._t('visitante não vai para o pastor quando há equipe',
  (select responsavel_id from pessoas where nome = 'Paula Visitante') <> '00000000-0000-0000-0000-00000000000b');

\set QUIET 0
select n, case when ok then 'OK   ' else 'FALHOU' end as resultado, teste from public._resultados order by n;
select count(*) filter (where ok) as aprovados, count(*) filter (where not ok) as falhas from public._resultados;
