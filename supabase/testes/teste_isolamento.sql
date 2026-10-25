-- Testes de isolamento entre igrejas e de perfis de acesso.
-- Rode depois de simular_supabase.sql e da migração 0001_base.sql.
\set ON_ERROR_STOP 1
\set QUIET 1

create table public._resultados (n serial, teste text, ok boolean);
create function public._t(p_teste text, p_ok boolean) returns void
  language sql security definer as $$ insert into public._resultados (teste, ok) values (p_teste, coalesce(p_ok, false)) $$;
grant execute on function public._t(text, boolean) to authenticated, anon;

-- Contas (todas já confirmadas, exceto a do teste de convite)
insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@plataforma.test',   now()),
  ('00000000-0000-0000-0000-00000000000b', 'pastor1@igreja1.test',    now()),
  ('00000000-0000-0000-0000-00000000000c', 'pastor2@igreja2.test',    now()),
  ('00000000-0000-0000-0000-00000000000d', 'tesouraria@igreja1.test', now()),
  ('00000000-0000-0000-0000-00000000000e', 'secretaria@igreja1.test', now()),
  ('00000000-0000-0000-0000-00000000000f', 'lider@igreja1.test',      now());
insert into public.admins_plataforma (user_id) values ('00000000-0000-0000-0000-00000000000a');

-- ===== Administrador cria duas igrejas =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select public.criar_igreja('Livres em Cristo', 'Blumenau', 'sc', 'pastor1@igreja1.test') as id \gset ig1_
select public.criar_igreja('Vida Nova', 'Itajaí', 'SC', 'pastor2@igreja2.test') as id \gset ig2_
select public._t('admin vê as 2 igrejas', (select count(*) from igrejas) = 2);
select public._t('igreja nova vem com 13 ministérios', (select count(*) from ministerios where igreja_id = :'ig1_id') = 13);
select public._t('admin não vê as atividades internas da igreja', (select count(*) from jornada_atividades_modelo where igreja_id = :'ig1_id') = 0);
reset role;
select public._t('(conferido como dono) 21 atividades da Jornada criadas', (select count(*) from jornada_atividades_modelo where igreja_id = :'ig1_id') = 21);
select public._t('pastor já cadastrado vira pastor na hora', (select count(*) from vinculos where user_id = '00000000-0000-0000-0000-00000000000b' and perfil = 'pastor') = 1);

-- ===== Pastor da igreja 1 monta a equipe e cadastra dados =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
select public._t('pastor 1 vê só a igreja dele', (select count(*) from igrejas) = 1);
select id as louvor from ministerios where igreja_id = :'ig1_id' and nome = 'Louvor' \gset
insert into convites (igreja_id, email, perfil) values (:'ig1_id', 'tesouraria@igreja1.test', 'tesouraria');
insert into convites (igreja_id, email, perfil) values (:'ig1_id', 'secretaria@igreja1.test', 'secretaria');
insert into convites (igreja_id, email, perfil, ministerio_id) values (:'ig1_id', 'lider@igreja1.test', 'lider', :'louvor');
select public._t('convites viram vínculos (pastor vê 4 vínculos)', (select count(*) from vinculos) = 4);

insert into pessoas (igreja_id, nome, etapa) values (:'ig1_id', 'Ana Ribeiro', 4), (:'ig1_id', 'Bruno Lima', 0);
insert into pessoas (igreja_id, nome, etapa, responsavel_id) values (:'ig1_id', 'Carla Souza', 1, '00000000-0000-0000-0000-00000000000f');
insert into pessoas (igreja_id, nome, etapa, ministerio_id) values (:'ig1_id', 'Davi Costa', 6, :'louvor');
select id as cat from categorias_financeiras where igreja_id = :'ig1_id' and nome = 'Dízimos' \gset
insert into lancamentos (igreja_id, tipo, categoria_id, descricao, valor_centavos) values (:'ig1_id', 'entrada', :'cat', 'Dízimos de domingo', 452000);
select public._t('pastor 1 vê as 4 pessoas', (select count(*) from pessoas) = 4);
select public._t('pastor 1 vê o lançamento', (select count(*) from lancamentos) = 1);

do $$ begin
  update vinculos set ativo = false where user_id = auth.uid() and perfil = 'pastor';
  perform public._t('pastor não consegue remover o último pastor', false);
exception when others then
  perform public._t('pastor não consegue remover o último pastor', sqlerrm like '%pelo menos um pastor%');
end $$;
do $$ begin
  update igrejas set status = 'suspensa';
  perform public._t('pastor não consegue suspender a própria igreja', false);
exception when others then
  perform public._t('pastor não consegue suspender a própria igreja', sqlerrm like '%administrador%');
end $$;

-- ===== Pastor da igreja 2 tenta ver e mexer na igreja 1 =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
select public._t('pastor 2 não vê pessoas da igreja 1', (select count(*) from pessoas) = 0);
select public._t('pastor 2 não vê lançamentos da igreja 1', (select count(*) from lancamentos) = 0);
select public._t('pastor 2 não vê vínculos da igreja 1', (select count(*) from vinculos where igreja_id = :'ig1_id') = 0);
select public._t('pastor 2 não vê auditoria da igreja 1', (select count(*) from auditoria where igreja_id = :'ig1_id') = 0);
do $$ begin
  insert into pessoas (igreja_id, nome) select id, 'Invasor' from igrejas where nome = 'Livres em Cristo';
  perform public._t('pastor 2 não insere pessoa na igreja 1', (select count(*) from igrejas where nome = 'Livres em Cristo') = 0);
