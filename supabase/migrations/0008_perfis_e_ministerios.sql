-- =====================================================================
-- Livres Connect · migração 0008 · permissões dos novos perfis e novos
-- ministérios
--
-- Obreiro, missionário e evangelista acompanham pessoas como um líder:
--   veem e cuidam de quem está sob sua responsabilidade (ou do seu
--   ministério), recebem visitantes do QR Code e montam a escala do
--   ministério que lideram.
-- Pastora acompanha toda a igreja: vê e edita todas as pessoas, vê os
--   relatórios financeiros, cuida da agenda e das anotações pastorais de
--   quem acompanha. Não lança no financeiro, não convida usuários e não
--   altera as configurações da igreja (isso continua com o pastor
--   presidente).
-- =====================================================================

-- Perfis que funcionam como líder de acompanhamento
create or replace function public.perfis_lideranca()
returns public.perfil[] language sql immutable as $$
  select '{lider,obreiro,missionario,evangelista,pastora}'::public.perfil[];
$$;

-- O usuário atual tem (algum / um destes) perfil(is) nesta igreja ativa?
-- Os perfis novos herdam as permissões equivalentes.
create or replace function public.tem_perfil(p_igreja uuid, p_perfis public.perfil[] default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from vinculos v join igrejas i on i.id = v.igreja_id
    where v.user_id = auth.uid() and v.igreja_id = p_igreja and v.ativo
      and i.status = 'ativa'
      and (p_perfis is null
           or v.perfil = any (p_perfis)
           or (v.perfil in ('obreiro','missionario','evangelista') and 'lider' = any (p_perfis))
           or (v.perfil = 'pastora' and p_perfis && '{presbiterio,secretaria,lider}'::perfil[])));
$$;

