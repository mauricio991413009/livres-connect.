-- =====================================================================
-- Livres Connect · migração 0016 · Relatórios avançados
--
-- Funções que somam os números da igreja para os relatórios. Elas
-- devolvem só totais (sem dados pessoais), exceto o relatório de
-- engajamento, que lista pessoas e por isso é restrito a quem já pode
-- ver todas as pessoas (pastor, pastora, presbitério e secretaria).
-- O relatório financeiro segue o mesmo acesso do financeiro.
-- =====================================================================

create or replace function public.ve_relatorio_pastoral(p_igreja uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select tem_perfil(p_igreja, '{pastor,presbiterio,secretaria}');
$$;
create or replace function public.ve_relatorio_financeiro(p_igreja uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select tem_perfil(p_igreja, '{pastor,presbiterio,tesouraria}');
$$;

-- ---------------------------------------------------------------------
-- Relatório pastoral de um período
-- ---------------------------------------------------------------------
create or replace function public.relatorio_pastoral(p_igreja uuid, p_inicio date, p_fim date)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb; i timestamptz := p_inicio::timestamptz; f timestamptz := (p_fim + 1)::timestamptz;
begin
  if not ve_relatorio_pastoral(p_igreja) then
    raise exception 'Seu perfil não tem acesso aos relatórios pastorais.';
  end if;
  if p_fim < p_inicio or p_fim - p_inicio > 400 then
    raise exception 'Período inválido.';
  end if;

  select jsonb_build_object(
    'pessoas', jsonb_build_object(
      'visitantes',        (select count(*) from pessoas where igreja_id = p_igreja and primeira_visita between p_inicio and p_fim),
      'visitantes_voltaram', (select count(*) from pessoas where igreja_id = p_igreja and primeira_visita between p_inicio and p_fim and visitas >= 2),
      'via_qr',            (select count(*) from pessoas where igreja_id = p_igreja and primeira_visita between p_inicio and p_fim and origem = 'qr'),
      'conversoes',        (select count(*) from pessoas where igreja_id = p_igreja and data_conversao between p_inicio and p_fim),
      'batismos',          (select count(*) from pessoas where igreja_id = p_igreja and data_batismo between p_inicio and p_fim),
      'novos_membros',     (select count(distinct pessoa_id) from jornada_etapas where igreja_id = p_igreja and etapa = 4 and data_inicio between p_inicio and p_fim),
      'avancos',           (select count(*) from (select e.criado_em, row_number() over (partition by e.pessoa_id order by e.criado_em) n
                                                 from jornada_etapas e where e.igreja_id = p_igreja) x
                            where x.n > 1 and x.criado_em >= i and x.criado_em < f),
      'membros_ativos',    (select count(*) from pessoas where igreja_id = p_igreja and etapa >= 4 and situacao = 'ativo'),
      'afastados',         (select count(*) from pessoas where igreja_id = p_igreja and situacao = 'afastado'),
      'etapas',            (select jsonb_agg(coalesce(c, 0) order by e) from generate_series(0, 6) e
                            left join (select etapa, count(*) c from pessoas where igreja_id = p_igreja and situacao = 'ativo' group by etapa) t on t.etapa = e),
      'contatos',          (select count(*) from contatos where igreja_id = p_igreja and data between p_inicio and p_fim),
      'pessoas_contatadas', (select count(distinct pessoa_id) from contatos where igreja_id = p_igreja and data between p_inicio and p_fim)),
    'estudos', jsonb_build_object(
      'alunos_novos',      (select count(*) from estudos_alunos where igreja_id = p_igreja and criado_em >= i and criado_em < f),
      'licoes_concluidas', (select count(*) from estudos_concluidos where igreja_id = p_igreja and concluido_em >= i and concluido_em < f),
      'concluiram_todos',  (select count(*) from (select aluno_id, max(concluido_em) m from estudos_concluidos where igreja_id = p_igreja
                            group by aluno_id having count(*) >= 10) x where x.m >= i and x.m < f)),
    'discipulado', jsonb_build_object(
      'iniciados',  (select count(*) from discipulados where igreja_id = p_igreja and inicio between p_inicio and p_fim),
      'concluidos', (select count(*) from discipulados where igreja_id = p_igreja and concluido_em between p_inicio and p_fim),
      'encontros',  (select count(*) from discipulado_encontros where igreja_id = p_igreja and data between p_inicio and p_fim),
      'ativos',     (select count(*) from discipulados where igreja_id = p_igreja and status = 'ativo')),
    'escola', jsonb_build_object(
      'aulas',      (select count(*) from escola_aulas where igreja_id = p_igreja and data between p_inicio and p_fim),
      'presenca',   (select round(100.0 * count(*) filter (where p.presente) / nullif(count(*), 0))
                     from escola_presencas p join escola_aulas a on a.id = p.aula_id
                     where a.igreja_id = p_igreja and a.data between p_inicio and p_fim),
      'aprovados',  (select count(*) from escola_alunos where igreja_id = p_igreja and situacao = 'aprovado' and concluido_em between p_inicio and p_fim),
      'cursando',   (select count(*) from escola_alunos where igreja_id = p_igreja and situacao = 'cursando')),
    'cuidado', jsonb_build_object(
      'pedidos',     (select count(*) from pedidos_oracao where igreja_id = p_igreja and criado_em >= i and criado_em < f),
      'respondidos', (select count(*) from pedidos_oracao where igreja_id = p_igreja and status = 'respondido' and atualizado_em >= i and atualizado_em < f),
      'oracoes',     (select coalesce(sum(oracoes), 0) from pedidos_oracao where igreja_id = p_igreja and criado_em >= i and criado_em < f),
      'atendimentos_pedidos',    (select count(*) from atendimentos where igreja_id = p_igreja and criado_em >= i and criado_em < f),
      'atendimentos_realizados', (select count(*) from atendimentos where igreja_id = p_igreja and status = 'realizado' and atualizado_em >= i and atualizado_em < f)),
    'servico', jsonb_build_object(
      'eventos',     (select count(*) from eventos where igreja_id = p_igreja and data between p_inicio and p_fim),
      'escalas',     (select count(*) from escalas s join eventos e on e.id = s.evento_id where s.igreja_id = p_igreja and e.data between p_inicio and p_fim),
      'confirmadas', (select count(*) from escalas s join eventos e on e.id = s.evento_id where s.igreja_id = p_igreja and e.data between p_inicio and p_fim and s.status = 'confirmado'),
      'recusadas',   (select count(*) from escalas s join eventos e on e.id = s.evento_id where s.igreja_id = p_igreja and e.data between p_inicio and p_fim and s.status = 'recusado'),
      'voluntarios', (select count(distinct s.pessoa_id) from escalas s join eventos e on e.id = s.evento_id where s.igreja_id = p_igreja and e.data between p_inicio and p_fim),
      'comunicados', (select count(*) from comunicados where igreja_id = p_igreja and criado_em >= i and criado_em < f),
      'mensagens',   (select count(*) from comunicado_envios where igreja_id = p_igreja and enviado_em >= i and enviado_em < f),
      'portal_ativos', (select count(*) from portal_acessos where igreja_id = p_igreja and ultimo_acesso >= i and ultimo_acesso < f))
  ) into r;
  return r;
end $$;

-- ---------------------------------------------------------------------
-- Números mês a mês de um ano (para os gráficos e o relatório anual)
-- ---------------------------------------------------------------------
create or replace function public.relatorio_serie(p_igreja uuid, p_ano integer)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_pas boolean := ve_relatorio_pastoral(p_igreja); v_fin boolean := ve_relatorio_financeiro(p_igreja);
begin
  if not (v_pas or v_fin) then
    raise exception 'Seu perfil não tem acesso aos relatórios.';
  end if;
  return (select jsonb_agg(jsonb_build_object(
      'mes', m,
      'visitantes',    case when v_pas then (select count(*) from pessoas where igreja_id = p_igreja and extract(year from primeira_visita) = p_ano and extract(month from primeira_visita) = m) end,
      'conversoes',    case when v_pas then (select count(*) from pessoas where igreja_id = p_igreja and extract(year from data_conversao) = p_ano and extract(month from data_conversao) = m) end,
      'batismos',      case when v_pas then (select count(*) from pessoas where igreja_id = p_igreja and extract(year from data_batismo) = p_ano and extract(month from data_batismo) = m) end,
      'novos_membros', case when v_pas then (select count(distinct pessoa_id) from jornada_etapas where igreja_id = p_igreja and etapa = 4 and extract(year from data_inicio) = p_ano and extract(month from data_inicio) = m) end,
      'entradas',      case when v_fin then (select coalesce(sum(valor_centavos), 0) from lancamentos where igreja_id = p_igreja and tipo = 'entrada'
                          and (pago_em is not null or vencimento is null) and extract(year from data) = p_ano and extract(month from data) = m) end,
      'saidas',        case when v_fin then (select coalesce(sum(valor_centavos), 0) from lancamentos where igreja_id = p_igreja and tipo = 'saida'
                          and (pago_em is not null or vencimento is null) and extract(year from data) = p_ano and extract(month from data) = m) end
    ) order by m) from generate_series(1, 12) m);
end $$;

-- ---------------------------------------------------------------------
-- Prestação de contas financeira de um período
-- ---------------------------------------------------------------------
create or replace function public.relatorio_financeiro(p_igreja uuid, p_inicio date, p_fim date)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not ve_relatorio_financeiro(p_igreja) then
    raise exception 'Seu perfil não tem acesso ao financeiro.';
  end if;
  if p_fim < p_inicio or p_fim - p_inicio > 400 then
    raise exception 'Período inválido.';
  end if;
  with realizados as (
    select l.*, c.nome categoria from lancamentos l join categorias_financeiras c on c.id = l.categoria_id
    where l.igreja_id = p_igreja and (l.pago_em is not null or l.vencimento is null) and l.data between p_inicio and p_fim)
  select jsonb_build_object(
    'entradas', (select coalesce(sum(valor_centavos), 0) from realizados where tipo = 'entrada'),
    'saidas',   (select coalesce(sum(valor_centavos), 0) from realizados where tipo = 'saida'),
    'lancamentos', (select count(*) from realizados),
    'sem_comprovante', (select count(*) from realizados where tipo = 'saida' and comprovante_url is null),
    'por_categoria', coalesce((select jsonb_agg(jsonb_build_object('tipo', tipo, 'categoria', categoria, 'total', total, 'qtd', qtd) order by tipo, total desc)
                      from (select tipo, categoria, sum(valor_centavos) total, count(*) qtd from realizados group by tipo, categoria) x), '[]'),
    'por_forma', coalesce((select jsonb_agg(jsonb_build_object('forma', coalesce(forma, 'nao_informada'), 'total', total) order by total desc)
                      from (select forma, sum(valor_centavos) total from realizados where tipo = 'entrada' group by forma) x), '[]'),
    'a_receber', (select coalesce(sum(valor_centavos), 0) from lancamentos where igreja_id = p_igreja and tipo = 'entrada' and pago_em is null and vencimento is not null),
    'a_pagar',   (select coalesce(sum(valor_centavos), 0) from lancamentos where igreja_id = p_igreja and tipo = 'saida' and pago_em is null and vencimento is not null),
    'vencidas',  (select coalesce(sum(valor_centavos), 0) from lancamentos where igreja_id = p_igreja and tipo = 'saida' and pago_em is null and vencimento < current_date),
    'campanhas', coalesce((select jsonb_agg(jsonb_build_object('nome', cp.nome, 'meta', cp.meta_centavos,
                      'arrecadado', (select coalesce(sum(valor_centavos), 0) from lancamentos l where l.campanha_id = cp.id and l.tipo = 'entrada' and (l.pago_em is not null or l.vencimento is null)),
                      'gasto', (select coalesce(sum(valor_centavos), 0) from lancamentos l where l.campanha_id = cp.id and l.tipo = 'saida' and (l.pago_em is not null or l.vencimento is null)))
                      order by cp.inicio desc nulls last) from campanhas cp where cp.igreja_id = p_igreja), '[]')
  ) into r;
  return r;
end $$;

-- ---------------------------------------------------------------------
-- Engajamento: quem está se afastando, quem serve, quem nunca serviu
-- (lista pessoas: só para quem já pode ver todas as pessoas)
-- ---------------------------------------------------------------------
create or replace function public.relatorio_engajamento(p_igreja uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not ve_relatorio_pastoral(p_igreja) then
    raise exception 'Seu perfil não tem acesso a este relatório.';
  end if;
  with ultimo as (select pessoa_id, max(data) d from contatos where igreja_id = p_igreja group by pessoa_id),
  esc as (select s.pessoa_id, s.status, s.ministerio_id from escalas s join eventos e on e.id = s.evento_id
          where s.igreja_id = p_igreja and e.data between current_date - 90 and current_date + 30)
  select jsonb_build_object(
    'sem_contato', coalesce((select jsonb_agg(x order by (x->>'dias')::int desc nulls first) from (
        select jsonb_build_object('id', p.id, 'nome', p.nome, 'telefone', p.telefone, 'etapa', p.etapa,
               'dias', current_date - coalesce(u.d, p.primeira_visita), 'responsavel', (select coalesce(nullif(us.nome, ''), us.email) from usuarios us where us.id = p.responsavel_id)) x
        from pessoas p left join ultimo u on u.pessoa_id = p.id
        where p.igreja_id = p_igreja and p.situacao = 'ativo' and p.etapa >= 4
          and current_date - coalesce(u.d, p.primeira_visita) > 45
        order by coalesce(u.d, p.primeira_visita) limit 40) t), '[]'),
    'afastados', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'nome', p.nome, 'telefone', p.telefone,
               'ultimo_contato', u.d) order by p.nome) from pessoas p left join ultimo u on u.pessoa_id = p.id
               where p.igreja_id = p_igreja and p.situacao = 'afastado'), '[]'),
    'nunca_serviram', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'nome', p.nome, 'telefone', p.telefone,
               'ministerio', (select nome from ministerios where id = p.ministerio_id)) order by p.nome)
               from pessoas p where p.igreja_id = p_igreja and p.situacao = 'ativo' and p.etapa >= 4
                 and not exists (select 1 from escalas s where s.pessoa_id = p.id)), '[]'),
    'por_ministerio', coalesce((select jsonb_agg(jsonb_build_object('ministerio', m.nome, 'total', t.total, 'confirmadas', t.conf,
               'recusadas', t.rec, 'pendentes', t.pend, 'voluntarios', t.vol) order by t.total desc)
               from (select ministerio_id, count(*) total, count(*) filter (where status = 'confirmado') conf,
                            count(*) filter (where status = 'recusado') rec, count(*) filter (where status = 'pendente') pend,
                            count(distinct pessoa_id) vol from esc group by ministerio_id) t
               join ministerios m on m.id = t.ministerio_id), '[]'),
    'mais_escalados', coalesce((select jsonb_agg(jsonb_build_object('nome', p.nome, 'vezes', t.n) order by t.n desc) from (
               select pessoa_id, count(*) n from esc group by pessoa_id order by count(*) desc limit 8) t join pessoas p on p.id = t.pessoa_id), '[]'),
    'muitas_recusas', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'nome', p.nome, 'telefone', p.telefone, 'recusas', t.n) order by t.n desc) from (
               select pessoa_id, count(*) n from esc where status = 'recusado' group by pessoa_id having count(*) >= 3) t join pessoas p on p.id = t.pessoa_id), '[]'),
    'novos_sem_discipulado', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'nome', p.nome, 'telefone', p.telefone,
               'dias', current_date - coalesce(p.data_conversao, p.primeira_visita)) order by p.data_conversao)
               from pessoas p where p.igreja_id = p_igreja and p.situacao = 'ativo' and p.etapa = 1
                 and current_date - coalesce(p.data_conversao, p.primeira_visita) > 14
                 and not exists (select 1 from discipulados d where d.discipulo_id = p.id and d.status = 'ativo')), '[]'),
    'escola_baixa_frequencia', coalesce((select jsonb_agg(x order by (x->>'frequencia')::int) from (
               select jsonb_build_object('id', p.id, 'nome', p.nome, 'telefone', p.telefone, 'turma', t.nome,
                      'frequencia', round(100.0 * count(*) filter (where pr.presente) / count(*)), 'minimo', t.frequencia_minima) x
               from escola_alunos a join escola_turmas t on t.id = a.turma_id join pessoas p on p.id = a.pessoa_id
               join escola_presencas pr on pr.aluno_id = a.id
               where a.igreja_id = p_igreja and a.situacao = 'cursando'
               group by p.id, p.nome, p.telefone, t.nome, t.frequencia_minima
               having 100.0 * count(*) filter (where pr.presente) / count(*) < t.frequencia_minima) z), '[]')
  ) into r;
  return r;
end $$;

revoke execute on function public.ve_relatorio_pastoral(uuid), public.ve_relatorio_financeiro(uuid),
  public.relatorio_pastoral(uuid, date, date), public.relatorio_serie(uuid, integer),
  public.relatorio_financeiro(uuid, date, date), public.relatorio_engajamento(uuid) from public, anon;
grant execute on function public.ve_relatorio_pastoral(uuid), public.ve_relatorio_financeiro(uuid),
  public.relatorio_pastoral(uuid, date, date), public.relatorio_serie(uuid, integer),
  public.relatorio_financeiro(uuid, date, date), public.relatorio_engajamento(uuid) to authenticated;