exception when others then
  perform public._t('pastor 2 não insere pessoa na igreja 1', true);
end $$;
update pessoas set nome = 'Alterado' where nome = 'Ana Ribeiro';
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
select public._t('(conferido) nome da Ana continua igual', (select count(*) from pessoas where nome = 'Ana Ribeiro') = 1);
do $$ begin
  insert into convites (igreja_id, email, perfil) select id, 'x@y.test', 'pastor' from igrejas where nome = 'Livres em Cristo';
  perform public._t('(controle) pastor 1 pode convidar na própria igreja', true);
end $$;
reset role;
do $$ declare ig uuid; begin
  select id into ig from public.igrejas where nome = 'Livres em Cristo';
  set local role authenticated;
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', true);
  begin
    insert into public.convites (igreja_id, email, perfil) values (ig, 'hacker@x.test', 'pastor');
    perform public._t('pastor 2 não se convida como pastor da igreja 1', false);
  exception when others then
    perform public._t('pastor 2 não se convida como pastor da igreja 1', sqlerrm like '%row-level security%');
  end;
end $$;
reset role;

-- ===== Tesouraria =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
select public._t('tesouraria vê o financeiro', (select count(*) from lancamentos) = 1);
select public._t('tesouraria não vê pessoas', (select count(*) from pessoas) = 0);
select public._t('tesouraria não vê vínculos de outros', (select count(*) from vinculos where user_id <> auth.uid()) = 0);
select public._t('tesouraria não vê auditoria', (select count(*) from auditoria) = 0);

-- ===== Secretaria =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
select public._t('secretaria vê as 4 pessoas', (select count(*) from pessoas) = 4);
select public._t('secretaria não vê o financeiro', (select count(*) from lancamentos) = 0);
update pessoas set telefone = '(47) 99999-0000' where nome = 'Bruno Lima';
select public._t('secretaria edita pessoa', (select telefone from pessoas where nome = 'Bruno Lima') = '(47) 99999-0000');

-- ===== Líder =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', false);
select public._t('líder vê só quem acompanha e o próprio ministério (2)', (select count(*) from pessoas) = 2);
insert into anotacoes_pastorais (igreja_id, pessoa_id, texto)
  select igreja_id, id, 'Pediu oração pela família.' from pessoas where nome = 'Carla Souza';
select public._t('líder registra anotação de quem acompanha', (select count(*) from anotacoes_pastorais) = 1);
insert into contatos (igreja_id, pessoa_id, canal, resumo)
  select igreja_id, id, 'whatsapp', 'Confirmou presença' from pessoas where nome = 'Carla Souza';
select public._t('líder registra contato', (select count(*) from contatos) = 1);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
select public._t('secretaria NÃO vê anotações pastorais', (select count(*) from anotacoes_pastorais) = 0);
select public._t('secretaria vê o contato registrado', (select count(*) from contatos) = 1);

-- ===== Auditoria =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
select public._t('pastor 1 vê a auditoria da igreja', (select count(*) from auditoria) > 10);
select public._t('auditoria registra quem alterou o telefone', (select count(*) from auditoria where tabela = 'pessoas' and acao = 'update' and user_id = '00000000-0000-0000-0000-00000000000e') = 1);
select public._t('auditoria NÃO guarda o texto da anotação', (select count(*) from auditoria where tabela = 'anotacoes_pastorais' and depois ? 'texto') = 0);
select public._t('pastor 1 vê a anotação', (select count(*) from anotacoes_pastorais) = 1);

-- ===== Admin não vê dados internos =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select public._t('admin não vê pessoas', (select count(*) from pessoas) = 0);
select public._t('admin não vê financeiro', (select count(*) from lancamentos) = 0);
reset role;

-- ===== Convite para quem ainda não tem conta =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
insert into convites (igreja_id, email, perfil) values (:'ig1_id', 'novo@igreja1.test', 'diacono');
reset role;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000010', 'Novo@Igreja1.test');
select public._t('conta sem e-mail confirmado ainda não tem acesso', (select count(*) from vinculos where user_id = '00000000-0000-0000-0000-000000000010') = 0);
update auth.users set email_confirmed_at = now() where id = '00000000-0000-0000-0000-000000000010';
select public._t('ao confirmar o e-mail, vira diácono', (select count(*) from vinculos where user_id = '00000000-0000-0000-0000-000000000010' and perfil = 'diacono') = 1);

-- ===== Igreja suspensa =====
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
update igrejas set status = 'suspensa' where id = :'ig2_id';
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
select public._t('igreja suspensa perde o acesso', (select count(*) from igrejas) = 0);
reset role;

-- ===== Visitante anônimo =====
set role anon;
do $$ begin
  perform count(*) from public.pessoas;
  perform public._t('anônimo não lê pessoas', false);
exception when others then
  perform public._t('anônimo não lê pessoas', true);
end $$;
reset role;

\set QUIET 0
select n, case when ok then 'OK   ' else 'FALHOU' end as resultado, teste from public._resultados order by n;
select count(*) filter (where ok) as aprovados, count(*) filter (where not ok) as falhas from public._resultados;
