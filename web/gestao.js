// Livres Connect · fase Gestão
// Financeiro (lançamentos, contas a pagar/receber, comprovantes, campanhas,
// relatório), Agenda (eventos que se repetem) e Escalas (com link de
// confirmação para o voluntário e lembrete pelo WhatsApp).
import { modal, fecharModal, mh, $v, erroEm, hoje, br, brCurta, linkWhats, ministerios } from './pessoas.js';

let C;
export function instalar(ctx) { C = ctx; }

/* ------------------------------------------------------------------ */
/* utilidades                                                          */
/* ------------------------------------------------------------------ */
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MES3 = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const SEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const FORMAS = { pix: 'Pix', dinheiro: 'Dinheiro', cartao: 'Cartão', transferencia: 'Transferência', boleto: 'Boleto', outro: 'Outro' };
const TIPOS = { culto: ['Culto', 'p-acc'], formacao: ['Formação', 'p-ouro'], oracao: ['Oração', 'p-ok'], evangelismo: ['Evangelismo', 'p-warn'], lideranca: ['Liderança', 'p-neu'], especial: ['Evento especial', 'p-bad'] };
const STATUS = { pendente: 'p-warn', confirmado: 'p-ok', recusado: 'p-bad' };
const dinheiro = c => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const paraCentavos = t => { const s = String(t || '').replace(/[^\d,.-]/g, ''); const n = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s; const v = Math.round(parseFloat(n) * 100); return Number.isFinite(v) ? v : NaN; };
const paraTexto = c => (c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const data = d => new Date(d + 'T12:00:00');
const dataLonga = d => data(d).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const hora = h => h ? h.slice(0, 5) : '';
const somaDias = (d, n) => { const x = data(d); x.setDate(x.getDate() + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const fimDoMes = m => { const [y, mm] = m.split('-').map(Number); return m + '-' + String(new Date(y, mm, 0).getDate()).padStart(2, '0'); };
const realizado = l => !!l.pago_em || !l.vencimento;
const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16)));
const ext = f => (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
function baixar(nome, conteudo, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function confirmar(titulo, texto, botoes) {
  return new Promise(res => {
    const md = modal(mh(titulo) + `<p style="margin:0">${texto}</p><div class="fa">${botoes.map((b, i) => `<button class="btn ${b.cls || ''}" data-r="${i}">${b.t}</button>`).join('')}</div>`, false, () => res(null));
    md.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { const r = botoes[+b.dataset.r].v; res(r); fecharModal(); });
  });
}

/* ================================================================== */
/* FINANCEIRO                                                          */
/* ================================================================== */
const fin = { mes: hoje().slice(0, 7) };
const podeLancar = () => C.pode(['pastor', 'tesouraria']);

export async function telaFinanceiro(main) {
  const { esc, sb } = C;
  const meses = []; { const d = new Date(); for (let i = 5; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); meses.push(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0')); } }
  if (!meses.includes(fin.mes)) fin.mes = meses[meses.length - 1];
  const [y, m] = fin.mes.split('-').map(Number);
  main.innerHTML = C.cab('Financeiro', `<span class="pill p-neu quebra">${C.icon('seguranca')} Visível só para pastor presidente, presbitério e tesouraria</span>`,
    `<button class="btn" data-exportar>Exportar planilha</button><button class="btn" data-imprimir>Imprimir relatório</button>${podeLancar() ? '<button class="btn pri" data-novo>Novo lançamento</button>' : ''}`) +
    `<div class="chips">${meses.map(k => `<button class="chip ${k === fin.mes ? 'on' : ''}" data-mes="${k}">${MESES[+k.slice(5) - 1]}${k === hoje().slice(0, 7) ? ' (atual)' : ''}</button>`).join('')}</div>
    <div class="kpis" id="f-kpis"><div class="carregando">Carregando…</div></div>
    <div id="f-pend"></div>
    <div class="grid"><section class="panel c6"><h2>Entradas por categoria</h2><div id="f-ent"></div></section><section class="panel c6"><h2>Saídas por categoria</h2><div id="f-sai"></div></section>
    <section class="panel c12"><h2>Lançamentos de ${MESES[m - 1]}</h2><div id="f-lista"><div class="carregando">Carregando…</div></div></section>
    <section class="panel c12"><h2>Campanhas e projetos</h2><div id="f-camp"></div></section></div>
    <div id="relatorio" class="so-impressao"></div>`;

  const [{ data: cats }, { data: camps }, { data: doMes, error }, { data: pend }, { data: entCamp }] = await Promise.all([
    sb.from('categorias_financeiras').select('id,nome,tipo').eq('igreja_id', C.S.igrejaId).order('nome'),
    sb.from('campanhas').select('*').eq('igreja_id', C.S.igrejaId).order('inicio', { ascending: false }),
    sb.from('lancamentos').select('*').eq('igreja_id', C.S.igrejaId).gte('data', fin.mes + '-01').lte('data', fimDoMes(fin.mes)).order('data', { ascending: false }),
    sb.from('lancamentos').select('*').eq('igreja_id', C.S.igrejaId).is('pago_em', null).not('vencimento', 'is', null).order('vencimento'),
    sb.from('lancamentos').select('campanha_id,tipo,valor_centavos').eq('igreja_id', C.S.igrejaId).not('campanha_id', 'is', null)
  ]);
  if (error) return erroEm('f-lista', error);
  const nomeCat = id => ((cats || []).find(c => c.id === id) || {}).nome || '—';
  const real = (doMes || []).filter(realizado);
  const ent = real.filter(l => l.tipo === 'entrada'), sai = real.filter(l => l.tipo === 'saida');
  const se = ent.reduce((a, b) => a + b.valor_centavos, 0), ss = sai.reduce((a, b) => a + b.valor_centavos, 0);
  const semComp = sai.filter(l => !l.comprovante_url).length;
  const aPagar = (pend || []).filter(l => l.tipo === 'saida'), aReceber = (pend || []).filter(l => l.tipo === 'entrada');
  document.getElementById('f-kpis').innerHTML = [
    ['Entradas', dinheiro(se), `${ent.length} lançamentos`, 'up'],
    ['Saídas', dinheiro(ss), semComp ? `${semComp} sem comprovante` : 'todas com comprovante', 'down'],
    ['Saldo do mês', dinheiro(se - ss), se - ss >= 0 ? 'positivo' : 'negativo', se - ss >= 0 ? 'up' : 'down'],
    ['A pagar', dinheiro(aPagar.reduce((a, b) => a + b.valor_centavos, 0)), `${aPagar.length} conta(s) em aberto`, '']
  ].map(([l, v, s, c]) => `<div class="kpi money"><span class="l">${l}</span><span class="v ${c}">${v}</span><span class="s">${s}</span></div>`).join('');

  const barras = (lista, tot, cls) => {
    const o = {}; lista.forEach(l => { const k = nomeCat(l.categoria_id); o[k] = (o[k] || 0) + l.valor_centavos; });
    const e = Object.entries(o).sort((a, b) => b[1] - a[1]);
    return e.length ? `<div class="bars">${e.map(([k, v]) => `<div class="bar"><span>${esc(k)}</span><div class="track"><div class="fill ${cls}" style="width:${v / tot * 100}%"></div></div><span class="num">${dinheiro(v)}</span></div>`).join('')}</div>` : '<div class="vazio">Nenhum lançamento neste mês.</div>';
  };
  document.getElementById('f-ent').innerHTML = barras(ent, se || 1, '');
  document.getElementById('f-sai').innerHTML = barras(sai, ss || 1, 'out');

  document.getElementById('f-pend').innerHTML = (pend || []).length ? `<section class="panel"><h2>Contas a pagar e a receber</h2><div class="tw"><table><thead><tr><th>Vencimento</th><th>Descrição</th><th>Categoria</th><th class="r">Valor</th><th></th></tr></thead><tbody>
    ${(pend || []).map(l => { const atraso = l.vencimento < hoje(); return `<tr><td class="num"><span class="pill ${atraso ? 'p-bad' : 'p-neu'}">${brCurta(l.vencimento)}${atraso ? ' · vencida' : ''}</span></td><td>${esc(l.descricao)}</td><td>${esc(nomeCat(l.categoria_id))}</td>
    <td class="r num ${l.tipo === 'entrada' ? 'up' : 'down'}" style="white-space:nowrap">${l.tipo === 'entrada' ? '+' : '−'} ${dinheiro(l.valor_centavos)}</td>
    <td class="acoes">${podeLancar() ? `<button class="btn sm" data-pagar="${l.id}">${l.tipo === 'entrada' ? 'Marcar recebida' : 'Marcar paga'}</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div></section>` : '';

  document.getElementById('f-lista').innerHTML = (doMes || []).length ? `<div class="tw"><table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Forma</th><th>Comprovante</th><th class="r">Valor</th><th></th></tr></thead><tbody>
    ${(doMes || []).map(l => `<tr><td class="num">${brCurta(l.data)}</td><td>${esc(l.descricao)}${realizado(l) ? '' : ' <span class="pill p-warn">em aberto</span>'}</td><td>${esc(nomeCat(l.categoria_id))}</td><td>${FORMAS[l.forma] || '<span class="muted">—</span>'}</td>
    <td>${l.comprovante_url ? `<button class="btn sm" data-comp="${esc(l.comprovante_url)}">Ver</button>` : l.tipo === 'saida' ? '<span class="pill p-warn">pendente</span>' : '<span class="muted">—</span>'}</td>
    <td class="r num ${l.tipo === 'entrada' ? 'up' : 'down'}" style="white-space:nowrap">${l.tipo === 'entrada' ? '+' : '−'} ${dinheiro(l.valor_centavos)}</td>
    <td class="acoes">${podeLancar() ? `<button class="btn sm" data-editar="${l.id}">Editar</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`
    : `<div class="vazio">Nenhum lançamento em ${MESES[m - 1]}.${podeLancar() ? ' Use "Novo lançamento" para registrar dízimos, ofertas e despesas.' : ''}</div>`;

  const arrec = id => (entCamp || []).filter(l => l.campanha_id === id && l.tipo === 'entrada').reduce((a, b) => a + b.valor_centavos, 0);
  const gasto = id => (entCamp || []).filter(l => l.campanha_id === id && l.tipo === 'saida').reduce((a, b) => a + b.valor_centavos, 0);
  document.getElementById('f-camp').innerHTML = `${(camps || []).length ? `<div class="lista">${camps.map(c => { const a = arrec(c.id); return `<div class="linha"><div class="cresce"><b style="font-weight:600">${esc(c.nome)}</b><div class="muted" style="font-size:13px">${c.inicio ? 'Desde ' + br(c.inicio) : ''}${c.fim ? ' até ' + br(c.fim) : ''} · gasto ${dinheiro(gasto(c.id))}</div>
    ${c.meta_centavos ? `<div class="track" style="margin-top:6px;max-width:420px"><div class="fill" style="width:${Math.min(100, a / c.meta_centavos * 100)}%"></div></div>` : ''}</div>
    <div class="num" style="text-align:right"><b>${dinheiro(a)}</b>${c.meta_centavos ? `<div class="muted" style="font-size:12.5px">de ${dinheiro(c.meta_centavos)} (${Math.round(a / c.meta_centavos * 100)}%)</div>` : ''}</div></div>`; }).join('')}</div>` : '<div class="vazio">Nenhuma campanha. Campanhas agrupam entradas e gastos de um projeto, como uma reforma ou um congresso.</div>'}
    ${podeLancar() ? `<form class="f" id="f-nc" style="grid-template-columns:2fr 1fr 1fr auto;align-items:end;margin-top:12px">
      <div class="fld"><label for="nc-nome">Nova campanha</label><input id="nc-nome" required placeholder="Ex.: Reforma do templo"></div>
      <div class="fld"><label for="nc-meta">Meta (R$)</label><input id="nc-meta" inputmode="decimal" placeholder="opcional"></div>
      <div class="fld"><label for="nc-ini">Início</label><input id="nc-ini" type="date" value="${hoje()}"></div>
      <button class="btn pri" type="submit">Criar</button></form>` : ''}`;

  // relatório para imprimir
  const ig = C.igrejaAtual();
  document.getElementById('relatorio').innerHTML = `<h1>${esc(ig.nome)}</h1><h2>Relatório financeiro · ${MESES[m - 1]} de ${y}</h2>
    <table><tbody><tr><td>Entradas</td><td class="r">${dinheiro(se)}</td></tr><tr><td>Saídas</td><td class="r">${dinheiro(ss)}</td></tr><tr><th>Saldo do mês</th><th class="r">${dinheiro(se - ss)}</th></tr></tbody></table>
    <h3>Lançamentos</h3><table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Forma</th><th class="r">Valor</th></tr></thead><tbody>
    ${real.slice().reverse().map(l => `<tr><td>${br(l.data)}</td><td>${esc(l.descricao)}</td><td>${esc(nomeCat(l.categoria_id))}</td><td>${FORMAS[l.forma] || ''}</td><td class="r">${l.tipo === 'entrada' ? '' : '−'}${dinheiro(l.valor_centavos)}</td></tr>`).join('')}</tbody></table>
    <p class="assin">Emitido em ${new Date().toLocaleString('pt-BR')} pelo Livres Connect.</p>
    <div class="assinaturas"><div>Tesouraria</div><div>Pastor presidente</div><div>Conselho fiscal</div></div>`;

  const fnc = document.getElementById('f-nc'); if (fnc) fnc.onsubmit = e => {
    e.preventDefault();
    C.ocupado(e.target.querySelector('[type=submit]'), async () => {
      const meta = $v('nc-meta') ? paraCentavos($v('nc-meta')) : null;
      if (meta !== null && !(meta > 0)) return C.toast('Meta inválida. Use um valor como 15.000,00.');
      const { error: er } = await sb.from('campanhas').insert({ igreja_id: C.S.igrejaId, nome: $v('nc-nome'), meta_centavos: meta, inicio: $v('nc-ini') || null });
      if (er) return C.toast(C.traduzErro(er));
      C.toast('Campanha criada.'); telaFinanceiro(main);
    });
  };
  main.onclick = async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.mes) { fin.mes = b.dataset.mes; return telaFinanceiro(main); }
    if ('novo' in b.dataset) return lancamento(null, cats || [], camps || [], () => telaFinanceiro(main));
    if (b.dataset.editar) return lancamento((doMes || []).find(l => l.id === b.dataset.editar), cats || [], camps || [], () => telaFinanceiro(main));
    if (b.dataset.pagar) {
      const { error: er } = await sb.from('lancamentos').update({ pago_em: hoje() }).eq('id', b.dataset.pagar);
      return er ? C.toast(C.traduzErro(er)) : (C.toast('Conta baixada.'), telaFinanceiro(main));
    }
    if (b.dataset.comp) {
      const { data: u, error: er } = await sb.storage.from('comprovantes').createSignedUrl(b.dataset.comp, 300);
      return er ? C.toast(C.traduzErro(er)) : window.open(u.signedUrl, '_blank', 'noopener');
    }
    if ('exportar' in b.dataset) {
      const linhas = [['Data', 'Tipo', 'Descrição', 'Categoria', 'Forma', 'Situação', 'Vencimento', 'Valor (R$)', 'Comprovante']]
        .concat((doMes || []).slice().reverse().map(l => [br(l.data), l.tipo === 'entrada' ? 'Entrada' : 'Saída', l.descricao, nomeCat(l.categoria_id), FORMAS[l.forma] || '', realizado(l) ? 'Pago' : 'Em aberto', br(l.vencimento), (l.tipo === 'entrada' ? '' : '-') + paraTexto(l.valor_centavos), l.comprovante_url ? 'Sim' : 'Não']));
      const csv = '﻿' + linhas.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
      baixar(`financeiro-${fin.mes}.csv`, csv, 'text/csv;charset=utf-8'); return C.toast('Planilha baixada. Abra no Excel.');
    }
    if ('imprimir' in b.dataset) return window.print();
  };
}

async function lancamento(l, cats, camps, depois) {
  const esc = C.esc, sb = C.sb, novo = !l;
  const tipo0 = l ? l.tipo : 'entrada';
  const md = modal(mh(novo ? 'Novo lançamento' : 'Editar lançamento') + `
    <form class="f" id="f-lan">
      <div class="fld"><label for="l-tipo">Tipo</label><select id="l-tipo"><option value="entrada" ${tipo0 === 'entrada' ? 'selected' : ''}>Entrada</option><option value="saida" ${tipo0 === 'saida' ? 'selected' : ''}>Saída</option></select></div>
      <div class="fld"><label for="l-cat">Categoria</label><select id="l-cat"></select></div>
      <div class="fld full" id="l-ncat-box" hidden><label for="l-ncat">Nome da nova categoria</label><input id="l-ncat"></div>
      <div class="fld full"><label for="l-desc">Descrição</label><input id="l-desc" required value="${esc(l ? l.descricao : '')}" placeholder="Ex.: Dízimos do culto de domingo"></div>
      <div class="fld"><label for="l-valor">Valor (R$)</label><input id="l-valor" inputmode="decimal" required placeholder="0,00" value="${l ? paraTexto(l.valor_centavos) : ''}"></div>
      <div class="fld"><label for="l-forma">Forma</label><select id="l-forma"><option value="">—</option>${Object.entries(FORMAS).map(([k, v]) => `<option value="${k}" ${l && l.forma === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="fld"><label for="l-sit">Situação</label><select id="l-sit"><option value="pago">Pago / recebido</option><option value="aberto" ${l && !realizado(l) ? 'selected' : ''}>Em aberto (a pagar ou receber)</option></select></div>
      <div class="fld"><label for="l-data" id="l-data-lb">Data</label><input id="l-data" type="date" required value="${l ? (realizado(l) ? l.data : l.vencimento) : hoje()}"></div>
      <div class="fld full"><label for="l-camp">Campanha</label><select id="l-camp"><option value="">Nenhuma</option>${camps.map(c => `<option value="${c.id}" ${l && l.campanha_id === c.id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select></div>
      <div class="fld full"><label for="l-comp">Comprovante (foto ou PDF, até 5 MB)</label><input id="l-comp" type="file" accept="image/jpeg,image/png,image/webp,application/pdf">${l && l.comprovante_url ? '<span class="dica">Já tem comprovante. Envie outro só se quiser trocar.</span>' : ''}</div>
      <div id="l-msg" class="fld full"></div>
      <div class="fa">${novo ? '' : '<button type="button" class="btn danger" data-excluir style="margin-right:auto">Excluir</button>'}<button type="button" class="btn" data-fechar>Cancelar</button><button class="btn pri" type="submit">Salvar</button></div>
    </form>`);
  const selCat = md.querySelector('#l-cat'), selTipo = md.querySelector('#l-tipo');
  const encherCats = () => {
    const t = selTipo.value;
    selCat.innerHTML = cats.filter(c => c.tipo === t).map(c => `<option value="${c.id}" ${l && l.categoria_id === c.id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('') + '<option value="__nova">+ Nova categoria…</option>';
    md.querySelector('#l-ncat-box').hidden = selCat.value !== '__nova';
  };
  encherCats();
  selTipo.onchange = encherCats;
  selCat.onchange = () => { md.querySelector('#l-ncat-box').hidden = selCat.value !== '__nova'; };
  const ajusta = () => { md.querySelector('#l-data-lb').textContent = md.querySelector('#l-sit').value === 'pago' ? 'Data' : 'Vencimento'; };
  md.querySelector('#l-sit').onchange = ajusta; ajusta();
  const bx = md.querySelector('[data-excluir]');
  if (bx) bx.onclick = async () => {
    const r = await confirmar('Excluir lançamento?', `"${esc(l.descricao)}", ${dinheiro(l.valor_centavos)}. A exclusão fica registrada na auditoria.`, [{ t: 'Cancelar', v: false }, { t: 'Excluir', v: true, cls: 'pri' }]);
    if (!r) return lancamento(l, cats, camps, depois);
    const { error } = await sb.from('lancamentos').delete().eq('id', l.id);
    error ? C.toast(C.traduzErro(error)) : (C.toast('Lançamento excluído.'), depois());
  };
  md.querySelector('#f-lan').onsubmit = e => {
    e.preventDefault();
    C.ocupado(e.target.querySelector('[type=submit]'), async () => {
      const valor = paraCentavos($v('l-valor'));
      if (!(valor > 0)) return erroEm('l-msg', 'Valor inválido. Use um valor como 1.250,00.');
      let categoria = selCat.value;
      if (categoria === '__nova') {
        if (!$v('l-ncat')) return erroEm('l-msg', 'Escreva o nome da nova categoria.');
        const { data: nc, error: ec } = await sb.from('categorias_financeiras').insert({ igreja_id: C.S.igrejaId, nome: $v('l-ncat'), tipo: selTipo.value }).select('id').single();
        if (ec) return erroEm('l-msg', ec);
        categoria = nc.id;
      }
      const pago = $v('l-sit') === 'pago', d = $v('l-data');
      const reg = { tipo: selTipo.value, categoria_id: categoria, descricao: $v('l-desc'), valor_centavos: valor, forma: $v('l-forma') || null, campanha_id: $v('l-camp') || null,
        data: d, vencimento: pago ? (l && l.vencimento ? l.vencimento : null) : d, pago_em: pago ? d : null };
      const arq = md.querySelector('#l-comp').files[0];
      if (arq && arq.size > 5 * 1024 * 1024) return erroEm('l-msg', 'O comprovante passa de 5 MB.');
      let id = l && l.id;
      if (novo) {
        const { data: ins, error } = await sb.from('lancamentos').insert({ ...reg, igreja_id: C.S.igrejaId }).select('id').single();
        if (error) return erroEm('l-msg', error);
        id = ins.id;
      } else {
        const { error } = await sb.from('lancamentos').update(reg).eq('id', id);
        if (error) return erroEm('l-msg', error);
      }
      if (arq) {
        const caminho = `${C.S.igrejaId}/${id}.${ext(arq)}`;
        const { error: eu } = await sb.storage.from('comprovantes').upload(caminho, arq, { upsert: true, contentType: arq.type });
        if (eu) { C.toast('Lançamento salvo, mas o comprovante não foi enviado: ' + C.traduzErro(eu)); fecharModal(); return depois(); }
        await sb.from('lancamentos').update({ comprovante_url: caminho }).eq('id', id);
      }
      fecharModal(); C.toast(novo ? 'Lançamento registrado.' : 'Lançamento atualizado.');
      if (pago) fin.mes = d.slice(0, 7);
      depois();
    });
  };
}

/* ================================================================== */
/* AGENDA                                                              */
/* ================================================================== */
const ag = { ver: 'proximos' };
const podeAgenda = () => C.pode(['pastor', 'presbiterio', 'secretaria', 'lider']);

export async function telaAgenda(main) {
  const { esc, sb } = C;
  main.innerHTML = C.cab('Agenda e eventos', 'Toda a programação da igreja em um só lugar.', podeAgenda() ? '<button class="btn pri" data-novo>Novo evento</button>' : '') +
    `<div class="chips"><button class="chip ${ag.ver === 'proximos' ? 'on' : ''}" data-ver="proximos">Próximos</button><button class="chip ${ag.ver === 'anteriores' ? 'on' : ''}" data-ver="anteriores">Anteriores</button></div>
    <section class="panel"><div id="a-lista"><div class="carregando">Carregando…</div></div></section>`;
  let q = sb.from('eventos').select('*').eq('igreja_id', C.S.igrejaId);
  q = ag.ver === 'proximos' ? q.gte('data', hoje()).lte('data', somaDias(hoje(), 120)).order('data').order('hora') : q.lt('data', hoje()).gte('data', somaDias(hoje(), -120)).order('data', { ascending: false });
  const { data: evs, error } = await q;
  if (error) return erroEm('a-lista', error);
  const ids = (evs || []).map(e => e.id);
  const { data: esc_ } = ids.length && C.pode(['pastor', 'presbiterio', 'secretaria', 'lider', 'diacono'])
    ? await sb.from('escalas').select('evento_id,status').in('evento_id', ids) : { data: [] };
  const porData = {}; (evs || []).forEach(e => (porData[e.data] = porData[e.data] || []).push(e));
  document.getElementById('a-lista').innerHTML = Object.keys(porData).length ? `<div class="lista">${Object.entries(porData).map(([d, es]) => `
    <div class="linha" style="align-items:flex-start"><div class="datebox"><b>${data(d).getDate()}</b><span>${MES3[data(d).getMonth()]}</span></div>
      <div class="cresce" style="display:flex;flex-direction:column;gap:10px">${es.map(e => { const sc = (esc_ || []).filter(s => s.evento_id === e.id); return `
        <div class="evento"><div style="flex:1;min-width:200px"><b>${esc(e.titulo)}</b><div class="muted" style="font-size:13.5px">${SEM[data(d).getDay()]} · ${hora(e.hora) || 'dia todo'}${e.local ? ' · ' + esc(e.local) : ''}${e.serie_id ? ' · repete toda semana' : ''}</div>${e.descricao ? `<div style="font-size:13.5px;margin-top:2px">${esc(e.descricao)}</div>` : ''}</div>
          <span class="pill ${TIPOS[e.tipo][1]}">${TIPOS[e.tipo][0]}</span>
          ${sc.length ? `<a class="btn sm" href="#/escalas" data-esc="${e.id}">Escala: ${sc.filter(s => s.status === 'confirmado').length}/${sc.length} confirmados</a>` : (C.pode(['pastor', 'lider']) && ag.ver === 'proximos' ? `<a class="btn sm" href="#/escalas" data-esc="${e.id}">Montar escala</a>` : '')}
          ${podeAgenda() ? `<button class="btn sm ghost" data-editar="${e.id}">Editar</button>` : ''}</div>`; }).join('')}</div></div>`).join('')}</div>`
    : `<div class="vazio">${ag.ver === 'proximos' ? 'Nenhum evento nos próximos meses. Use "Novo evento" e marque "repetir toda semana" para os cultos fixos.' : 'Nenhum evento nos últimos meses.'}</div>`;
  main.onclick = e => {
    const v = e.target.closest('[data-ver]'); if (v) { ag.ver = v.dataset.ver; return telaAgenda(main); }
    if (e.target.closest('[data-novo]')) return evento(null, () => telaAgenda(main));
    const ed = e.target.closest('[data-editar]'); if (ed) return evento((evs || []).find(x => x.id === ed.dataset.editar), () => telaAgenda(main));
    const es = e.target.closest('[data-esc]'); if (es) esc_sel.evento = es.dataset.esc;
  };
}

async function evento(ev, depois) {
  const esc = C.esc, sb = C.sb, novo = !ev;
  const md = modal(mh(novo ? 'Novo evento' : 'Editar evento') + `
    <form class="f" id="f-ev">
      <div class="fld full"><label for="e-tit">Nome</label><input id="e-tit" required value="${esc(ev ? ev.titulo : '')}" placeholder="Ex.: Culto de domingo, Quarta da Vitória"></div>
      <div class="fld"><label for="e-tipo">Tipo</label><select id="e-tipo">${Object.entries(TIPOS).map(([k, [l]]) => `<option value="${k}" ${ev && ev.tipo === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="fld"><label for="e-local">Local</label><input id="e-local" value="${esc(ev ? ev.local || '' : 'Templo sede')}"></div>
      <div class="fld"><label for="e-data">Data</label><input id="e-data" type="date" required value="${ev ? ev.data : hoje()}"></div>
      <div class="fld"><label for="e-hora">Horário</label><input id="e-hora" type="time" value="${ev ? hora(ev.hora) : '19:00'}"></div>
      <div class="fld full"><label for="e-desc">Detalhes <span class="muted">(opcional)</span></label><input id="e-desc" value="${esc(ev ? ev.descricao || '' : '')}" placeholder="Ex.: Santa Ceia, preletor convidado"></div>
      ${novo ? `<label class="chk"><input type="checkbox" id="e-rep"> Repetir toda semana</label>
      <div class="fld" id="e-sem-box" hidden><label for="e-sem">Por quantas semanas</label><select id="e-sem">${[4, 8, 12, 26, 52].map(n => `<option value="${n}" ${n === 12 ? 'selected' : ''}>${n} semanas${n === 52 ? ' (1 ano)' : ''}</option>`).join('')}</select></div>` : ''}
      <div id="e-msg" class="fld full"></div>
      <div class="fa">${novo ? '' : '<button type="button" class="btn danger" data-excluir style="margin-right:auto">Excluir</button>'}<button type="button" class="btn" data-fechar>Cancelar</button><button class="btn pri" type="submit">Salvar</button></div>
    </form>`);
  const rep = md.querySelector('#e-rep'); if (rep) rep.onchange = () => { md.querySelector('#e-sem-box').hidden = !rep.checked; };
  const bx = md.querySelector('[data-excluir]');
  if (bx) bx.onclick = async () => {
    const ops = [{ t: 'Cancelar', v: null }, { t: 'Excluir só este', v: 'um', cls: 'pri' }];
    if (ev.serie_id) ops.push({ t: 'Este e os próximos da série', v: 'serie', cls: 'pri' });
    const r = await confirmar('Excluir evento?', `"${esc(ev.titulo)}" de ${br(ev.data)}. As escalas deste evento também serão apagadas.`, ops);
    if (!r) return evento(ev, depois);
    const q = r === 'serie' ? sb.from('eventos').delete().eq('serie_id', ev.serie_id).gte('data', ev.data) : sb.from('eventos').delete().eq('id', ev.id);
    const { error } = await q;
    error ? C.toast(C.traduzErro(error)) : (C.toast('Evento excluído.'), depois());
  };
  md.querySelector('#f-ev').onsubmit = e => {
    e.preventDefault();
    C.ocupado(e.target.querySelector('[type=submit]'), async () => {
      const base = { titulo: $v('e-tit'), tipo: $v('e-tipo'), local: $v('e-local') || null, data: $v('e-data'), hora: $v('e-hora') || null, descricao: $v('e-desc') || null };
      let error;
      if (novo) {
        const n = rep && rep.checked ? +$v('e-sem') : 1, serie = n > 1 ? novoId() : null;
        const linhas = Array.from({ length: n }, (_, i) => ({ ...base, igreja_id: C.S.igrejaId, data: somaDias(base.data, 7 * i), serie_id: serie, recorrencia: serie ? 'semanal' : null }));
        ({ error } = await sb.from('eventos').insert(linhas));
      } else ({ error } = await sb.from('eventos').update(base).eq('id', ev.id));
      if (error) return erroEm('e-msg', error);
      fecharModal(); C.toast(novo ? 'Evento criado.' : 'Evento atualizado.'); depois();
    });
  };
}

/* ================================================================== */
/* ESCALAS                                                             */
/* ================================================================== */
const esc_sel = { evento: null };
const linkEscala = t => location.origin + location.pathname + '#/escala/' + t;
const gerenciaMin = min => C.pode(['pastor']) || C.lideraMin(min);

export async function telaEscalas(main) {
  const { esc, sb } = C;
  main.innerHTML = C.cab('Escalas ministeriais', 'O líder monta a escala e envia o lembrete pelo WhatsApp. O voluntário confirma por um link, sem precisar de login.',
    '<button class="btn" data-copiar-escala>Copiar escala para o grupo</button>') +
    `<div class="chips" id="s-evs"></div><div id="s-corpo"><div class="carregando">Carregando…</div></div>`;
  const [{ data: evs }, mins] = await Promise.all([
    sb.from('eventos').select('id,titulo,data,hora,local,tipo').eq('igreja_id', C.S.igrejaId).gte('data', hoje()).order('data').order('hora').limit(10),
    ministerios()
  ]);
  if (!(evs || []).length) { document.getElementById('s-corpo').innerHTML = `<section class="panel"><div class="vazio">Nenhum evento nos próximos dias. Cadastre os cultos em <a href="#/agenda">Agenda</a> e volte aqui para montar a escala.</div></section>`; return; }
  if (!esc_sel.evento || !evs.some(e => e.id === esc_sel.evento)) esc_sel.evento = evs[0].id;
  const ev = evs.find(e => e.id === esc_sel.evento);
  document.getElementById('s-evs').innerHTML = evs.map(e => `<button class="chip ${e.id === ev.id ? 'on' : ''}" data-ev="${e.id}">${esc(e.titulo)} · ${brCurta(e.data)}</button>`).join('');
  const [{ data: sc, error }, { data: vols }] = await Promise.all([
    sb.rpc('escala_do_evento', { p_evento: ev.id }),
    C.pode(['pastor', 'lider']) ? sb.rpc('voluntarios', { p_igreja: C.S.igrejaId }) : Promise.resolve({ data: null })
  ]);
  if (error) return erroEm('s-corpo', error);
  const lista = sc || [];
  const vezes = {}; lista.forEach(s => (vezes[s.pessoa_id] = (vezes[s.pessoa_id] || 0) + 1));
  const conflitos = Object.keys(vezes).filter(k => vezes[k] > 1);
  const nomeMin = id => (mins.find(m => m.id === id) || {}).nome || 'Ministério';
  const msgLembrete = s => `Olá, ${s.nome.split(' ')[0]}! Você está escalado(a) em *${nomeMin(s.ministerio_id)}* no *${ev.titulo}* de ${dataLonga(ev.data)}${ev.hora ? ' às ' + hora(ev.hora) : ''}. Por favor, confirme aqui: ${linkEscala(s.token)}`;

  document.getElementById('s-corpo').innerHTML = `
    <section class="panel resumo-escala"><div style="flex:1;min-width:220px"><h2 style="margin:0">${esc(ev.titulo)}</h2><div class="muted">${dataLonga(ev.data)}${ev.hora ? ' às ' + hora(ev.hora) : ''}${ev.local ? ' · ' + esc(ev.local) : ''}</div></div>
      <span class="pill p-ok">${lista.filter(s => s.status === 'confirmado').length} confirmados</span><span class="pill p-warn">${lista.filter(s => s.status === 'pendente').length} pendentes</span><span class="pill p-bad">${lista.filter(s => s.status === 'recusado').length} não podem</span></section>
    ${vols && !vols.length ? `<div class="aviso ouro passos"><b>Para montar a escala, primeiro cadastre os voluntários como membros.</b>
      <ol><li>Abra <a href="#/membros">Membros</a> e clique em <b>Novo membro</b> (ou avance uma pessoa até a etapa Membro na Jornada da Alma).</li>
      <li>Na ficha, preencha o <b>WhatsApp</b> e o <b>ministério</b> em que ela serve.</li>
      <li>Volte aqui, clique em <b>+ Adicionar</b> no ministério e depois em <b>Lembrar</b> para enviar o convite pelo WhatsApp.</li></ol></div>` : ''}
    ${conflitos.length ? `<div class="erro"><b>Conflito de escala:</b> ${conflitos.map(id => { const ss = lista.filter(s => s.pessoa_id === id); return esc(ss[0].nome) + ' está em ' + ss.map(s => nomeMin(s.ministerio_id)).join(' e '); }).join('; ')}.</div>` : ''}
    <div class="mins">${mins.map(m => { const a = lista.filter(s => s.ministerio_id === m.id), g = gerenciaMin(m.id); return `
      <section class="panel min"><h3>${esc(m.nome)}${g ? `<button class="btn sm ghost" data-add="${m.id}">+ Adicionar</button>` : ''}</h3>
      ${a.map(s => `<div class="asg ${vezes[s.pessoa_id] > 1 ? 'conf' : ''}"><span class="grow">${esc(s.nome)}${s.lembrete_enviado_em && s.status === 'pendente' ? ' <small class="muted">· lembrado</small>' : ''}</span>
        ${g ? `<button class="pill ${STATUS[s.status]}" data-st="${s.id}" data-atual="${s.status}" title="Clique para mudar">${s.status === 'recusado' ? 'não pode' : s.status}</button>` : `<span class="pill ${STATUS[s.status]}">${s.status === 'recusado' ? 'não pode' : s.status}</span>`}
        ${g && s.token && linkWhats(s.telefone) ? `<a class="btn sm whats" href="${esc(linkWhats(s.telefone, msgLembrete(s)))}" target="_blank" rel="noopener" data-lembrou="${s.id}">Lembrar</a>` : ''}
        ${g && s.token && !linkWhats(s.telefone) ? `<button class="btn sm" data-link="${esc(linkEscala(s.token))}" title="Sem WhatsApp cadastrado">Link</button>` : ''}
        ${g ? `<button class="x" data-tirar="${s.id}" aria-label="Tirar da escala">×</button>` : ''}</div>`).join('') || '<div class="vazio">Ninguém escalado.</div>'}</section>`; }).join('')}</div>`;

  main.onclick = async e => {
    const t = e.target.closest('button,a'); if (!t) return;
    if (t.dataset.ev) { esc_sel.evento = t.dataset.ev; return telaEscalas(main); }
    if (t.dataset.add) return adicionar(t.dataset.add, nomeMin(t.dataset.add), lista, () => telaEscalas(main));
    if (t.dataset.st) {
      const prox = { pendente: 'confirmado', confirmado: 'recusado', recusado: 'pendente' }[t.dataset.atual];
      const { error: er } = await sb.from('escalas').update({ status: prox }).eq('id', t.dataset.st);
      return er ? C.toast(C.traduzErro(er)) : telaEscalas(main);
    }
    if (t.dataset.tirar) {
      const { error: er } = await sb.from('escalas').delete().eq('id', t.dataset.tirar);
      return er ? C.toast(C.traduzErro(er)) : (C.toast('Voluntário retirado da escala.'), telaEscalas(main));
    }
    if (t.dataset.lembrou) { sb.from('escalas').update({ lembrete_enviado_em: new Date().toISOString() }).eq('id', t.dataset.lembrou).then(() => {}); return; }
    if (t.dataset.link) { try { await navigator.clipboard.writeText(t.dataset.link); C.toast('Link de confirmação copiado.'); } catch (er) { prompt('Copie o link:', t.dataset.link); } return; }
    if ('copiarEscala' in t.dataset) {
      const txt = `*${ev.titulo}* · ${dataLonga(ev.data)}${ev.hora ? ' às ' + hora(ev.hora) : ''}\n\n` + mins.map(m => { const a = lista.filter(s => s.ministerio_id === m.id); return a.length ? `*${m.nome}*\n` + a.map(s => `• ${s.nome}${s.status === 'confirmado' ? ' ✓' : ''}`).join('\n') : ''; }).filter(Boolean).join('\n\n');
      try { await navigator.clipboard.writeText(txt); C.toast('Escala copiada. Cole no grupo do WhatsApp.'); } catch (er) { prompt('Copie a escala:', txt); }
    }
  };
}

async function adicionar(minId, minNome, lista, depois) {
  const esc = C.esc, sb = C.sb;
  const { data: vols, error } = await sb.rpc('voluntarios', { p_igreja: C.S.igrejaId });
  if (error) return C.toast(C.traduzErro(error));
  const ja = new Set(lista.map(s => s.pessoa_id)), noMin = new Set(lista.filter(s => s.ministerio_id === minId).map(s => s.pessoa_id));
  const ord = (vols || []).filter(v => !noMin.has(v.pessoa_id)).sort((a, b) => (b.ministerio_id === minId) - (a.ministerio_id === minId) || a.nome.localeCompare(b.nome));
  const md = modal(mh('Escalar em ' + esc(minNome), 'Primeiro aparecem as pessoas deste ministério. Quem já está em outra função neste culto aparece marcado.') + (ord.length ? `
    <form class="f" id="f-add" style="grid-template-columns:1fr">
      <div class="fld"><label for="a-p">Voluntário</label><select id="a-p">${ord.map(v => `<option value="${v.pessoa_id}">${esc(v.nome)}${v.ministerio_id === minId ? ' · ' + esc(minNome) : ''}${ja.has(v.pessoa_id) ? ' · já escalado neste culto' : ''}</option>`).join('')}</select></div>
      <div id="a-msg"></div>
      <div class="fa"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn pri" type="submit">Escalar</button></div></form>`
    : `<div class="vazio">Nenhum membro disponível para escalar. Só aparecem pessoas da etapa <b>Membro</b> em diante.${C.pode(['lider']) && !C.pode(['pastor']) ? ' Para quem lidera um ministério, aparecem as pessoas que acompanha e as do seu ministério.' : ''}</div>
       <div class="fa"><button type="button" class="btn" data-fechar>Fechar</button><a class="btn pri" href="#/membros" data-fechar>Cadastrar membro</a></div>`));
  const f = md.querySelector('#f-add'); if (f) f.onsubmit = e => {
    e.preventDefault();
    C.ocupado(e.target.querySelector('[type=submit]'), async () => {
      const pessoa = $v('a-p');
      const { error: er } = await sb.from('escalas').insert({ igreja_id: C.S.igrejaId, evento_id: esc_sel.evento, ministerio_id: minId, pessoa_id: pessoa });
      if (er) return erroEm('a-msg', er);
      fecharModal(); C.toast(ja.has(pessoa) ? 'Escalado. Atenção: essa pessoa já está em outra função neste culto.' : 'Voluntário escalado. Agora envie o lembrete.');
      depois();
    });
  };
}

/* ------------------------------------------------------------------ */
/* Página pública: o voluntário confirma a escala                      */
/* ------------------------------------------------------------------ */
export async function telaEscalaPublica(token) {
  const { esc, sb } = C;
  const app = document.getElementById('app');
  const { data } = await sb.rpc('escala_publica', { p_token: token });
  const s = data && data[0];
  const casca = corpo => `<div class="auth"><div class="auth-card ficha-pub">
    <div class="brand"><div class="mark"><svg viewBox="0 0 24 24"><path d="M12 4v16M6 10h12"/></svg></div><div><b>${s ? esc(s.igreja) : 'Livres Connect'}</b><small>Confirmação de escala</small></div></div>${corpo}</div></div>`;
  if (!s) { app.innerHTML = casca('<h1>Escala não encontrada</h1><p>Este link não é mais válido. Fale com o líder do seu ministério.</p>'); return; }
  const passou = s.data < hoje();
  const desenhar = (msg = '') => {
    app.innerHTML = casca(`<div><h1>Olá, ${esc(s.pessoa)}!</h1><p>Você está escalado(a) em:</p></div>
      <div class="cartao-escala"><b>${esc(s.ministerio)}</b><span>${esc(s.evento)}</span><span>${dataLonga(s.data)}${s.hora ? ' às ' + hora(s.hora) : ''}</span>${s.local ? `<span class="muted">${esc(s.local)}</span>` : ''}</div>
      <p>Situação: <span class="pill ${STATUS[s.status]}">${s.status === 'recusado' ? 'não posso' : s.status}</span></p>
      ${msg}
      ${passou ? '<p class="muted">Este culto já aconteceu.</p>' : `<div class="acts"><button class="btn pri" data-r="confirmado">Confirmo presença</button><button class="btn" data-r="recusado">Não posso</button></div>`}`);
    app.querySelectorAll('[data-r]').forEach(b => b.onclick = () => C.ocupado(b, async () => {
      const { data: r, error } = await sb.rpc('responder_escala', { p_token: token, p_status: b.dataset.r });
      if (error) return desenhar(`<div class="erro">${esc(C.traduzErro(error))}</div>`);
      s.status = r;
      desenhar(r === 'confirmado' ? '<div class="aviso">Obrigado! Sua presença está confirmada. Deus abençoe seu serviço.</div>' : '<div class="aviso ouro">Tudo bem. Sua resposta já aparece para o líder do ministério.</div>');
    }));
  };
  desenhar();
}

export { esc_sel };
