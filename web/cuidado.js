// Livres Connect · pedidos de oração e atendimento pastoral
// Aba interna "Oração e atendimento" e página pública #/oracao/<igreja>
// (QR Code), onde qualquer pessoa pede oração ou pede para conversar com um pastor.
import { modal, fecharModal, mh, $v, erroEm, hoje, br, brCurta, linkWhats, fmtTel, qrSvg, qrPng, abrirFicha } from './pessoas.js';

let C;
export function instalar(ctx) { C = ctx; }

export const ASSUNTOS = { aconselhamento: 'Aconselhamento', oracao: 'Oração pessoal', visita: 'Visita', familia: 'Família', casamento: 'Casamento', batismo: 'Batismo', outro: 'Outro assunto' };
const ST_AT = { pendente: ['Aguardando', 'p-warn'], agendado: ['Agendado', 'p-acc'], realizado: ['Realizado', 'p-ok'], cancelado: ['Cancelado', 'p-neu'] };
const linkOracao = ig => location.origin + location.pathname + '#/oracao/' + ig;
const dataHora = s => s ? new Date(s).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
const pastor = () => C.pode(['pastor', 'pastora']);
let filtroP = 'aberto';

/* ------------------------------------------------------------------ */
/* aba interna                                                         */
/* ------------------------------------------------------------------ */
export async function telaCuidado(main) {
  const { esc, sb } = C, ig = C.S.igrejaId, link = linkOracao(ig);
  main.innerHTML = C.cab('Oração e atendimento', 'Pedidos de oração e pedidos para conversar com um pastor. Quem pede escolhe se só os pastores leem ou se a equipe de intercessão também.',
    `<button class="btn" data-novo-pedido>Registrar pedido</button>${C.pode(['pastor', 'secretaria', 'lider']) ? '<button class="btn pri" data-novo-at>Novo atendimento</button>' : ''}`) +
    `<div class="kpis" id="o-kpis"></div>
    <section class="panel" id="o-at" hidden><h2>Atendimento pastoral</h2><div id="o-at-lista"></div></section>
    <div class="grid">
      <section class="panel c8"><h2>Pedidos de oração <span class="chips">${[['aberto', 'Orando'], ['respondido', 'Respondidos'], ['arquivado', 'Arquivados']].map(([k, l]) => `<button class="chip ${filtroP === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</span></h2>
        <div id="o-lista"><div class="carregando">Carregando…</div></div></section>
      <section class="panel c4"><h2>QR Code de oração</h2>
        <div class="qr-grande">${qrSvg(link, 5)}</div>
        <p style="margin:10px 0">Coloque na recepção, no boletim ou no telão. A pessoa pede oração ou pede para conversar com um pastor, sem precisar de cadastro.</p>
        <div class="acts"><a class="btn sm" href="${esc(qrPng(link))}" download="qr-pedidos-de-oracao.png">Baixar QR Code</a><button class="btn sm" data-copiar>Copiar link</button><a class="btn sm" href="${esc(link)}" target="_blank" rel="noopener">Abrir página</a></div></section>
    </div>`;

  const [{ data: ps, error }, { data: ats }, { data: eq }] = await Promise.all([
    sb.from('pedidos_oracao').select('*').eq('igreja_id', ig).order('criado_em', { ascending: false }).limit(300),
    sb.from('atendimentos').select('*').eq('igreja_id', ig).order('criado_em', { ascending: false }).limit(200),
    sb.rpc('equipe_acompanhamento', { p_igreja: ig })
  ]);
  if (error) return erroEm('o-lista', error);
  const pedidos = ps || [], atend = ats || [], equipe = eq || [];
  const nomeEq = id => (equipe.find(e => e.user_id === id) || {}).nome || '—';
  const semana = Date.now() + 7 * 864e5;
  document.getElementById('o-kpis').innerHTML = [
    ['Orando', pedidos.filter(p => p.status === 'aberto').length, 'pedidos em aberto'],
    ['Respondidos', pedidos.filter(p => p.status === 'respondido').length, 'testemunhos'],
    ...(atend.length || pastor() ? [['Atendimentos aguardando', atend.filter(a => a.status === 'pendente').length, 'precisam de retorno'],
      ['Agendados', atend.filter(a => a.status === 'agendado' && new Date(a.agendado_para).getTime() < semana).length, 'nos próximos 7 dias']] : [])
  ].map(([l, v, s]) => `<div class="kpi"><span class="l">${l}</span><span class="v">${v}</span><span class="s">${s}</span></div>`).join('');

  const desenharPedidos = () => {
    const l = pedidos.filter(p => p.status === filtroP);
    document.getElementById('o-lista').innerHTML = l.length ? `<div class="pedidos">${l.map(p => {
      const w = linkWhats(p.telefone, `Olá, ${p.nome.split(' ')[0]}! Aqui é da ${C.igrejaAtual().nome}. Recebemos seu pedido de oração e estamos orando por você. `);
      return `<article class="pedido">
        <header><b>${esc(p.nome)}</b><span class="muted">${brCurta(p.criado_em)}${p.origem === 'publico' ? ' · pelo QR Code' : p.origem === 'portal' ? ' · pelo portal' : ''}</span>
          ${p.compartilhar ? (p.mural ? '<span class="pill p-acc">mural</span>' : '') : `<span class="pill p-ouro">${C.icon('seguranca')} só pastores</span>`}</header>
        <p>${esc(p.pedido)}</p>
        ${p.testemunho ? `<div class="testemunho"><b>Testemunho:</b> ${esc(p.testemunho)}</div>` : ''}
        <footer><span class="muted">🙏 ${p.oracoes} ${p.oracoes === 1 ? 'oração' : 'orações'}</span>
          ${p.status === 'aberto' ? `<button class="btn sm" data-orei="${p.id}">Orei</button>` : ''}
          ${w ? `<a class="btn sm whats" href="${esc(w)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
          ${p.pessoa_id ? `<button class="btn sm" data-ficha="${p.pessoa_id}">Ficha</button>` : ''}
          ${p.status === 'aberto' ? `<button class="btn sm" data-respondido="${p.id}">Deus respondeu</button><button class="btn sm ghost" data-st="arquivado" data-id="${p.id}">Arquivar</button>` : `<button class="btn sm ghost" data-st="aberto" data-id="${p.id}">Voltar a orar</button>`}</footer>
      </article>`; }).join('')}</div>`
      : `<div class="vazio">${filtroP === 'aberto' ? 'Nenhum pedido em aberto. Os pedidos do QR Code e do Portal do Membro aparecem aqui.' : 'Nenhum pedido nesta lista.'}</div>`;
  };
  desenharPedidos();

  // Atendimentos: só pastor, pastora e quem foi designado
  if (pastor() || atend.length) {
    document.getElementById('o-at').hidden = false;
    const ordem = { pendente: 0, agendado: 1, realizado: 2, cancelado: 3 };
    const l = [...atend].sort((a, b) => ordem[a.status] - ordem[b.status] || (a.agendado_para || a.criado_em).localeCompare(b.agendado_para || b.criado_em)).slice(0, 60);
    document.getElementById('o-at-lista').innerHTML = l.length ? `<div class="tw"><table><thead><tr><th>Pessoa</th><th>Assunto</th><th>Quando</th><th>Quem atende</th><th>Situação</th><th></th></tr></thead><tbody>
      ${l.map(a => `<tr><td><b style="font-weight:600">${esc(a.nome)}</b>${a.telefone ? `<small class="muted num" style="display:block">${esc(fmtTel(a.telefone))}</small>` : ''}</td>
        <td>${ASSUNTOS[a.assunto]}${a.mensagem ? `<small class="muted" style="display:block;max-width:34ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.mensagem)}</small>` : ''}</td>
        <td>${a.agendado_para ? dataHora(a.agendado_para) + (a.local ? `<small class="muted" style="display:block">${esc(a.local)}</small>` : '') : `<span class="muted">${a.preferencia ? 'prefere: ' + esc(a.preferencia) : 'pedido em ' + brCurta(a.criado_em)}</span>`}</td>
        <td>${a.atendente_id ? esc(nomeEq(a.atendente_id)) : '<span class="muted">a definir</span>'}</td>
        <td><span class="pill ${ST_AT[a.status][1]}">${ST_AT[a.status][0]}</span></td>
        <td class="acoes"><button class="btn sm ${a.status === 'pendente' ? 'pri' : ''}" data-at="${a.id}">${a.status === 'pendente' ? 'Responder' : 'Abrir'}</button></td></tr>`).join('')}</tbody></table></div>`
      : '<div class="vazio">Nenhum pedido de atendimento. Quando alguém pedir para conversar com um pastor pelo QR Code ou pelo portal, aparece aqui.</div>';
  }

  const recarregar = () => telaCuidado(main);
  main.onclick = async e => {
    const f = e.target.closest('[data-f]'); if (f) { filtroP = f.dataset.f; main.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', x === f)); return desenharPedidos(); }
    const or = e.target.closest('[data-orei]');
    if (or) return C.ocupado(or, async () => {
      const { data: n, error: er } = await sb.rpc('orar_por', { p_pedido: or.dataset.orei });
      if (er) return C.toast(C.traduzErro(er));
      const p = pedidos.find(x => x.id === or.dataset.orei); p.oracoes = n; desenharPedidos(); C.toast('Obrigado por orar! 🙏');
    });
    const st = e.target.closest('[data-st]');
    if (st) { const { error: er } = await sb.from('pedidos_oracao').update({ status: st.dataset.st }).eq('id', st.dataset.id); return er ? C.toast(C.traduzErro(er)) : (C.toast(st.dataset.st === 'arquivado' ? 'Pedido arquivado.' : 'Pedido de volta à lista de oração.'), recarregar()); }
    const rp = e.target.closest('[data-respondido]'); if (rp) return respondido(pedidos.find(x => x.id === rp.dataset.respondido), recarregar);
    const fi = e.target.closest('[data-ficha]'); if (fi) return abrirFicha(fi.dataset.ficha, recarregar);
    const at = e.target.closest('[data-at]'); if (at) return abrirAtendimento(atend.find(x => x.id === at.dataset.at), equipe, recarregar);
    if (e.target.closest('[data-novo-pedido]')) return novoPedido(recarregar);
    if (e.target.closest('[data-novo-at]')) return novoAtendimento(equipe, recarregar);
    if (e.target.closest('[data-copiar]')) { try { await navigator.clipboard.writeText(link); C.toast('Link copiado.'); } catch (er) { prompt('Copie o link:', link); } }
  };
}

function respondido(p, depois) {
  const md = modal(mh('Deus respondeu!', `Pedido de ${C.esc(p.nome)}`) + `
    <form class="f" id="f-resp" style="grid-template-columns:1fr">
      <div class="fld"><label for="rs-t">Testemunho <span class="muted">(opcional)</span></label><textarea id="rs-t" rows="3" maxlength="2000" placeholder="Ex.: a cirurgia correu bem e ela já está em casa"></textarea></div>
      <div id="rs-msg"></div>
      <div class="fa"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn pri" type="submit">Salvar</button></div></form>`);
  md.querySelector('#f-resp').onsubmit = e => { e.preventDefault(); C.ocupado(e.target.querySelector('[type=submit]'), async () => {
    const { error } = await C.sb.from('pedidos_oracao').update({ status: 'respondido', testemunho: $v('rs-t') || null }).eq('id', p.id);
    if (error) return erroEm('rs-msg', error);
    fecharModal(); C.toast('Glória a Deus! Pedido marcado como respondido.'); depois();
  }); };
}

function novoPedido(depois) {
  const md = modal(mh('Registrar pedido de oração', 'Para pedidos recebidos pessoalmente ou por telefone.') + `
    <form class="f" id="f-np">
      <div class="fld"><label for="po-nome">Nome de quem pediu</label><input id="po-nome" required minlength="2"></div>
      <div class="fld"><label for="po-tel">WhatsApp <span class="muted">(opcional)</span></label><input id="po-tel" inputmode="tel"></div>
      <div class="fld full"><label for="po-ped">Pedido</label><textarea id="po-ped" rows="3" required minlength="3" maxlength="2000"></textarea></div>
      <div class="fld full"><label for="po-priv">Quem pode ler</label><select id="po-priv"><option value="equipe">Pastores e equipe de intercessão</option><option value="mural">Equipe e mural da igreja (só o primeiro nome)</option><option value="pastores">Só os pastores (confidencial)</option></select></div>
      <div id="po-msg" class="fld full"></div>
      <div class="fa"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn pri" type="submit">Registrar</button></div></form>`);
  md.querySelector('#f-np').onsubmit = e => { e.preventDefault(); C.ocupado(e.target.querySelector('[type=submit]'), async () => {
    const pv = $v('po-priv');
    const { error } = await C.sb.from('pedidos_oracao').insert({ igreja_id: C.S.igrejaId, nome: $v('po-nome'), telefone: $v('po-tel') || null, pedido: $v('po-ped'), compartilhar: pv !== 'pastores', mural: pv === 'mural', origem: 'equipe' });
    if (error) return erroEm('po-msg', error);
    fecharModal(); C.toast('Pedido registrado.'); filtroP = 'aberto'; depois();
  }); };
}

function novoAtendimento(equipe, depois) {
  const { esc } = C;
  const md = modal(mh('Novo atendimento', 'Registre um pedido de conversa recebido pessoalmente.') + `
    <form class="f" id="f-na">
      <div class="fld"><label for="na-nome">Nome</label><input id="na-nome" required minlength="2"></div>
      <div class="fld"><label for="na-tel">WhatsApp</label><input id="na-tel" inputmode="tel"></div>
      <div class="fld"><label for="na-ass">Assunto</label><select id="na-ass">${Object.entries(ASSUNTOS).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
      <div class="fld"><label for="na-pref">Melhor dia e horário</label><input id="na-pref" placeholder="Ex.: terça à noite"></div>
      <div class="fld full"><label for="na-msg">Observação <span class="muted">(confidencial)</span></label><textarea id="na-msg" rows="2" maxlength="2000"></textarea></div>
      ${pastor() ? `<div class="fld full"><label for="na-at">Quem vai atender</label><select id="na-at"><option value="">A definir</option>${equipe.map(e => `<option value="${e.user_id}">${esc(e.nome)}</option>`).join('')}</select></div>` : ''}
      <div id="na-m" class="fld full"></div>
      <div class="fa"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn pri" type="submit">Registrar</button></div></form>`);
  md.querySelector('#f-na').onsubmit = e => { e.preventDefault(); C.ocupado(e.target.querySelector('[type=submit]'), async () => {
    const reg = { igreja_id: C.S.igrejaId, nome: $v('na-nome'), telefone: $v('na-tel') || null, assunto: $v('na-ass'), preferencia: $v('na-pref') || null, mensagem: $v('na-msg') || null, origem: 'equipe' };
    if (pastor()) reg.atendente_id = $v('na-at') || null;
    const { error } = await C.sb.from('atendimentos').insert(reg);
    if (error) return erroEm('na-m', error);
    fecharModal(); C.toast(pastor() ? 'Atendimento registrado.' : 'Atendimento registrado. O pastor já pode ver.'); depois();
  }); };
}

function abrirAtendimento(a, equipe, depois) {
  const { esc } = C;
  const local = a.agendado_para ? new Date(a.agendado_para) : null;
  const pad = n => String(n).padStart(2, '0');
  const valorLocal = local ? `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}` : '';
  const md = modal(mh(esc(a.nome), `${ASSUNTOS[a.assunto]} · pedido em ${br(a.criado_em.slice(0, 10))} · <span class="pill ${ST_AT[a.status][1]}">${ST_AT[a.status][0]}</span>`) + `
    ${a.mensagem ? `<div class="restrito"><div class="sec-t">${C.icon('seguranca')} Mensagem · confidencial</div>${esc(a.mensagem)}</div>` : ''}
    ${a.preferencia ? `<p style="margin:0"><b>Prefere:</b> ${esc(a.preferencia)}</p>` : ''}
    <form class="f" id="f-ag">
      <div class="fld"><label for="ag-qd">Data e hora</label><input id="ag-qd" type="datetime-local" value="${valorLocal}"></div>
      <div class="fld"><label for="ag-loc">Local</label><input id="ag-loc" value="${esc(a.local || '')}" placeholder="Ex.: gabinete pastoral"></div>
      ${pastor() ? `<div class="fld full"><label for="ag-at">Quem vai atender</label><select id="ag-at"><option value="">A definir</option>${equipe.map(e => `<option value="${e.user_id}" ${e.user_id === a.atendente_id ? 'selected' : ''}>${esc(e.nome)}</option>`).join('')}</select></div>` : ''}
      <div id="ag-msg" class="fld full"></div>
      <div class="fa">${a.status !== 'cancelado' ? '<button type="button" class="btn danger" data-st="cancelado" style="margin-right:auto">Cancelar</button>' : ''}${a.status === 'agendado' ? '<button type="button" class="btn" data-st="realizado">Marcar como realizado</button>' : ''}<button class="btn pri" type="submit">Agendar e avisar</button></div>
    </form>
    ${a.pessoa_id ? `<p class="muted" style="margin:0;font-size:13px">Esta pessoa tem cadastro. Depois da conversa, registre o que for preciso nas <button class="lk" data-ficha="${a.pessoa_id}">anotações pastorais da ficha</button>.</p>` : ''}`, false, depois);
  md.querySelector('#f-ag').onsubmit = e => { e.preventDefault(); C.ocupado(e.target.querySelector('[type=submit]'), async () => {
    if (!$v('ag-qd')) return erroEm('ag-msg', 'Escolha a data e a hora.');
    const quando = new Date($v('ag-qd'));
    const upd = { status: 'agendado', agendado_para: quando.toISOString(), local: $v('ag-loc') || null };
    if (pastor()) upd.atendente_id = $v('ag-at') || null;
    const { error } = await C.sb.from('atendimentos').update(upd).eq('id', a.id);
    if (error) return erroEm('ag-msg', error);
    const quem = upd.atendente_id ? (equipe.find(x => x.user_id === upd.atendente_id) || {}).nome : null;
    const w = linkWhats(a.telefone, `Olá, ${a.nome.split(' ')[0]}! Aqui é da ${C.igrejaAtual().nome}. Sua conversa${quem ? ' com ' + quem : ''} ficou marcada para ${dataHora(upd.agendado_para)}${upd.local ? ', no ' + upd.local : ''}. Se precisar mudar, é só responder esta mensagem. Deus abençoe!`);
    fecharModal(); C.toast('Atendimento agendado.');
    if (w) window.open(w, '_blank', 'noopener');
    depois();
  }); };
  md.querySelectorAll('[data-st]').forEach(b => b.onclick = () => C.ocupado(b, async () => {
    if (b.dataset.st === 'cancelado' && !confirm('Cancelar este atendimento?')) return;
    const { error } = await C.sb.from('atendimentos').update({ status: b.dataset.st }).eq('id', a.id);
    if (error) return erroEm('ag-msg', error);
    fecharModal(); C.toast(b.dataset.st === 'realizado' ? 'Atendimento realizado.' : 'Atendimento cancelado.'); depois();
  }));
  const fi = md.querySelector('[data-ficha]'); if (fi) fi.onclick = () => abrirFicha(a.pessoa_id, depois);
}

/* ------------------------------------------------------------------ */
/* página pública                                                      */
/* ------------------------------------------------------------------ */
export async function telaOracaoPublica(ig) {
  const { esc, sb } = C, app = document.getElementById('app');
  const { data } = await sb.rpc('igreja_publica', { p_igreja: ig });
  const igreja = data && data[0];
  const casca = corpo => `<div class="auth"><div class="auth-card ficha-pub">
    <div class="brand"><div class="mark"><svg viewBox="0 0 24 24"><path d="M12 4v16M6 10h12"/></svg></div><div><b>${igreja ? esc(igreja.nome) : 'Livres Connect'}</b><small>Oração e atendimento</small></div></div>${corpo}</div></div>`;
  if (!igreja) { app.innerHTML = casca('<h1>Página indisponível</h1><p>Este QR Code não está ativo. Fale com a recepção.</p>'); return; }
  let aba = 'oracao';
  const desenhar = () => {
    app.innerHTML = casca(`<div class="chips abas-pub"><button class="chip ${aba === 'oracao' ? 'on' : ''}" data-aba="oracao">Pedir oração</button><button class="chip ${aba === 'pastor' ? 'on' : ''}" data-aba="pastor">Conversar com um pastor</button></div>
      ${aba === 'oracao' ? `<div><h1>Como podemos orar por você?</h1><p>Escreva seu pedido. Vamos orar por ele com carinho.</p></div>
      <form class="f" id="f-pub" style="grid-template-columns:1fr">
        <div class="fld"><label for="op-nome">Seu nome</label><input id="op-nome" autocomplete="name" required minlength="2" maxlength="120"></div>
        <div class="fld"><label for="op-tel">WhatsApp <span class="muted">(opcional, se quiser uma palavra nossa)</span></label><input id="op-tel" type="tel" inputmode="tel" autocomplete="tel" placeholder="(47) 99999-0000"></div>
        <div class="fld"><label for="op-ped">Seu pedido</label><textarea id="op-ped" rows="4" required minlength="3" maxlength="2000"></textarea></div>
        <fieldset class="privacidade"><legend>Quem pode ler o seu pedido?</legend>
          <label><input type="radio" name="op-priv" value="equipe" checked> <span>Os pastores e a equipe de intercessão</span></label>
          <label><input type="radio" name="op-priv" value="mural"> <span>Também pode aparecer no mural de oração da igreja, só com o primeiro nome</span></label>
          <label><input type="radio" name="op-priv" value="pastores"> <span>Só os pastores (confidencial)</span></label></fieldset>
        <label class="chk"><input type="checkbox" id="op-lgpd" required> Autorizo a ${esc(igreja.nome)} a guardar este pedido e meu contato para orar e falar comigo.</label>
        <div id="op-msg"></div>
        <button class="btn pri full" type="submit">Enviar pedido</button></form>`
      : `<div><h1>Quer conversar com um pastor?</h1><p>Deixe seu contato. Um pastor vai falar com você pelo WhatsApp para combinar o melhor horário.</p></div>
      <form class="f" id="f-pub" style="grid-template-columns:1fr">
        <div class="fld"><label for="op-nome">Seu nome</label><input id="op-nome" autocomplete="name" required minlength="2" maxlength="120"></div>
        <div class="fld"><label for="op-tel">WhatsApp com DDD</label><input id="op-tel" type="tel" inputmode="tel" autocomplete="tel" required placeholder="(47) 99999-0000"></div>
        <div class="fld"><label for="op-ass">Assunto</label><select id="op-ass">${Object.entries(ASSUNTOS).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
        <div class="fld"><label for="op-ped">Quer adiantar algo? <span class="muted">(opcional e confidencial)</span></label><textarea id="op-ped" rows="3" maxlength="2000"></textarea></div>
        <div class="fld"><label for="op-pref">Melhor dia e horário <span class="muted">(opcional)</span></label><input id="op-pref" maxlength="200" placeholder="Ex.: dias de semana, depois das 18h"></div>
        <label class="chk"><input type="checkbox" id="op-lgpd" required> Autorizo a ${esc(igreja.nome)} a usar meu contato para marcar esta conversa. O que eu escrever fica só com os pastores.</label>
        <div id="op-msg"></div>
        <button class="btn pri full" type="submit">Enviar</button></form>`}`);
    app.querySelectorAll('[data-aba]').forEach(b => b.onclick = () => { aba = b.dataset.aba; desenhar(); });
    app.querySelector('#f-pub').onsubmit = e => {
      e.preventDefault();
      C.ocupado(e.target.querySelector('[type=submit]'), async () => {
        const lgpd = document.getElementById('op-lgpd').checked;
        let r;
        if (aba === 'oracao') {
          const pv = app.querySelector('[name=op-priv]:checked').value;
          r = await sb.rpc('registrar_pedido_oracao', { p_igreja: ig, p_nome: $v('op-nome'), p_telefone: $v('op-tel') || null, p_pedido: $v('op-ped'), p_compartilhar: pv !== 'pastores', p_mural: pv === 'mural', p_consentimento: lgpd });
        } else {
          r = await sb.rpc('solicitar_atendimento', { p_igreja: ig, p_nome: $v('op-nome'), p_telefone: $v('op-tel'), p_assunto: $v('op-ass'), p_mensagem: $v('op-ped') || null, p_preferencia: $v('op-pref') || null, p_consentimento: lgpd });
        }
        if (r.error) return erroEm('op-msg', r.error);
        app.innerHTML = casca(aba === 'oracao'
          ? '<div><h1>Recebemos seu pedido 🙏</h1><p>Vamos orar por você. "Lancem sobre Deus toda a sua ansiedade, porque ele tem cuidado de vocês." (1 Pedro 5.7)</p></div>'
          : '<div><h1>Pedido enviado</h1><p>Um pastor vai falar com você pelo WhatsApp nos próximos dias para combinar a conversa.</p></div>');
        app.querySelector('.auth-card').insertAdjacentHTML('beforeend', '<button class="btn full" id="op-outro">Enviar outro pedido</button>');
        document.getElementById('op-outro').onclick = desenhar;
      });
    };
  };
  desenhar();
}