-- Lidera o ministério?
create or replace function public.lidera_ministerio(p_igreja uuid, p_ministerio uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_ministerio is not null and exists (
    select 1 from vinculos v join igrejas i on i.id = v.igreja_id
    where v.user_id = auth.uid() and v.igreja_id = p_igreja and v.ativo and i.status = 'ativa'
      and v.perfil = any (perfis_lideranca()) and v.ministerio_id = p_ministerio);
$$;

create or replace function public.lidera_pessoa(p_pessoa uuid, p_igreja uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select tem_perfil(p_igreja, '{lider}') and exists (
    select 1 from pessoas p
    where p.id = p_pessoa and p.igreja_id = p_igreja
      and (p.responsavel_id = auth.uid() or lidera_ministerio(p_igreja, p.ministerio_id)));
$$;

-- Escalas: o líder (ou obreiro, missionário, evangelista, pastora) do ministério monta a escala
drop policy if exists escalas_gerir on public.escalas;
create policy escalas_gerir on public.escalas for all to authenticated
  using (tem_perfil(igreja_id, '{pastor}') or lidera_ministerio(igreja_id, ministerio_id))
  with check (tem_perfil(igreja_id, '{pastor}') or lidera_ministerio(igreja_id, ministerio_id));

create or replace function public.escala_do_evento(p_evento uuid)
returns table (id uuid, ministerio_id uuid, pessoa_id uuid, nome text, telefone text,
               status text, lembrete_enviado_em timestamptz, respondido_em timestamptz, token uuid)
language sql stable security definer set search_path = public as $$
  select s.id, s.ministerio_id, s.pessoa_id, p.nome,
         case when tem_perfil(e.igreja_id, '{pastor,secretaria,lider}') then p.telefone end,
         s.status, s.lembrete_enviado_em, s.respondido_em,
         case when tem_perfil(e.igreja_id, '{pastor}') or lidera_ministerio(e.igreja_id, s.ministerio_id)
              then s.token end
  from escalas s
  join eventos e on e.id = s.evento_id
  join pessoas p on p.id = s.pessoa_id
  where s.evento_id = p_evento
    and tem_perfil(e.igreja_id, '{pastor,presbiterio,secretaria,lider,diacono}')
  order by p.nome;
$$;

-- Quem pode ser escolhido como responsável pelo acompanhamento
create or replace function public.equipe_acompanhamento(p_igreja uuid)
returns table (user_id uuid, nome text, perfil public.perfil, ministerio_id uuid)
language sql stable security definer set search_path = public as $$
  select distinct on (v.user_id) v.user_id, coalesce(nullif(u.nome, ''), u.email), v.perfil, v.ministerio_id
  from vinculos v join usuarios u on u.id = v.user_id
  where v.igreja_id = p_igreja and v.ativo
    and (v.perfil in ('pastor','presbiterio') or v.perfil = any (perfis_lideranca()))
    and tem_perfil(p_igreja, '{pastor,presbiterio,secretaria,lider}')
  order by v.user_id, case when v.perfil = any (perfis_lideranca()) then 0 when v.perfil = 'presbiterio' then 1 else 2 end;
$$;

-- Visitante do QR Code vai para quem acompanha (líder, obreiro, missionário,
-- evangelista ou pastora) com menos pessoas; se não houver, para o pastor.
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
  if (select count(*) from pessoas where igreja_id = p_igreja and origem = 'qr'
        and criado_em > now() - interval '1 hour') >= 60 then
    raise exception 'Muitas fichas recebidas agora. Tente de novo em alguns minutos.';
  end if;

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

  select v.user_id into v_resp
  from vinculos v
  where v.igreja_id = p_igreja and v.ativo
    and (v.perfil = 'pastor' or v.perfil = any (perfis_lideranca()))
  order by case when v.perfil = 'pastor' then 1 else 0 end,
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

-- Igrejas novas já nascem com todos os ministérios
create or replace function public.criar_igreja(
  p_nome text, p_cidade text, p_uf text, p_email_pastor text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not eh_admin() then
    raise exception 'Somente o administrador da plataforma cadastra igrejas.';
  end if;
  if coalesce(trim(p_email_pastor), '') not like '%_@_%' then
    raise exception 'Informe um e-mail válido para o pastor presidente.';
  end if;

  insert into igrejas (nome, cidade, uf)
  values (trim(p_nome), nullif(trim(p_cidade), ''), nullif(upper(trim(p_uf)), ''))
  returning id into v_id;

  insert into ministerios (igreja_id, nome)
  select v_id, n from unnest(array['Louvor','Recepção','Diáconos','Intercessão',
    'Mídia e transmissão','Limpeza','Infantil','Segurança e estacionamento',
    'Grupos familiares (células)','Ministério de jovens','Ministério de casais',
    'Ministério de homens','Ministério de mulheres']) n;

  insert into categorias_financeiras (igreja_id, nome, tipo)
  select v_id, n, 'entrada' from unnest(array['Dízimos','Ofertas','Mantenedores','Campanhas']) n
  union all
  select v_id, n, 'saida' from unnest(array['Aluguel','Energia e água','Internet e mídia',
    'Prebenda pastoral','Missões','Manutenção','Limpeza','Campanhas']) n;

  insert into jornada_atividades_modelo (igreja_id, etapa, descricao, ordem) values
    (v_id,0,'Contato em até 48 horas',1),(v_id,0,'Convite para o próximo culto',2),(v_id,0,'Apresentar a um líder',3),
    (v_id,1,'Visita do consolidador',1),(v_id,1,'Entrega do material de boas-vindas',2),(v_id,1,'Inscrição no discipulado',3),
    (v_id,2,'Concluir as lições do discipulado',1),(v_id,2,'Participar de um grupo',2),(v_id,2,'Conversa com o pastor',3),
    (v_id,3,'Classe de batismo',1),(v_id,3,'Entrevista pastoral',2),(v_id,3,'Data do batismo marcada',3),
    (v_id,4,'Cadastro completo',1),(v_id,4,'Carteirinha emitida',2),(v_id,4,'Integração a um ministério',3),
    (v_id,5,'Matrícula na Escola de Obreiros',1),(v_id,5,'Curso de liderança',2),(v_id,5,'Avaliação final',3),
    (v_id,6,'Escalado em um ministério',1),(v_id,6,'Acompanhamento do líder',2),(v_id,6,'Discipulando outra pessoa',3);

  insert into convites (igreja_id, email, perfil)
  values (v_id, lower(trim(p_email_pastor)), 'pastor');

  return v_id;
end $$;

-- Igrejas que já existem recebem os novos ministérios
insert into public.ministerios (igreja_id, nome)
select i.id, n from public.igrejas i
cross join unnest(array['Grupos familiares (células)','Ministério de jovens','Ministério de casais',
                        'Ministério de homens','Ministério de mulheres']) n
on conflict (igreja_id, nome) do nothing;

-- Permissões das funções novas
revoke execute on function public.lidera_ministerio(uuid, uuid) from public, anon;
grant execute on function public.lidera_ministerio(uuid, uuid) to authenticated;
revoke execute on function public.perfis_lideranca() from public, anon;
grant execute on function public.perfis_lideranca() to authenticated;
