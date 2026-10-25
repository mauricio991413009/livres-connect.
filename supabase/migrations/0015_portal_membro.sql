-- =====================================================================
-- Livres Connect · migração 0015 · Portal do Membro
--
-- O membro entra por um link pessoal, sem senha, enviado pela igreja
-- pelo WhatsApp. O link carrega um código secreto de 64 caracteres; o
-- banco guarda só a impressão digital dele (SHA-256), nunca o código.
-- Gerar um link novo invalida o anterior.
--
-- Pelo portal o membro vê a carteirinha, as escalas (e confirma), a
-- agenda, os avisos, os pedidos de oração dele e o mural, a Escola de
-- Obreiros e o discipulado; atualiza os próprios dados, pede oração,
-- pede atendimento, ora pelos pedidos do mural e, se for discipulador,
-- registra os encontros com os discípulos.
-- =====================================================================

create table public.portal_acessos (
  pessoa_id      uuid primary key references public.pessoas(id) on delete cascade,
  igreja_id      uuid not null references public.igrejas(id) on delete cascade,
  token_hash     bytea not null unique,
  criado_em      timestamptz not null default now(),
  criado_por     uuid default auth.uid() references auth.users(id) on delete set null,
  ultimo_acesso  timestamptz
);
alter table public.portal_acessos enable row level security;
revoke all on public.portal_acessos from anon, authenticated;

