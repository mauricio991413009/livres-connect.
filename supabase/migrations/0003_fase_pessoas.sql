-- =====================================================================
-- Livres Connect · migração 0003 · fase Pessoas
--
-- Membros, visitantes (ficha pública por QR Code) e Jornada da Alma.
-- =====================================================================

-- Novas informações sobre a pessoa
alter table public.pessoas
  add column if not exists numero         bigint generated always as identity,
  add column if not exists origem         text not null default 'cadastro'
                                          check (origem in ('cadastro','qr')),
  add column if not exists interesse      text,
  add column if not exists visitas        integer not null default 1 check (visitas >= 1),
  add column if not exists ultima_visita  date default current_date,
  add column if not exists observacoes    text;

create index if not exists pessoas_igreja_telefone_idx on public.pessoas(igreja_id, telefone);

-- Toda pessoa nova já começa com o registro da sua etapa na Jornada
create or replace function public.ao_criar_pessoa()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into jornada_etapas (igreja_id, pessoa_id, etapa, data_inicio, autor_id)
  values (new.igreja_id, new.id, new.etapa, coalesce(new.primeira_visita, current_date), auth.uid());
  return new;
end $$;
create trigger ao_criar_pessoa after insert on public.pessoas
  for each row execute function public.ao_criar_pessoa();
revoke execute on function public.ao_criar_pessoa() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Mudar a etapa de uma pessoa na Jornada da Alma
-- Roda com as permissões de quem chama: só quem pode editar a pessoa consegue.
-- ---------------------------------------------------------------------
create or replace function public.mudar_etapa(p_pessoa uuid, p_etapa smallint)
returns void language plpgsql security invoker set search_path = public as $$
declare v pessoas%rowtype;
begin
  if p_etapa < 0 or p_etapa > 6 then
    raise exception 'Etapa inválida.';
  end if;
  select * into v from pessoas where id = p_pessoa;
  if not found or not pode_editar_pessoa(v.id, v.igreja_id) then
    raise exception 'Seu perfil não tem permissão para mudar a etapa desta pessoa.';
  end if;
  if v.etapa = p_etapa then
    return;
  end if;
  update pessoas set
    etapa          = p_etapa,
    data_conversao = case when p_etapa >= 1 and data_conversao is null then current_date else data_conversao end,
    data_batismo   = case when p_etapa >= 4 and v.etapa = 3 and data_batismo is null then current_date else data_batismo end
  where id = p_pessoa;
  insert into jornada_etapas (igreja_id, pessoa_id, etapa) values (v.igreja_id, v.id, p_etapa);
end $$;
revoke execute on function public.mudar_etapa(uuid, smallint) from public, anon;
grant execute on function public.mudar_etapa(uuid, smallint) to authenticated;

-- ---------------------------------------------------------------------
-- Quem pode acompanhar pessoas (para escolher o responsável)
-- ---------------------------------------------------------------------
create or replace function public.equipe_acompanhamento(p_igreja uuid)
returns table (user_id uuid, nome text, perfil public.perfil, ministerio_id uuid)
language sql stable security definer set search_path = public as $$
  select distinct on (v.user_id) v.user_id, coalesce(nullif(u.nome, ''), u.email), v.perfil, v.ministerio_id
  from vinculos v join usuarios u on u.id = v.user_id
  where v.igreja_id = p_igreja and v.ativo and v.perfil in ('pastor','presbiterio','lider')
    and tem_perfil(p_igreja, '{pastor,presbiterio,secretaria,lider}')
  order by v.user_id, case v.perfil when 'lider' then 0 when 'presbiterio' then 1 else 2 end;
$$;
revoke execute on function public.equipe_acompanhamento(uuid) from public, anon;
grant execute on function public.equipe_acompanhamento(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Ficha pública do visitante (QR Code). Não exige login.
-- ---------------------------------------------------------------------
create or replace function public.igreja_publica(p_igreja uuid)
returns table (nome text, cidade text, uf text)
language sql stable security definer set search_path = public as $$
  select nome, cidade, uf from igrejas where id = p_igreja and status = 'ativa';
$$;
revoke execute on function public.igreja_publica(uuid) from public;
grant execute on function public.igreja_publica(uuid) to anon, authenticated;

create or replace function public.registrar_visitante(
  p_igreja uuid, p_nome text, p_telefone text, p_nascimento date,
  p_convidado_por text, p_interesse text, p_consentimento boolean)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_tel  text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  v_id   uuid;
  v_resp uuid;
begin
  if not exists (select 1 from igrejas where id = p_igreja and status = 'ativa') then
    raise exception 'Igreja não encontrada.';
  end if;
  if not coalesce(p_consentimento, false) then
    raise exception 'É preciso autorizar o uso dos dados para enviar a ficha.';
  end if;
  if length(trim(coalesce(p_nome, ''))) < 3 or length(p_nome) > 120 then
    raise exception 'Informe o nome completo.';
  end if;
  if length(v_tel) < 10 or length(v_tel) > 13 then
    raise exception 'Informe um WhatsApp com DDD.';
  end if;
  -- proteção contra envio em massa
  if (select count(*) from pessoas where igreja_id = p_igreja and origem = 'qr'
        and criado_em > now() - interval '1 hour') >= 60 then
    raise exception 'Muitas fichas recebidas agora. Tente de novo em alguns minutos.';
  end if;

  -- Já esteve aqui? Conta mais uma visita.
  select id into v_id from pessoas
  where igreja_id = p_igreja and regexp_replace(coalesce(telefone, ''), '\D', '', 'g') = v_tel
  order by criado_em limit 1;
  if v_id is not null then
    update pessoas set
      visitas = visitas + case when ultima_visita = current_date then 0 else 1 end,
      ultima_visita = current_date
    where id = v_id;
    return 'retorno';
  end if;

  -- Responsável: o líder com menos pessoas em acompanhamento; se não houver líder, o pastor
  select v.user_id into v_resp
  from vinculos v
  where v.igreja_id = p_igreja and v.ativo and v.perfil in ('lider','pastor')
  order by case v.perfil when 'lider' then 0 else 1 end,
           (select count(*) from pessoas p where p.responsavel_id = v.user_id
              and p.igreja_id = p_igreja and p.etapa <= 2),
           random()
  limit 1;

  insert into pessoas (igreja_id, nome, telefone, nascimento, convidado_por, interesse,
                       etapa, origem, responsavel_id, consentimento_lgpd_em)
  values (p_igreja, trim(p_nome), trim(p_telefone), p_nascimento,
          nullif(trim(coalesce(p_convidado_por, '')), ''), nullif(trim(coalesce(p_interesse, '')), ''),
          0, 'qr', v_resp, now());
  return 'novo';
end $$;
revoke execute on function public.registrar_visitante(uuid, text, text, date, text, text, boolean) from public;
grant execute on function public.registrar_visitante(uuid, text, text, date, text, text, boolean) to anon, authenticated;

-- Atividades concluídas também podem ser desmarcadas por quem acompanha
-- (a política "atividades_gerir" já cobre inserir, alterar e excluir).
