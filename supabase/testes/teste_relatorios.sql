-- Testes dos relatórios. Rode depois de teste_portal.sql (reaproveita os dados).
\set ON_ERROR_STOP 1
\set QUIET 1
truncate public._resultados restart identity;
select id as ig1 from public.igrejas where nome = 'Livres em Cristo' \gset
select set_config('t.ig1', :'ig1', false);
select count(*) as visit_mes from pessoas where igreja_id = :'ig1' and primeira_visita between date_trunc('month', current_date)::date and current_date \gset
select coalesce(sum(valor_centavos), 0) as entradas_mes from lancamentos where igreja_id = :'ig1' and tipo = 'entrada'
  and (pago_em is not null or vencimento is null) and data between date_trunc('month', current_date)::date and current_date \gset

-- ===== Pastor =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
select relatorio_pastoral(:'ig1', date_trunc('month', current_date)::date, current_date) as rp \gset
select public._t('pastoral conta os visitantes do mês', ((:'rp'::jsonb)->'pessoas'->>'visitantes')::int = :visit_mes);
select public._t('pastoral traz as 7 etapas', jsonb_array_length((:'rp'::jsonb)->'pessoas'->'etapas') = 7);
select public._t('pastoral traz discipulado e escola', (:'rp'::jsonb) ? 'discipulado' and (:'rp'::jsonb) ? 'escola' and (:'rp'::jsonb) ? 'cuidado');
select public._t('pastoral só tem números (sem nomes)', not ((:'rp'::jsonb)::text like '%Ana Ribeiro%'));
select relatorio_financeiro(:'ig1', date_trunc('month', current_date)::date, current_date) as rf \gset
select public._t('financeiro soma as entradas do mês', ((:'rf'::jsonb)->>'entradas')::bigint = :entradas_mes);
select public._t('série tem 12 meses', jsonb_array_length(relatorio_serie(:'ig1', extract(year from current_date)::int)) = 12);
select public._t('engajamento traz as listas', relatorio_engajamento(:'ig1') ?& array['sem_contato','nunca_serviram','por_ministerio','novos_sem_discipulado']);
do $$ begin
  perform relatorio_pastoral(current_setting('t.ig1')::uuid, current_date, current_date - 1);
  perform public._t('período invertido é recusado', false);
exception when others then perform public._t('período invertido é recusado', sqlerrm like '%inválido%'); end $$;

-- ===== Tesouraria: só o financeiro =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
select public._t('tesouraria vê o financeiro', (relatorio_financeiro(:'ig1', current_date - 30, current_date)) ? 'entradas');
select public._t('na série, tesouraria não recebe números pastorais', (relatorio_serie(:'ig1', extract(year from current_date)::int)->0->>'visitantes') is null
  and (relatorio_serie(:'ig1', extract(year from current_date)::int)->0->>'entradas') is not null);
do $$ begin
  perform relatorio_pastoral(current_setting('t.ig1')::uuid, current_date - 30, current_date);
  perform public._t('tesouraria não vê o pastoral', false);
exception when others then perform public._t('tesouraria não vê o pastoral', true); end $$;
do $$ begin
  perform relatorio_engajamento(current_setting('t.ig1')::uuid);
  perform public._t('tesouraria não vê o engajamento', false);
exception when others then perform public._t('tesouraria não vê o engajamento', true); end $$;

-- ===== Secretaria: pastoral sim, financeiro não =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
select public._t('secretaria vê o pastoral', (relatorio_pastoral(:'ig1', current_date - 30, current_date)) ? 'pessoas');
do $$ begin
  perform relatorio_financeiro(current_setting('t.ig1')::uuid, current_date - 30, current_date);
  perform public._t('secretaria não vê o financeiro', false);
exception when others then perform public._t('secretaria não vê o financeiro', true); end $$;
select public._t('na série, secretaria não recebe valores', (relatorio_serie(:'ig1', extract(year from current_date)::int)->0->>'entradas') is null);

-- ===== Pastora: pastoral e engajamento; líder e outra igreja: nada =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
select public._t('pastora vê o engajamento', (relatorio_engajamento(:'ig1')) ? 'sem_contato');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', false);
do $$ begin
  perform relatorio_serie(current_setting('t.ig1')::uuid, 2026);
  perform public._t('líder não vê relatórios', false);
exception when others then perform public._t('líder não vê relatórios', true); end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
do $$ begin
  perform relatorio_pastoral(current_setting('t.ig1')::uuid, current_date - 30, current_date);
  perform public._t('pastor de outra igreja não vê', false);
exception when others then perform public._t('pastor de outra igreja não vê', true); end $$;
reset role;
set role anon;
do $$ begin
  perform relatorio_pastoral(current_setting('t.ig1')::uuid, current_date - 30, current_date);
  perform public._t('anônimo não vê', false);
exception when others then perform public._t('anônimo não vê', true); end $$;
reset role;

\set QUIET 0
select n, case when ok then 'OK   ' else 'FALHOU' end as resultado, teste from public._resultados order by n;
select count(*) filter (where ok) as aprovados, count(*) filter (where not ok) as falhas from public._resultados;
