// Livres Connect · Relatórios avançados
// Pastoral do mês (com resumo escrito automaticamente e comparação com o mês
// anterior), prestação de contas financeira, engajamento (quem está se
// afastando, quem serve) e relatório anual para a assembleia. Tudo pode ser
// impresso. Os números vêm de funções do banco que conferem o perfil.
import { linkWhats, fmtTel, abrirFicha } from './pessoas.js';

let C;
export function instalar(ctx) { C = ctx; }

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MES3 = MESES.map(m => m.slice(0, 3));
const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const dinheiro = c => ((c || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dinheiroCurto = c => { const v = (c || 0) / 100; return Math.abs(v) >= 1000 ? 'R$ ' + (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil' : dinheiro(c); };
const num = n => (n || 0).toLocaleString('pt-BR');
const plural = (n, s, p) => `${num(n)} ${n === 1 ? s : p}`;
const ETAPAS = () => C.ETAPAS;
const FORMAS = { dinheiro: 'Dinheiro', pix: 'Pix', cartao: 'Cartão', transferencia: 'Transferência', boleto: 'Boleto', outro: 'Outro', nao_informada: 'Não informada' };

const vePastoral = () => C.pode(['pastor', 'presbiterio', 'secretaria']);
const veFinanceiro = () => C.pode(['pastor', 'presbiterio', 'tesouraria']);
let aba = null, mesSel = null, anoSel = null;

// Período de um mês ("2026-10"); o mês corrente vai só até hoje
function periodo(mes) {
  const [y, m] = mes.split('-').map(Number);
  const ini = new Date(y, m - 1, 1), fim = new Date(y, m, 0), hoje = new Date();
  return { ini: iso(ini), fim: iso(fim < hoje ? fim : hoje), y, m, nome: MESES[m - 1] + ' de ' + y };
}
const mesAnterior = mes => { const [y, m] = mes.split('-').map(Number); const d = new Date(y, m - 2, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); };

/* ------------------------------------------------------------------ */
/* pequenos componentes                                                */
/* ------------------------------------------------------------------ */
// Diferença em relação ao período anterior: seta + texto (nunca só cor)
function delta(atual, antes, rotulo = 'mês anterior', dinheiroFmt = false, menosEhBom = false) {
  if (antes == null) return '';
  const d = (atual || 0) - (antes || 0);
  if (d === 0) return `<span class="delta igual">= igual ao ${rotulo}</span>`;
  const txt = dinheiroFmt ? dinheiro(Math.abs(d)) : num(Math.abs(d));
  return `<span class="delta ${(d > 0) !== menosEhBom ? 'sobe' : 'desce'}">${d > 0 ? '▲' : '▼'} ${txt} ${d > 0 ? 'a mais' : 'a menos'} que no ${rotulo}</span>`;
}
const kpi = (rotulo, valor, sub) => `<div class="kpi"><span class="l">${rotulo}</span><span class="v">${valor}</span><span class="s">${sub || ''}</span></div>`;

// Gráfico de barras em SVG (1 ou 2 séries), com dica ao passar o mouse
let idGraf = 0;
function barras({ rotulos, series, formato = num, titulo, W = 720, H = 220 }) {
  const id = 'g' + (++idGraf), L = 52, R = 10, T = 12, B = 28;
  const max = Math.max(1, ...series.flatMap(s => s.valores));
  const passo = (() => { const bruto = max / 4, mag = Math.pow(10, Math.floor(Math.log10(bruto))); const n = bruto / mag; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag; })();
  const topo = Math.ceil(max / passo) * passo, y = v => T + (H - T - B) * (1 - v / topo);
  const larg = (W - L - R) / rotulos.length, gap = 2, bw = Math.max(4, (larg * 0.7 - gap * (series.length - 1)) / series.length);
  let g = '';
  for (let v = 0; v <= topo + 1e-9; v += passo) g += `<line class="grade" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="eixo" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${formato === num ? num(v) : dinheiroCurto(v)}</text>`;
  const barra = (x, v, cls) => { const h = Math.max(0, y(0) - y(v)); if (!h) return ''; const r = Math.min(4, h, bw / 2);
    return `<path class="${cls}" d="M${x} ${y(0)}V${y(v) + r}Q${x} ${y(v)} ${x + r} ${y(v)}H${x + bw - r}Q${x + bw} ${y(v)} ${x + bw} ${y(v) + r}V${y(0)}Z"/>`; };
  const corpo = rotulos.map((r, i) => { const x0 = L + larg * i + (larg - (bw * series.length + gap * (series.length - 1))) / 2;
    return `<g class="col" data-i="${i}"><rect class="alvo" x="${L + larg * i}" y="${T}" width="${larg}" height="${H - T - B}"/>${series.map((s, k) => barra(x0 + k * (bw + gap), s.valores[i], 'serie' + (k + 1))).join('')}
      <text class="eixo" x="${L + larg * i + larg / 2}" y="${H - 9}" text-anchor="middle">${r}</text></g>`; }).join('');
  const dados = JSON.stringify({ rotulos, series: series.map(s => ({ nome: s.nome, valores: s.valores })), dinheiro: formato !== num });
  return `<figure class="grafico" id="${id}" data-dados='${dados.replace(/'/g, '&#39;')}'>${titulo ? `<figcaption>${titulo}</figcaption>` : ''}
    ${series.length > 1 ? `<div class="legenda">${series.map((s, k) => `<span><i class="serie${k + 1}"></i>${C.esc(s.nome)}</span>`).join('')}</div>` : ''}
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${C.esc(titulo || 'Gráfico')}">${g}<line class="base" x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"/>${corpo}</svg>
    <div class="dica" hidden></div></figure>`;
}
function ligarGraficos(el) {
  el.querySelectorAll('figure.grafico').forEach(f => {
    const d = JSON.parse(f.dataset.dados), dica = f.querySelector('.dica'), fmt = v => d.dinheiro ? dinheiro(v) : num(v);
    f.querySelectorAll('g.col').forEach(g => {
      g.onmouseenter = g.onclick = () => {
        const i = +g.dataset.i;
        f.querySelectorAll('g.col').forEach(x => x.classList.toggle('ativa', x === g));
        dica.innerHTML = `<b>${C.esc(d.rotulos[i])}</b>${d.series.map((s, k) => `<span><i class="serie${k + 1}"></i>${C.esc(s.nome)}: <b>${fmt(s.valores[i])}</b></span>`).join('')}`;
        const r = g.querySelector('.alvo').getBoundingClientRect(), fr = f.getBoundingClientRect();
        dica.hidden = false;
        dica.style.left = Math.min(fr.width - dica.offsetWidth - 4, Math.max(4, r.left - fr.left + r.width / 2 - dica.offsetWidth / 2)) + 'px';
      };
    });
    f.onmouseleave = () => { dica.hidden = true; f.querySelectorAll('g.col').forEach(x => x.classList.remove('ativa')); };
  });
}
// Barras horizontais simples (participação de cada parte no total)
const partes = (itens, fmt = num) => { const max = Math.max(1, ...itens.map(i => i[1]));
  return `<div class="partes">${itens.map(([n, v, extra]) => `<div class="parte"><span class="n">${C.esc(n)}</span><span class="trilho"><span style="width:${v / max * 100}%"></span></span><span class="v num">${fmt(v)}${extra ? ' <small class="muted">' + extra + '</small>' : ''}</span></div>`).join('')}</div>`; };
const linkW = (tel, nome, msg) => { const w = linkWhats(tel, msg || `Olá, ${(nome || '').split(' ')[0]}! Aqui é da ${C.igrejaAtual().nome}. `); return w ? `<a class="btn sm whats" href="${C.esc(w)}" target="_blank" rel="noopener">WhatsApp</a>` : ''; };

/* ------------------------------------------------------------------ */
/* resumo escrito automaticamente (sem IA, por regras)                 */
/* ------------------------------------------------------------------ */
// ant = { em: 'em setembro de 2026', de: 'de setembro de 2026' }
function comparar(a, b, ant) {
  if (b == null) return '';
  const d = a - b;
  return d === 0 ? ` (o mesmo número ${ant.de})` : ` (${num(Math.abs(d))} a ${d > 0 ? 'mais' : 'menos'} que ${ant.em})`;
}
function resumoPastoral(r, a, quando, nomeAnt) {
  const p = r.pessoas, q = a && a.pessoas, frases = [];
  frases.push(`${quando}, a igreja recebeu ${plural(p.visitantes, 'visitante', 'visitantes')}${comparar(p.visitantes, q && q.visitantes, nomeAnt)}` +
    (p.visitantes ? `; ${plural(p.visitantes_voltaram, 'voltou', 'voltaram')} pelo menos mais uma vez${p.via_qr ? ` e ${num(p.via_qr)} ${p.via_qr === 1 ? 'chegou' : 'chegaram'} pelo QR Code` : ''}.` : '.'));
  const vidas = [];
  if (p.conversoes) vidas.push(plural(p.conversoes, 'conversão', 'conversões'));
  if (p.batismos) vidas.push(plural(p.batismos, 'batismo', 'batismos'));
  if (p.novos_membros) vidas.push(plural(p.novos_membros, 'novo membro', 'novos membros'));
  frases.push(vidas.length ? `Glória a Deus por ${vidas.join(', ').replace(/, ([^,]*)$/, ' e $1')}${comparar(p.conversoes, q && q.conversoes, nomeAnt).replace('(', '(nas conversões, ')}.` : 'Não houve conversões nem batismos registrados no período.');
  frases.push(`Na Jornada da Alma, houve ${plural(p.avancos, 'passo de etapa', 'passos de etapa')}, e a equipe registrou ${plural(p.contatos, 'contato', 'contatos')} com ${plural(p.pessoas_contatadas, 'pessoa', 'pessoas')}.`);
  const d = r.discipulado, e = r.estudos;
  const crescer = [];
  if (e.licoes_concluidas) crescer.push(`${plural(e.licoes_concluidas, 'estudo concluído', 'estudos concluídos')} pelos novos convertidos${e.concluiram_todos ? ` (${plural(e.concluiram_todos, 'pessoa terminou', 'pessoas terminaram')} os 10)` : ''}`);
  if (d.encontros) crescer.push(`${plural(d.encontros, 'encontro', 'encontros')} de discipulado`);
  if (r.escola.aulas) crescer.push(`${plural(r.escola.aulas, 'aula', 'aulas')} na Escola de Obreiros${r.escola.presenca != null ? ` com ${r.escola.presenca}% de presença` : ''}`);
  if (crescer.length) frases.push('No crescimento, foram ' + crescer.join(', ').replace(/, ([^,]*)$/, ' e $1') + '.');
  if (r.cuidado.pedidos || r.cuidado.atendimentos_realizados) frases.push(`Recebemos ${plural(r.cuidado.pedidos, 'pedido de oração', 'pedidos de oração')}${r.cuidado.respondidos ? ` e celebramos ${plural(r.cuidado.respondidos, 'resposta', 'respostas')}` : ''}${r.cuidado.atendimentos_realizados ? `; foram realizados ${plural(r.cuidado.atendimentos_realizados, 'atendimento pastoral', 'atendimentos pastorais')}` : ''}.`);
  const s = r.servico;
  if (s.escalas) frases.push(`${plural(s.voluntarios, 'voluntário serviu', 'voluntários serviram')} em ${plural(s.escalas, 'escala', 'escalas')}, com ${Math.round(s.confirmadas / s.escalas * 100)}% de confirmação.`);
  const alerta = [];
  if (p.afastados) alerta.push(`${plural(p.afastados, 'pessoa está afastada', 'pessoas estão afastadas')}`);
  if (q && p.visitantes < q.visitantes) alerta.push('o número de visitantes caiu');
  if (p.visitantes && p.visitantes_voltaram / p.visitantes < 0.3) alerta.push('poucos visitantes voltaram');
  if (alerta.length) frases.push('Pontos de atenção: ' + alerta.join('; ') + '.');
  return frases;
}

/* ------------------------------------------------------------------ */
/* tela                                                                */
/* ------------------------------------------------------------------ */
export async function telaRelatorios(main) {
  const abas = [vePastoral() && ['pastoral', 'Pastoral do mês'], veFinanceiro() && ['financeiro', 'Prestação de contas'], vePastoral() && ['engajamento', 'Engajamento'], ['anual', 'Relatório anual']].filter(Boolean);
  if (!aba || !abas.some(a => a[0] === aba)) aba = abas[0][0];
  const hoje = new Date();
  mesSel = mesSel || hoje.getFullYear() + '-' + pad(hoje.getMonth() + 1);
  anoSel = anoSel || hoje.getFullYear();
  main.innerHTML = C.cab('Relatórios', 'Números da igreja para acompanhar, decidir e prestar contas. Tudo pode ser impresso ou salvo em PDF.') +
    `<div class="rel-barra"><div class="chips">${abas.map(([k, l]) => `<button class="chip ${aba === k ? 'on' : ''}" data-aba="${k}">${l}</button>`).join('')}</div>
      <div class="rel-ctl">${aba === 'anual' ? `<label>Ano <select id="r-ano">${[0, 1, 2].map(k => hoje.getFullYear() - k).map(a => `<option ${a === anoSel ? 'selected' : ''}>${a}</option>`).join('')}</select></label>`
        : aba === 'engajamento' ? '' : `<label>Mês <input type="month" id="r-mes" value="${mesSel}" max="${hoje.getFullYear() + '-' + pad(hoje.getMonth() + 1)}"></label>`}
      <button class="btn" data-imprimir>Imprimir</button></div></div>
    <div id="relatorio"><div class="carregando">Calculando…</div></div>`;
  main.onclick = e => {
    const a = e.target.closest('[data-aba]'); if (a) { aba = a.dataset.aba; return telaRelatorios(main); }
    if (e.target.closest('[data-imprimir]')) return window.print();
    const fi = e.target.closest('[data-ficha]'); if (fi) return abrirFicha(fi.dataset.ficha, () => {});
  };
  main.onchange = e => {
    if (e.target.id === 'r-mes' && e.target.value) { mesSel = e.target.value; telaRelatorios(main); }
    if (e.target.id === 'r-ano') { anoSel = +e.target.value; telaRelatorios(main); }
  };
  const el = document.getElementById('relatorio');
  try {
    if (aba === 'pastoral') await pastoral(el);
    else if (aba === 'financeiro') await financeiro(el);
    else if (aba === 'engajamento') await engajamento(el);
    else await anual(el);
    ligarGraficos(el);
  } catch (er) { el.innerHTML = `<div class="erro">${C.esc(C.traduzErro(er))}</div>`; }
}
const rpc = async (fn, args) => { const { data, error } = await C.sb.rpc(fn, args); if (error) throw error; return data; };
const cabImpressao = (titulo, sub) => `<div class="rel-cab"><div class="igreja">${C.esc(C.igrejaAtual().nome)}</div><h2>${titulo}</h2><p>${sub}</p></div>`;

/* ---------------------------- pastoral ---------------------------- */
async function pastoral(el) {
  const P = periodo(mesSel), A = periodo(mesAnterior(mesSel)), ig = C.S.igrejaId;
  const [r, a, serie] = await Promise.all([
    rpc('relatorio_pastoral', { p_igreja: ig, p_inicio: P.ini, p_fim: P.fim }),
    rpc('relatorio_pastoral', { p_igreja: ig, p_inicio: A.ini, p_fim: A.fim }),
    rpc('relatorio_serie', { p_igreja: ig, p_ano: P.y })
  ]);
  const p = r.pessoas, q = a.pessoas, ant = 'mês anterior';
  const s = r.servico, et = p.etapas || [];
  el.innerHTML = cabImpressao('Relatório pastoral', P.nome.charAt(0).toUpperCase() + P.nome.slice(1)) + `
    <section class="panel resumo-escrito"><h2>Resumo do mês</h2>${resumoPastoral(r, a, 'Em ' + P.nome, { em: 'em ' + A.nome, de: 'de ' + A.nome }).map(f => `<p>${C.esc(f)}</p>`).join('')}
      <p class="muted" style="font-size:12.5px;margin:6px 0 0">Texto montado automaticamente a partir dos números do sistema.</p></section>
    <div class="kpis">
      ${kpi('Visitantes', num(p.visitantes), delta(p.visitantes, q.visitantes, ant))}
      ${kpi('Voltaram', num(p.visitantes_voltaram), p.visitantes ? Math.round(p.visitantes_voltaram / p.visitantes * 100) + '% dos visitantes' : '')}
      ${kpi('Conversões', num(p.conversoes), delta(p.conversoes, q.conversoes, ant))}
      ${kpi('Batismos', num(p.batismos), delta(p.batismos, q.batismos, ant))}
      ${kpi('Novos membros', num(p.novos_membros), delta(p.novos_membros, q.novos_membros, ant))}
      ${kpi('Contatos feitos', num(p.contatos), `com ${plural(p.pessoas_contatadas, 'pessoa', 'pessoas')}`)}</div>
    <div class="grid">
      <section class="panel c6"><h2>Visitantes por mês em ${P.y}</h2>${barras({ rotulos: MES3, series: [{ nome: 'Visitantes', valores: serie.map(x => x.visitantes || 0) }], titulo: '', W: 420, H: 230 })}</section>
      <section class="panel c6"><h2>Jornada da Alma hoje</h2>${partes(ETAPAS().map((n, i) => [n, et[i] || 0]))}
        <p class="muted" style="font-size:13px;margin:10px 0 0">${plural(p.membros_ativos, 'membro ativo', 'membros ativos')} · ${plural(p.afastados, 'afastado', 'afastados')} · ${plural(p.avancos, 'avanço de etapa', 'avanços de etapa')} no mês</p></section>
      <section class="panel c6"><h2>Crescimento</h2><div class="lista">
        <div class="linha"><span class="cresce">Estudos do novo convertido concluídos</span><b class="num">${num(r.estudos.licoes_concluidas)}</b></div>
        <div class="linha"><span class="cresce">Pessoas que terminaram os 10 estudos</span><b class="num">${num(r.estudos.concluiram_todos)}</b></div>
        <div class="linha"><span class="cresce">Novos alunos nos estudos</span><b class="num">${num(r.estudos.alunos_novos)}</b></div>
        <div class="linha"><span class="cresce">Discipulados iniciados · concluídos</span><b class="num">${num(r.discipulado.iniciados)} · ${num(r.discipulado.concluidos)}</b></div>
        <div class="linha"><span class="cresce">Encontros de discipulado</span><b class="num">${num(r.discipulado.encontros)}</b></div>
        <div class="linha"><span class="cresce">Discipulados em andamento</span><b class="num">${num(r.discipulado.ativos)}</b></div>
        <div class="linha"><span class="cresce">Aulas da Escola de Obreiros · presença</span><b class="num">${num(r.escola.aulas)} · ${r.escola.presenca != null ? r.escola.presenca + '%' : '—'}</b></div>
        <div class="linha"><span class="cresce">Aprovados na Escola · cursando</span><b class="num">${num(r.escola.aprovados)} · ${num(r.escola.cursando)}</b></div></div></section>
      <section class="panel c6"><h2>Cuidado e serviço</h2><div class="lista">
        <div class="linha"><span class="cresce">Pedidos de oração recebidos</span><b class="num">${num(r.cuidado.pedidos)}</b></div>
        <div class="linha"><span class="cresce">Orações registradas · respostas</span><b class="num">${num(r.cuidado.oracoes)} · ${num(r.cuidado.respondidos)}</b></div>
        <div class="linha"><span class="cresce">Atendimentos pedidos · realizados</span><b class="num">${num(r.cuidado.atendimentos_pedidos)} · ${num(r.cuidado.atendimentos_realizados)}</b></div>
        <div class="linha"><span class="cresce">Eventos na agenda</span><b class="num">${num(s.eventos)}</b></div>
        <div class="linha"><span class="cresce">Escalas · confirmadas · recusadas</span><b class="num">${num(s.escalas)} · ${num(s.confirmadas)} · ${num(s.recusadas)}</b></div>
        <div class="linha"><span class="cresce">Voluntários que serviram</span><b class="num">${num(s.voluntarios)}</b></div>
        <div class="linha"><span class="cresce">Comunicados · mensagens enviadas</span><b class="num">${num(s.comunicados)} · ${num(s.mensagens)}</b></div>
        <div class="linha"><span class="cresce">Membros que usaram o Portal</span><b class="num">${num(s.portal_ativos)}</b></div></div></section>
    </div>
    <p class="assin">Emitido em ${new Date().toLocaleString('pt-BR')} pelo Livres Connect.</p>`;
}

/* ---------------------------- financeiro ---------------------------- */
async function financeiro(el) {
  const P = periodo(mesSel), A = periodo(mesAnterior(mesSel)), ig = C.S.igrejaId;
  const [r, a, serie] = await Promise.all([
    rpc('relatorio_financeiro', { p_igreja: ig, p_inicio: P.ini, p_fim: P.fim }),
    rpc('relatorio_financeiro', { p_igreja: ig, p_inicio: A.ini, p_fim: A.fim }),
    rpc('relatorio_serie', { p_igreja: ig, p_ano: P.y })
  ]);
  const saldo = r.entradas - r.saidas, saldoA = a.entradas - a.saidas;
  const cats = t => (r.por_categoria || []).filter(c => c.tipo === t);
  const totalE = r.entradas || 1, totalS = r.saidas || 1;
  el.innerHTML = cabImpressao('Prestação de contas', P.nome.charAt(0).toUpperCase() + P.nome.slice(1)) + `
    <div class="kpis">
      ${kpi('Entradas', dinheiro(r.entradas), delta(r.entradas, a.entradas, 'mês anterior', true))}
      ${kpi('Saídas', dinheiro(r.saidas), delta(r.saidas, a.saidas, 'mês anterior', true, true))}
      ${kpi('Saldo do mês', `<span class="${saldo >= 0 ? 'positivo' : 'negativo'}">${saldo < 0 ? '−' : ''}${dinheiro(Math.abs(saldo))}</span>`, `mês anterior: ${saldoA < 0 ? '−' : ''}${dinheiro(Math.abs(saldoA))}`)}
      ${kpi('Contas em aberto', dinheiro(r.a_pagar), `${r.vencidas ? '⚠ ' + dinheiro(r.vencidas) + ' vencidas · ' : ''}a receber ${dinheiro(r.a_receber)}`)}</div>
    <section class="panel"><h2>Entradas e saídas em ${P.y}</h2>
      ${barras({ rotulos: MES3, series: [{ nome: 'Entradas', valores: serie.map(x => x.entradas || 0) }, { nome: 'Saídas', valores: serie.map(x => x.saidas || 0) }], formato: dinheiro })}</section>
    <div class="grid">
      <section class="panel c6"><h2>Entradas por categoria</h2>${cats('entrada').length ? partes(cats('entrada').map(c => [c.categoria, c.total, Math.round(c.total / totalE * 100) + '%']), dinheiro) : '<div class="vazio">Nenhuma entrada no mês.</div>'}</section>
      <section class="panel c6"><h2>Saídas por categoria</h2>${cats('saida').length ? partes(cats('saida').map(c => [c.categoria, c.total, Math.round(c.total / totalS * 100) + '%']), dinheiro) : '<div class="vazio">Nenhuma saída no mês.</div>'}
        ${r.sem_comprovante ? `<p class="aviso ouro" style="margin:10px 0 0">${plural(r.sem_comprovante, 'saída está', 'saídas estão')} sem comprovante anexado.</p>` : ''}</section>
      <section class="panel c6"><h2>Como as entradas chegaram</h2>${(r.por_forma || []).length ? partes(r.por_forma.map(f => [FORMAS[f.forma] || f.forma, f.total]), dinheiro) : '<div class="vazio">Sem entradas.</div>'}</section>
      <section class="panel c6"><h2>Campanhas</h2>${(r.campanhas || []).length ? `<div class="lista">${r.campanhas.map(c => { const pc = c.meta ? Math.min(100, Math.round(c.arrecadado / c.meta * 100)) : null;
        return `<div class="linha" style="flex-wrap:wrap"><span class="cresce"><b style="font-weight:600">${C.esc(c.nome)}</b><small class="muted" style="display:block">arrecadado ${dinheiro(c.arrecadado)}${c.meta ? ' de ' + dinheiro(c.meta) : ''} · gasto ${dinheiro(c.gasto)}</small></span>${pc != null ? `<span class="num">${pc}%</span><div class="mini-prog" style="flex-basis:100%"><div style="width:${pc}%"></div></div>` : ''}</div>`; }).join('')}</div>` : '<div class="vazio">Nenhuma campanha cadastrada.</div>'}</section>
    </div>
    <div class="rel-assinaturas"><div><span></span>Tesouraria</div><div><span></span>Pastor presidente</div><div><span></span>Conselho fiscal</div></div>
    <p class="assin">${plural(r.lancamentos, 'lançamento realizado', 'lançamentos realizados')} no período. Emitido em ${new Date().toLocaleString('pt-BR')} pelo Livres Connect.</p>`;
}

/* ---------------------------- engajamento ---------------------------- */
async function engajamento(el) {
  const r = await rpc('relatorio_engajamento', { p_igreja: C.S.igrejaId });
  const lista = (itens, linha, vazio) => itens.length ? `<div class="lista">${itens.map(linha).join('')}</div>` : `<div class="vazio">${vazio}</div>`;
  const pessoa = (x, sub, msg) => `<div class="linha"><div class="cresce"><button class="lk" data-ficha="${x.id}">${C.esc(x.nome)}</button><small class="muted" style="display:block">${sub}</small></div>${linkW(x.telefone, x.nome, msg)}</div>`;
  const pm = r.por_ministerio || [];
  el.innerHTML = cabImpressao('Frequência e engajamento', 'Situação em ' + new Date().toLocaleDateString('pt-BR')) + `
    <div class="kpis">
      ${kpi('Membros sem contato', num(r.sem_contato.length), 'há mais de 45 dias')}
      ${kpi('Novos sem discipulado', num(r.novos_sem_discipulado.length), 'convertidos há mais de 14 dias')}
      ${kpi('Nunca serviram', num(r.nunca_serviram.length), 'membros nunca escalados')}
      ${kpi('Afastados', num(r.afastados.length), 'situação na ficha')}</div>
    <div class="grid">
      <section class="panel c6"><h2>Membros sem contato há mais de 45 dias</h2>${lista(r.sem_contato, x => pessoa(x, `${x.dias} dias sem contato · ${C.esc(x.responsavel || 'sem responsável')}`, `Olá, ${x.nome.split(' ')[0]}! Estamos com saudade de você na ${C.igrejaAtual().nome}. Como você está? Podemos orar por algo?`), 'Todos os membros tiveram contato recente. 🙌')}</section>
      <section class="panel c6"><h2>Novos convertidos sem discipulado</h2>${lista(r.novos_sem_discipulado, x => pessoa(x, `convertido há ${x.dias} dias`), 'Todos os novos convertidos estão em discipulado.')}
        <p class="muted" style="font-size:13px;margin:10px 0 0">Comece o discipulado pela ficha da pessoa ou no menu Discipulado.</p></section>
      <section class="panel c12"><h2>Escalas por ministério <small class="muted" style="font-weight:400;font-size:13px">últimos 90 dias e próximos 30</small></h2>
        ${pm.length ? `<div class="tw"><table><thead><tr><th>Ministério</th><th class="r">Escalas</th><th class="r">Voluntários</th><th class="r">Confirmadas</th><th class="r">Recusadas</th><th class="r">Pendentes</th><th>Confirmação</th></tr></thead><tbody>
          ${pm.map(m => { const pc = Math.round(m.confirmadas / m.total * 100); return `<tr><td>${C.esc(m.ministerio)}</td><td class="r num">${m.total}</td><td class="r num">${m.voluntarios}</td><td class="r num">${m.confirmadas}</td><td class="r num">${m.recusadas}</td><td class="r num">${m.pendentes}</td>
            <td style="min-width:140px"><div class="mini-prog"><div style="width:${pc}%"></div></div><small class="num">${pc}%</small></td></tr>`; }).join('')}</tbody></table></div>` : '<div class="vazio">Nenhuma escala no período.</div>'}</section>
      <section class="panel c6"><h2>Quem mais serviu</h2>${(r.mais_escalados || []).length ? partes(r.mais_escalados.map(x => [x.nome, x.vezes])) : '<div class="vazio">Sem escalas no período.</div>'}
        <p class="muted" style="font-size:13px;margin:10px 0 0">Cuide para não sobrecarregar sempre as mesmas pessoas.</p></section>
      <section class="panel c6"><h2>Membros que nunca foram escalados</h2>${lista(r.nunca_serviram.slice(0, 30), x => pessoa(x, x.ministerio ? 'ministério: ' + C.esc(x.ministerio) : 'sem ministério', `Olá, ${x.nome.split(' ')[0]}! Que tal servir com a gente? Temos um lugar para você em um dos ministérios da ${C.igrejaAtual().nome}.`), 'Todos os membros já serviram.')}
        ${r.nunca_serviram.length > 30 ? `<p class="muted" style="font-size:13px">e mais ${r.nunca_serviram.length - 30}.</p>` : ''}</section>
      <section class="panel c6"><h2>Escola: frequência abaixo do mínimo</h2>${lista(r.escola_baixa_frequencia, x => pessoa(x, `${C.esc(x.turma)} · ${x.frequencia}% (mínimo ${x.minimo}%)`, `Olá, ${x.nome.split(' ')[0]}! Sentimos sua falta na Escola de Obreiros. Está tudo bem?`), 'Todos os alunos estão com a frequência em dia.')}</section>
      <section class="panel c6"><h2>Muitas recusas de escala</h2>${lista(r.muitas_recusas, x => pessoa(x, `${x.recusas} recusas nos últimos 90 dias`), 'Ninguém recusou escalas com frequência.')}</section>
      <section class="panel c12"><h2>Afastados</h2>${lista(r.afastados, x => pessoa(x, x.ultimo_contato ? 'último contato em ' + new Date(x.ultimo_contato + 'T12:00').toLocaleDateString('pt-BR') : 'sem contato registrado', `Olá, ${x.nome.split(' ')[0]}! Lembramos de você com carinho. A ${C.igrejaAtual().nome} continua de portas abertas. Podemos conversar?`), 'Nenhuma pessoa marcada como afastada.')}</section>
    </div>`;
}

/* ---------------------------- anual ---------------------------- */
async function anual(el) {
  const y = anoSel, ig = C.S.igrejaId, hoje = new Date();
  const fim = y === hoje.getFullYear() ? iso(hoje) : y + '-12-31', ini = y + '-01-01';
  const [serie, r, f, ra] = await Promise.all([
    rpc('relatorio_serie', { p_igreja: ig, p_ano: y }),
    vePastoral() ? rpc('relatorio_pastoral', { p_igreja: ig, p_inicio: ini, p_fim: fim }) : null,
    veFinanceiro() ? rpc('relatorio_financeiro', { p_igreja: ig, p_inicio: ini, p_fim: fim }) : null,
    vePastoral() ? rpc('relatorio_pastoral', { p_igreja: ig, p_inicio: (y - 1) + '-01-01', p_fim: (y - 1) + '-' + fim.slice(5) }) : null
  ]);
  const soma = k => serie.reduce((a, x) => a + (x[k] || 0), 0);
  const ate = y === hoje.getFullYear() ? ` (até ${hoje.toLocaleDateString('pt-BR')})` : '';
  el.innerHTML = cabImpressao(`Relatório anual ${y}`, 'Para a assembleia da igreja' + ate) +
    (r ? `<section class="panel resumo-escrito"><h2>Resumo do ano</h2>${resumoPastoral(r, ra, 'Em ' + y + (y === hoje.getFullYear() ? ' (até agora)' : ''), { em: 'no mesmo período de ' + (y - 1), de: 'do mesmo período de ' + (y - 1) }).map(t => `<p>${C.esc(t)}</p>`).join('')}
      ${f ? `<p>No financeiro, as entradas somaram ${dinheiro(f.entradas)} e as saídas ${dinheiro(f.saidas)}, com saldo de ${f.entradas - f.saidas < 0 ? '−' : ''}${dinheiro(Math.abs(f.entradas - f.saidas))} no período.</p>` : ''}</section>
    <div class="kpis">${kpi('Visitantes', num(r.pessoas.visitantes), delta(r.pessoas.visitantes, ra.pessoas.visitantes, 'ano anterior'))}${kpi('Conversões', num(r.pessoas.conversoes), delta(r.pessoas.conversoes, ra.pessoas.conversoes, 'ano anterior'))}
      ${kpi('Batismos', num(r.pessoas.batismos), delta(r.pessoas.batismos, ra.pessoas.batismos, 'ano anterior'))}${kpi('Novos membros', num(r.pessoas.novos_membros), delta(r.pessoas.novos_membros, ra.pessoas.novos_membros, 'ano anterior'))}
      ${kpi('Membros ativos hoje', num(r.pessoas.membros_ativos), '')}${kpi('Aprovados na Escola', num(r.escola.aprovados), `${num(r.discipulado.concluidos)} discipulados concluídos`)}</div>` : '') +
    `<div class="grid">${r ? `<section class="panel c6"><h2>Visitantes por mês</h2>${barras({ rotulos: MES3, series: [{ nome: 'Visitantes', valores: serie.map(x => x.visitantes || 0) }], W: 420, H: 230 })}</section>
      <section class="panel c6"><h2>Conversões por mês</h2>${barras({ rotulos: MES3, series: [{ nome: 'Conversões', valores: serie.map(x => x.conversoes || 0) }], W: 420, H: 230 })}</section>` : ''}
      ${f ? `<section class="panel c12"><h2>Entradas e saídas por mês</h2>${barras({ rotulos: MES3, series: [{ nome: 'Entradas', valores: serie.map(x => x.entradas || 0) }, { nome: 'Saídas', valores: serie.map(x => x.saidas || 0) }], formato: dinheiro })}</section>` : ''}</div>
    <section class="panel"><h2>Mês a mês</h2><div class="tw"><table class="tabela-ano"><thead><tr><th>Mês</th>${r ? '<th class="r">Visitantes</th><th class="r">Conversões</th><th class="r">Batismos</th><th class="r">Novos membros</th>' : ''}${f ? '<th class="r">Entradas</th><th class="r">Saídas</th><th class="r">Saldo</th>' : ''}</tr></thead><tbody>
      ${serie.map((x, i) => `<tr><td>${MESES[i]}</td>${r ? `<td class="r num">${num(x.visitantes)}</td><td class="r num">${num(x.conversoes)}</td><td class="r num">${num(x.batismos)}</td><td class="r num">${num(x.novos_membros)}</td>` : ''}${f ? `<td class="r num">${dinheiro(x.entradas)}</td><td class="r num">${dinheiro(x.saidas)}</td><td class="r num">${dinheiro(x.entradas - x.saidas)}</td>` : ''}</tr>`).join('')}
      <tr class="total"><td>Total</td>${r ? `<td class="r num">${num(soma('visitantes'))}</td><td class="r num">${num(soma('conversoes'))}</td><td class="r num">${num(soma('batismos'))}</td><td class="r num">${num(soma('novos_membros'))}</td>` : ''}${f ? `<td class="r num">${dinheiro(soma('entradas'))}</td><td class="r num">${dinheiro(soma('saidas'))}</td><td class="r num">${dinheiro(soma('entradas') - soma('saidas'))}</td>` : ''}</tr></tbody></table></div></section>
    ${f ? `<div class="grid"><section class="panel c6"><h2>Entradas por categoria</h2>${partes(f.por_categoria.filter(c => c.tipo === 'entrada').map(c => [c.categoria, c.total]), dinheiro)}</section>
      <section class="panel c6"><h2>Saídas por categoria</h2>${partes(f.por_categoria.filter(c => c.tipo === 'saida').map(c => [c.categoria, c.total]), dinheiro)}</section></div>` : ''}
    <div class="rel-assinaturas"><div><span></span>Pastor presidente</div><div><span></span>Secretaria</div><div><span></span>Tesouraria</div></div>
    <p class="assin">Emitido em ${new Date().toLocaleString('pt-BR')} pelo Livres Connect.</p>`;
}
