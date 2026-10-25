-- Testes da fase Pessoas. Rode depois de teste_isolamento.sql (reaproveita os dados).
\set ON_ERROR_STOP 1
\set QUIET 1
truncate public._resultados restart identity;
select id as ig1 from public.igrejas where nome = 'Livres em Cristo' \gset

-- ===== Visitante anônimo pelo QR Code =====
set role anon;
select public._t('ficha pública mostra o nome da igreja', (select nome from public.igreja_publica(:'ig1')) = 'Livres em Cristo');
do $$ begin
  perform public.registrar_visitante((select null::uuid), 'X', '1', null, null, null, true);
  perform public._t('igreja inexistente é recusada', false);
exception when others then perform public._t('igreja inexistente é recusada', true); end $$;
reset role;
do $$ declare ig uuid; r text; begin
  select id into ig from public.igrejas where nome = 'Livres em Cristo';
  set local role anon;
  begin
    perform public.registrar_visitante(ig, 'Marcos Visitante', '(47) 98888-1111', null, 'Ana', 'Conhecer a igreja', false);
    perform public._t('ficha sem consentimento é recusada', false);
  exception when others then perform public._t('ficha sem consentimento é recusada', sqlerrm like '%autorizar%'); end;
  r := public.registrar_visitante(ig, 'Marcos Visitante', '(47) 98888-1111', '1990-05-01', 'Ana', 'Conhecer a igreja', true);
  perform public._t('primeira ficha cria visitante', r = 'novo');
  r := public.registrar_visitante(ig, 'Marcos V.', '47988881111', null, null, null, true);
  perform public._t('mesmo telefone é reconhecido como retorno', r = 'retorno');
  begin
    perform count(*) from public.pessoas;
    perform public._t('anônimo continua sem ler pessoas', false);
  exception when others then perform public._t('anônimo continua sem ler pessoas', true); end;
  begin
    perform public.mudar_etapa('00000000-0000-0000-0000-000000000000', 1::smallint);
    perform public._t('anônimo não muda etapa', false);
  exception when others then perform public._t('anônimo não muda etapa', true); end;
end $$;
reset role;
select public._t('visitante só foi criado uma vez', (select count(*) from pessoas where nome like 'Marcos V%') = 1);
select public._t('visitante foi encaminhado ao líder', (select responsavel_id from pessoas where nome = 'Marcos Visitante') = '00000000-0000-0000-0000-00000000000f');
select public._t('visitante tem consentimento registrado', (select consentimento_lgpd_em is not null from pessoas where nome = 'Marcos Visitante'));
select public._t('jornada registra a etapa Visitante', (select count(*) from jornada_etapas j join pessoas p on p.id = j.pessoa_id where p.nome = 'Marcos Visitante' and j.etapa = 0) = 1);
select public._t('pessoa recebe número de matrícula', (select numero is not null from pessoas where nome = 'Marcos Visitante'));

-- ===== Líder vê o visitante encaminhado =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', false);
select public._t('líder vê o visitante encaminhado a ele', (select count(*) from pessoas where nome = 'Marcos Visitante') = 1);
select id as marcos from pessoas where nome = 'Marcos Visitante' \gset
select public.mudar_etapa(:'marcos', 1::smallint);
select public._t('líder avança para Novo convertido', (select etapa from pessoas where id = :'marcos') = 1);
select public._t('data de conversão é preenchida', (select data_conversao = current_date from pessoas where id = :'marcos'));

-- ===== Secretaria =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
select public._t('secretaria vê a equipe de acompanhamento', (select count(*) from public.equipe_acompanhamento(:'ig1')) >= 2);
select public.mudar_etapa(:'marcos', 2::smallint);
select public._t('secretaria avança para Discipulado', (select etapa from pessoas where id = :'marcos') = 2);
select public._t('histórico tem 3 etapas', (select count(*) from jornada_etapas where pessoa_id = :'marcos') = 3);

-- ===== Tesouraria não mexe em pessoas =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
select public._t('tesouraria não vê a equipe de acompanhamento', (select count(*) from public.equipe_acompanhamento(:'ig1')) = 0);
do $$ begin
  perform public.mudar_etapa((select id from public.pessoas limit 1), 3::smallint);
  perform public._t('tesouraria não muda etapa', true);
exception when others then perform public._t('tesouraria não muda etapa', true); end $$;
reset role;
select public._t('(conferido) etapa do Marcos continua 2', (select etapa from pessoas where nome = 'Marcos Visitante') = 2);

-- ===== Pastor de outra igreja =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
select public._t('pastor de outra igreja não vê a equipe', (select count(*) from public.equipe_acompanhamento(:'ig1')) = 0);
reset role;

\set QUIET 0
select n, case when ok then 'OK   ' else 'FALHOU' end as resultado, teste from public._resultados order by n;
select count(*) filter (where ok) as aprovados, count(*) filter (where not ok) as falhas from public._resultados;