-- ---------------------------------------------------------------------
-- Equipe: gerar, revogar e ver a situação dos links
-- ---------------------------------------------------------------------
create or replace function public.portal_gerar_link(p_pessoa uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v pessoas%rowtype; v_token text;
begin
  select * into v from pessoas where id = p_pessoa;
  if not found or not pode_editar_pessoa(v.id, v.igreja_id) then
    raise exception 'Seu perfil não tem permissão para enviar o portal a esta pessoa.';
  end if;
  if v.situacao not in ('ativo','afastado') then
    raise exception 'O portal é só para pessoas ativas.';
  end if;
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into portal_acessos (pessoa_id, igreja_id, token_hash)
  values (v.id, v.igreja_id, sha256(convert_to(v_token, 'UTF8')))
  on conflict (pessoa_id) do update
    set token_hash = excluded.token_hash, criado_em = now(), criado_por = auth.uid(), ultimo_acesso = null;
  return v_token;
end $$;

create or replace function public.portal_revogar(p_pessoa uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from pessoas where id = p_pessoa and pode_editar_pessoa(id, igreja_id)) then
    raise exception 'Seu perfil não tem permissão para esta pessoa.';
  end if;
  delete from portal_acessos where pessoa_id = p_pessoa;
end $$;

create or replace function public.portal_situacao(p_igreja uuid)
returns table (pessoa_id uuid, criado_em timestamptz, ultimo_acesso timestamptz)
language sql stable security definer set search_path = public as $$
  select a.pessoa_id, a.criado_em, a.ultimo_acesso
  from portal_acessos a
  where a.igreja_id = p_igreja and pode_ver_pessoa(a.pessoa_id, a.igreja_id);
$$;
revoke execute on function public.portal_gerar_link(uuid), public.portal_revogar(uuid), public.portal_situacao(uuid) from public, anon;
grant execute on function public.portal_gerar_link(uuid), public.portal_revogar(uuid), public.portal_situacao(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Quem é o dono deste link? (uso interno)
-- ---------------------------------------------------------------------
create or replace function public.portal_pessoa(p_token text)
returns uuid language sql stable security definer set search_path = public as $$
  select a.pessoa_id
  from portal_acessos a
  join pessoas p on p.id = a.pessoa_id
  join igrejas i on i.id = a.igreja_id
  where coalesce(p_token, '') ~ '^[0-9a-f]{64}$'
    and a.token_hash = sha256(convert_to(p_token, 'UTF8'))
    and i.status = 'ativa' and p.situacao in ('ativo','afastado');
$$;
revoke execute on function public.portal_pessoa(text) from public, anon, authenticated;

create or replace function public.portal_exigir(p_token text)
returns pessoas language plpgsql stable security definer set search_path = public as $$
declare v pessoas%rowtype;
begin
  select * into v from pessoas where id = portal_pessoa(p_token);
  if not found then
    raise exception 'Este link do portal não vale mais. Peça um link novo à secretaria da igreja.';
  end if;
  return v;
end $$;
revoke execute on function public.portal_exigir(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Tudo o que o portal mostra
-- ---------------------------------------------------------------------
create or replace function public.portal_dados(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v pessoas%rowtype; r jsonb;
begin
  v := portal_exigir(p_token);
  update portal_acessos set ultimo_acesso = now() where pessoa_id = v.id;

  select jsonb_build_object(
    'pessoa', jsonb_build_object(
      'nome', v.nome, 'matricula', 'LC-' || lpad(v.numero::text, 5, '0'), 'etapa', v.etapa, 'situacao', v.situacao,
      'telefone', v.telefone, 'email', v.email, 'endereco', v.endereco, 'nascimento', v.nascimento, 'casamento', v.casamento,
      'membro_desde', coalesce(v.data_batismo, v.data_conversao, v.primeira_visita),
      'ministerio', (select nome from ministerios where id = v.ministerio_id)),
    'igreja', (select jsonb_build_object('id', i.id, 'nome', i.nome, 'cidade', i.cidade, 'uf', i.uf) from igrejas i where i.id = v.igreja_id),
    'escalas', coalesce((select jsonb_agg(jsonb_build_object('evento', e.titulo, 'data', e.data, 'hora', e.hora, 'local', e.local,
        'ministerio', m.nome, 'status', s.status, 'token', s.token) order by e.data, e.hora)
      from escalas s join eventos e on e.id = s.evento_id join ministerios m on m.id = s.ministerio_id
      where s.pessoa_id = v.id and e.data >= current_date), '[]'),
    'agenda', coalesce((select jsonb_agg(x order by x->>'data', x->>'hora') from (
        select jsonb_build_object('titulo', e.titulo, 'data', e.data, 'hora', e.hora, 'local', e.local, 'tipo', e.tipo, 'descricao', e.descricao) x
        from eventos e where e.igreja_id = v.igreja_id and e.data between current_date and current_date + 45
        order by e.data, e.hora limit 20) t), '[]'),
    'avisos', coalesce((select jsonb_agg(x order by x->>'criado_em' desc) from (
        select jsonb_build_object('titulo', c.titulo, 'texto', c.texto, 'criado_em', c.criado_em) x
        from comunicados c
        where c.igreja_id = v.igreja_id and c.no_portal and (c.expira_em is null or c.expira_em >= current_date)
          and c.criado_em > now() - interval '60 days' and no_publico(v.etapa, v.ministerio_id, c.alvo, c.ministerio_id)
        order by c.criado_em desc limit 10) t), '[]'),
    'meus_pedidos', coalesce((select jsonb_agg(x order by x->>'criado_em' desc) from (
        select jsonb_build_object('pedido', o.pedido, 'status', o.status, 'testemunho', o.testemunho, 'oracoes', o.oracoes,
               'compartilhar', o.compartilhar, 'criado_em', o.criado_em) x
        from pedidos_oracao o where o.pessoa_id = v.id order by o.criado_em desc limit 10) t), '[]'),
    'mural', coalesce((select jsonb_agg(x order by x->>'criado_em' desc) from (
        select jsonb_build_object('id', o.id, 'nome', split_part(trim(o.nome), ' ', 1), 'pedido', o.pedido, 'oracoes', o.oracoes,
               'criado_em', o.criado_em, 'meu', o.pessoa_id is not distinct from v.id,
               'orei', exists (select 1 from pedido_oracoes po where po.pedido_id = o.id and po.pessoa_id = v.id)) x
        from pedidos_oracao o
        where o.igreja_id = v.igreja_id and o.mural and o.status = 'aberto' and o.criado_em > now() - interval '45 days'
        order by o.criado_em desc limit 30) t), '[]'),
    'escola', coalesce((select jsonb_agg(jsonb_build_object('turma', t.nome, 'curso', t.curso, 'horario', t.horario, 'local', t.local,
        'situacao', a.situacao,
        'frequencia', (select round(100.0 * count(*) filter (where pr.presente) / nullif(count(*), 0)) from escola_presencas pr where pr.aluno_id = a.id),
        'media', (select round(sum(n.nota * av.peso) / nullif(sum(av.peso), 0), 1) from escola_notas n join escola_avaliacoes av on av.id = n.avaliacao_id where n.aluno_id = a.id),
        'certificado', case when a.situacao = 'aprovado' then a.certificado end) order by a.matriculado_em desc)
      from escola_alunos a join escola_turmas t on t.id = a.turma_id where a.pessoa_id = v.id), '[]'),
    'discipulado', (select jsonb_build_object('discipulador', p.nome, 'telefone', p.telefone, 'status', d.status,
        'licoes', coalesce((select jsonb_agg(distinct e.licao) from discipulado_encontros e where e.discipulado_id = d.id and e.licao is not null), '[]'))
      from discipulados d join pessoas p on p.id = d.discipulador_id
      where d.discipulo_id = v.id order by (d.status = 'ativo') desc, d.criado_em desc limit 1),
    'discipulos', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'nome', p.nome, 'telefone', p.telefone,
        'licoes', coalesce((select jsonb_agg(distinct e.licao) from discipulado_encontros e where e.discipulado_id = d.id and e.licao is not null), '[]'),
        'ultimo', (select max(e.data) from discipulado_encontros e where e.discipulado_id = d.id)) order by p.nome)
      from discipulados d join pessoas p on p.id = d.discipulo_id
      where d.discipulador_id = v.id and d.status = 'ativo'), '[]'),
    'atendimentos', coalesce((select jsonb_agg(jsonb_build_object('assunto', a.assunto, 'status', a.status,
        'agendado_para', a.agendado_para, 'local', a.local, 'criado_em', a.criado_em) order by a.criado_em desc)
      from atendimentos a where a.pessoa_id = v.id and a.status in ('pendente','agendado')), '[]')
  ) into r;
  return r;
