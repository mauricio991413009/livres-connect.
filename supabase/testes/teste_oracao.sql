-- Testes dos pedidos de oração e atendimento pastoral. Rode depois de teste_discipulado.sql.
\set ON_ERROR_STOP 1
\set QUIET 1
truncate public._resultados restart identity;
select id as ig1 from public.igrejas where nome = 'Livres em Cristo' \gset
update pessoas set telefone = '(47) 99999-4321' where nome = 'Ana Ribeiro';

-- ===== Visitante pela página pública =====
select set_config('t.ig1', :'ig1', false);
set role anon;
do $$ declare ig uuid := current_setting('t.ig1')::uuid; begin
  begin
    perform public.registrar_pedido_oracao(ig, 'Maria', null, 'Pela saúde da minha mãe', true, true, false);
    perform public._t('pedido sem consentimento é recusado', false);
  exception when others then perform public._t('pedido sem consentimento é recusado', sqlerrm like '%autorizar%'); end;
  perform public.registrar_pedido_oracao(ig, 'Maria Visitante', null, 'Pela saúde da minha mãe', true, true, true);
  perform public.registrar_pedido_oracao(ig, 'Ana Ribeiro', '47 99999-4321', 'Assunto muito pessoal', false, true, true);
  perform public.solicitar_atendimento(ig, 'Roberto', '(47) 98765-0000', 'familia', 'Preciso conversar sobre meu casamento', 'à noite', true);
  begin
    perform public.solicitar_atendimento(ig, 'Sem Telefone', '', 'familia', 'x', null, true);
    perform public._t('atendimento exige WhatsApp', false);
  exception when others then perform public._t('atendimento exige WhatsApp', sqlerrm like '%WhatsApp%'); end;
  begin
    perform count(*) from public.pedidos_oracao;
    perform public._t('anônimo não lê pedidos', false);
  exception when others then perform public._t('anônimo não lê pedidos', true); end;
end $$;
reset role;
select public._t('pedido confidencial não vai para o mural', (select mural from pedidos_oracao where pedido = 'Assunto muito pessoal') = false);
select public._t('pedido ligado à pessoa pelo WhatsApp', (select p.nome from pedidos_oracao o join pessoas p on p.id = o.pessoa_id where o.pedido = 'Assunto muito pessoal') = 'Ana Ribeiro');
select public._t('auditoria não guarda o texto do pedido', (select count(*) from auditoria where tabela = 'pedidos_oracao' and (depois ? 'pedido' or depois ? 'telefone')) = 0
  and (select count(*) from auditoria where tabela = 'pedidos_oracao') >= 2);
select public._t('auditoria não guarda a mensagem do atendimento', (select count(*) from auditoria where tabela = 'atendimentos' and depois ? 'mensagem') = 0);
select id as at1 from atendimentos where nome = 'Roberto' \gset

-- ===== Pastor =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
select public._t('pastor vê todos os pedidos', (select count(*) from pedidos_oracao) = 2);
select public._t('pastor vê o atendimento', (select count(*) from atendimentos) = 1);
update atendimentos set status = 'agendado', agendado_para = now() + interval '2 days', atendente_id = '00000000-0000-0000-0000-000000000012' where id = :'at1';

-- ===== Líder (equipe de intercessão) =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', false);
select public._t('líder vê só o pedido compartilhado', (select count(*) from pedidos_oracao) = 1);
select public._t('líder ora pelo pedido', public.orar_por((select id from pedidos_oracao limit 1)) = 1);
update pedidos_oracao set status = 'respondido', testemunho = 'A mãe recebeu alta!' where true;
select public._t('líder marca como respondido', (select status from pedidos_oracao limit 1) = 'respondido');
do $$ begin
  update public.pedidos_oracao set mural = false, compartilhar = false where true;
  perform public._t('líder não muda a privacidade', false);
exception when others then perform public._t('líder não muda a privacidade', sqlerrm like '%pastores%'); end $$;
select public._t('líder não vê atendimentos', (select count(*) from atendimentos) = 0);

-- ===== Tesouraria e outras igrejas =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
select public._t('tesouraria não vê pedidos', (select count(*) from pedidos_oracao) = 0);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
select public._t('pastor de outra igreja não vê pedidos', (select count(*) from pedidos_oracao) = 0);
select public._t('pastor de outra igreja não vê atendimentos', (select count(*) from atendimentos) = 0);

-- ===== Pastora vê tudo; obreiro designado vê só o seu atendimento =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', false);
select public._t('pastora vê o pedido confidencial', (select count(*) from pedidos_oracao where not compartilhar) = 1);
select public._t('pastora vê o atendimento', (select count(*) from atendimentos) = 1);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', false);
select public._t('atendente designado vê o atendimento', (select count(*) from atendimentos) = 1);
update atendimentos set status = 'realizado' where id = :'at1';
select public._t('atendente marca como realizado', (select status from atendimentos where id = :'at1') = 'realizado');
do $$ begin
  update public.atendimentos set atendente_id = null where true;
  perform public._t('atendente não repassa o atendimento', false);
exception when others then perform public._t('atendente não repassa o atendimento', true); end $$;
select public._t('obreiro não vê pedido confidencial', (select count(*) from pedidos_oracao where not compartilhar) = 0);
reset role;

\set QUIET 0
select n, case when ok then 'OK   ' else 'FALHOU' end as resultado, teste from public._resultados order by n;
select count(*) filter (where ok) as aprovados, count(*) filter (where not ok) as falhas from public._resultados;
