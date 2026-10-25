-- =====================================================================
-- Livres Connect · migração 0005 · fase Gestão
--
-- Financeiro (forma de pagamento), agenda com eventos que se repetem e
-- escalas com link de confirmação para o voluntário (sem login).
-- =====================================================================

alter table public.lancamentos
  add column if not exists forma text
    check (forma is null or forma in ('dinheiro','pix','cartao','transferencia','boleto','outro'));

alter table public.eventos
  add column if not exists serie_id uuid,
  add column if not exists descricao text;
create index if not exists eventos_serie_idx on public.eventos(serie_id);

alter table public.escalas
  add column if not exists token uuid not null default gen_random_uuid(),
  add column if not exists respondido_em timestamptz;
create unique index if not exists escalas_token_idx on public.escalas(token);

-- ---------------------------------------------------------------------
-- Escala de um evento com os nomes (para quem pode ver escalas).
-- Telefone e link de confirmação só para quem monta escala ou acompanha.
-- ---------------------------------------------------------------------
create or replace function public.escala_do_evento(p_evento uuid)
returns table (id uuid, ministerio_id uuid, pessoa_id uuid, nome text, telefone text,
               status text, lembrete_enviado_em timestamptz, respondido_em timestamptz, token uuid)
language sql stable security definer set search_path = public as $$
  select s.id, s.ministerio_id, s.pessoa_id, p.nome,
         case when tem_perfil(e.igreja_id, '{pastor,secretaria,lider}') then p.telefone end,
         s.status, s.lembrete_enviado_em, s.respondido_em,
         case when tem_perfil(e.igreja_id, '{pastor}')
                or exists (select 1 from vinculos v where v.user_id = auth.uid() and v.igreja_id = e.igreja_id
                           and v.ativo and v.perfil = 'lider' and v.ministerio_id = s.ministerio_id)
              then s.token end
  from escalas s
  join eventos e on e.id = s.evento_id
  join pessoas p on p.id = s.pessoa_id
  where s.evento_id = p_evento
    and tem_perfil(e.igreja_id, '{pastor,presbiterio,secretaria,lider,diacono}')
  order by p.nome;
$$;
revoke execute on function public.escala_do_evento(uuid) from public, anon;
grant execute on function public.escala_do_evento(uuid) to authenticated;

-- Voluntários que podem ser escalados (membros ativos), com o ministério de cada um.
create or replace function public.voluntarios(p_igreja uuid)
returns table (pessoa_id uuid, nome text, ministerio_id uuid)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.ministerio_id
  from pessoas p
  where p.igreja_id = p_igreja and p.etapa >= 4 and p.situacao = 'ativo'
    and tem_perfil(p_igreja, '{pastor,lider}')
  order by p.nome;
$$;
revoke execute on function public.voluntarios(uuid) from public, anon;
grant execute on function public.voluntarios(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Página pública da escala (o voluntário abre pelo link do WhatsApp)
-- ---------------------------------------------------------------------
create or replace function public.escala_publica(p_token uuid)
returns table (pessoa text, ministerio text, evento text, data date, hora time,
               local text, igreja text, status text)
language sql stable security definer set search_path = public as $$
  select split_part(p.nome, ' ', 1), m.nome, e.titulo, e.data, e.hora, e.local, i.nome, s.status
  from escalas s
  join eventos e on e.id = s.evento_id
  join ministerios m on m.id = s.ministerio_id
  join pessoas p on p.id = s.pessoa_id
  join igrejas i on i.id = s.igreja_id
  where s.token = p_token and i.status = 'ativa';
$$;
revoke execute on function public.escala_publica(uuid) from public;
grant execute on function public.escala_publica(uuid) to anon, authenticated;

create or replace function public.responder_escala(p_token uuid, p_status text)
returns text language plpgsql security definer set search_path = public as $$
declare v_data date;
begin
  if p_status not in ('confirmado', 'recusado') then
    raise exception 'Resposta inválida.';
  end if;
  select e.data into v_data
  from escalas s join eventos e on e.id = s.evento_id join igrejas i on i.id = s.igreja_id
  where s.token = p_token and i.status = 'ativa';
  if v_data is null then
    raise exception 'Escala não encontrada.';
  end if;
  if v_data < current_date then
    raise exception 'Este culto já passou.';
  end if;
  update escalas set status = p_status, respondido_em = now() where token = p_token;
  return p_status;
end $$;
revoke execute on function public.responder_escala(uuid, text) from public;
grant execute on function public.responder_escala(uuid, text) to anon, authenticated;