end $$;

-- ---------------------------------------------------------------------
-- O que o membro faz pelo portal
-- ---------------------------------------------------------------------
create or replace function public.portal_atualizar(p_token text, p_telefone text, p_email text,
  p_endereco text, p_nascimento date, p_casamento date)
returns void language plpgsql security definer set search_path = public as $$
declare v pessoas%rowtype; v_tel text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
begin
  v := portal_exigir(p_token);
  if length(v_tel) < 10 or length(v_tel) > 13 then raise exception 'Informe o WhatsApp com DDD.'; end if;
  if coalesce(p_email, '') <> '' and p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Confira o e-mail.'; end if;
  if length(coalesce(p_endereco, '')) > 300 then raise exception 'O endereço ficou muito longo.'; end if;
  if p_nascimento > current_date or p_nascimento < date '1900-01-01' then raise exception 'Confira a data de nascimento.'; end if;
  if p_casamento > current_date then raise exception 'Confira a data de casamento.'; end if;
  update pessoas set telefone = trim(p_telefone), email = nullif(lower(trim(coalesce(p_email, ''))), ''),
    endereco = nullif(trim(coalesce(p_endereco, '')), ''), nascimento = p_nascimento, casamento = p_casamento
  where id = v.id;
end $$;

create or replace function public.portal_pedir_oracao(p_token text, p_pedido text, p_compartilhar boolean, p_mural boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v pessoas%rowtype;
begin
  v := portal_exigir(p_token);
  if length(trim(coalesce(p_pedido, ''))) < 3 or length(p_pedido) > 2000 then raise exception 'Escreva o seu pedido (até 2.000 letras).'; end if;
  if (select count(*) from pedidos_oracao where pessoa_id = v.id and criado_em > now() - interval '1 day') >= 10 then
    raise exception 'Você já enviou muitos pedidos hoje. Tente de novo amanhã.';
  end if;
  insert into pedidos_oracao (igreja_id, pessoa_id, nome, telefone, pedido, compartilhar, mural, origem)
  values (v.igreja_id, v.id, v.nome, v.telefone, trim(p_pedido), coalesce(p_compartilhar, false),
          coalesce(p_compartilhar, false) and coalesce(p_mural, false), 'portal');
end $$;

create or replace function public.portal_pedir_atendimento(p_token text, p_assunto text, p_mensagem text, p_preferencia text)
returns void language plpgsql security definer set search_path = public as $$
declare v pessoas%rowtype;
begin
  v := portal_exigir(p_token);
  if coalesce(p_assunto, '') not in ('aconselhamento','oracao','visita','familia','casamento','batismo','outro') then raise exception 'Escolha o assunto.'; end if;
  if length(coalesce(p_mensagem, '')) > 2000 or length(coalesce(p_preferencia, '')) > 200 then raise exception 'O texto ficou muito longo.'; end if;
  if (select count(*) from atendimentos where pessoa_id = v.id and status = 'pendente') >= 3 then
    raise exception 'Você já tem pedidos aguardando. O pastor vai falar com você em breve.';
  end if;
  insert into atendimentos (igreja_id, pessoa_id, nome, telefone, assunto, mensagem, preferencia, origem)
  values (v.igreja_id, v.id, v.nome, v.telefone, p_assunto, nullif(trim(coalesce(p_mensagem, '')), ''),
          nullif(trim(coalesce(p_preferencia, '')), ''), 'portal');
end $$;

create or replace function public.portal_orei(p_token text, p_pedido uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v pessoas%rowtype; v_n integer; v_novo boolean;
begin
  v := portal_exigir(p_token);
  if not exists (select 1 from pedidos_oracao where id = p_pedido and igreja_id = v.igreja_id and mural and status = 'aberto') then
    raise exception 'Pedido não encontrado.';
  end if;
  insert into pedido_oracoes (pedido_id, pessoa_id) values (p_pedido, v.id) on conflict do nothing;
  get diagnostics v_novo = row_count;
  if v_novo then
    update pedidos_oracao set oracoes = oracoes + 1 where id = p_pedido returning oracoes into v_n;
  else
    select oracoes into v_n from pedidos_oracao where id = p_pedido;
  end if;
  return v_n;
end $$;

create or replace function public.portal_registrar_encontro(p_token text, p_discipulado uuid, p_data date,
  p_licao smallint, p_resumo text)
returns void language plpgsql security definer set search_path = public as $$
declare v pessoas%rowtype; d discipulados%rowtype;
begin
  v := portal_exigir(p_token);
  select * into d from discipulados where id = p_discipulado and discipulador_id = v.id and status = 'ativo';
  if not found then raise exception 'Discipulado não encontrado.'; end if;
  if p_data is null or p_data > current_date or p_data < current_date - 60 then raise exception 'Confira a data do encontro.'; end if;
  if p_licao is not null and (p_licao < 1 or p_licao > 8) then raise exception 'Lição inválida.'; end if;
  if length(coalesce(p_resumo, '')) > 1000 then raise exception 'O resumo ficou muito longo.'; end if;
  insert into discipulado_encontros (igreja_id, discipulado_id, data, licao, resumo, via_portal)
  values (d.igreja_id, d.id, p_data, p_licao, nullif(trim(coalesce(p_resumo, '')), ''), true);
end $$;

revoke execute on function public.portal_dados(text), public.portal_atualizar(text, text, text, text, date, date),
  public.portal_pedir_oracao(text, text, boolean, boolean), public.portal_pedir_atendimento(text, text, text, text),
  public.portal_orei(text, uuid), public.portal_registrar_encontro(text, uuid, date, smallint, text) from public;
grant execute on function public.portal_dados(text), public.portal_atualizar(text, text, text, text, date, date),
  public.portal_pedir_oracao(text, text, boolean, boolean), public.portal_pedir_atendimento(text, text, text, text),
  public.portal_orei(text, uuid), public.portal_registrar_encontro(text, uuid, date, smallint, text) to anon, authenticated;
