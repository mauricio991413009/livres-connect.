// Livres Connect · Portal do Membro
// Página pessoal aberta por link secreto (#/membro/<código>), sem senha.
// Também traz as ferramentas da equipe: enviar o link pela ficha e, na
// Comunicação, enviar os links para todos os membros.
import { modal, fecharModal, mh, $v, erroEm, hoje, br, brCurta, linkWhats, fmtTel, qrSvg } from './pessoas.js';
import { LICOES, linkRoteiro } from './discipulado.js';
import { ASSUNTOS } from './cuidado.js';
import { ligarInstalar } from './instalar.js';

let C;
export function instalar(ctx) { C = ctx; }

const linkPortal = t => location.origin + location.pathname + '#/membro/' + t;
const msgPortal = (nome, t) => `Olá, ${(nome || '').split(' ')[0]}! Este é o seu Portal do Membro da ${C.igrejaAtual().nome}: carteirinha, escalas, agenda, avisos e pedidos de oração, tudo no celular. O link é só seu, não compartilhe: ${linkPortal(t)}`;
const guardarToken = t => { try { localStorage.setItem('lc-portal', t); } catch (e) { /* sem armazenamento */ } };
export const tokenGuardado = () => { try { return localStorage.getItem('lc-portal'); } catch (e) { return null; } };
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const SEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const dt = d => new Date(d + 'T12:00:00');

/* ------------------------------------------------------------------ */
/* equipe: enviar o link de uma pessoa (botão na ficha)                */
/* ------------------------------------------------------------------ */
export async function enviarPortal(p, situacao, depois) {
  const { esc } = C;
  if (situacao && !confirm(`${p.nome.split(' ')[0]} já recebeu um link em ${brCurta(situacao.criado_em)}. Gerar um link novo faz o anterior parar de funcionar. Continuar?`)) return;
  const { data: t, error } = await C.sb.rpc('portal_gerar_link', { p_pessoa: p.id });
  if (error) return C.toast(C.traduzErro(error));
  const link = linkPortal(t), w = linkWhats(p.telefone, msgPortal(p.nome, t));
  const md = modal(mh('Portal do Membro', `Link pessoal de ${esc(p.nome)}`) + `
    <div class="duas" style="align-items:center">
      <div class="qr-grande" style="max-width:200px">${qrSvg(link, 4)}</div>
      <div><p style="margin:0 0 10px">Envie pelo WhatsApp ou peça para ${esc(p.nome.split(' ')[0])} apontar a câmera do celular para o QR Code agora.</p>
        <p class="muted" style="font-size:13px;margin:0 0 10px">O link é pessoal e não tem senha: quem tiver o link entra como esta pessoa. Se ela perder o celular, gere um link novo aqui.</p>
        <div class="acts">${w ? `<a class="btn pri whats-pri" href="${esc(w)}" target="_blank" rel="noopener">Enviar pelo WhatsApp</a>` : ''}<button class="btn" data-copiar>Copiar link</button></div></div></div>
    <div class="fa"><button class="btn" data-fechar>Fechar</button></div>`, false, depois);
  md.querySelector('[data-copiar]').onclick = async () => { try { await navigator.clipboard.writeText(link); C.toast('Link copiado.'); } catch (e) { prompt('Copie o link:', link); } };
}

export async function blocoFicha(p) {
  const { data } = await C.sb.rpc('portal_situacao', { p_igreja: p.igreja_id });
  const s = (data || []).find(x => x.pessoa_id === p.id) || null;
  return { situacao: s, texto: s ? `Portal enviado em ${brCurta(s.criado_em)}${s.ultimo_acesso ? ' · último acesso ' + brCurta(s.ultimo_acesso) : ' · ainda não abriu'}` : '' };
}

/* ------------------------------------------------------------------ */
/* equipe: enviar os links para todos (seção na Comunicação)           */
/* ------------------------------------------------------------------ */
export async function secaoEnvio(el) {
  if (!el || !C.pode(['pastor', 'secretaria', 'lider'])) return;
  const { esc, sb } = C;
  const [{ data: ps }, { data: sit0 }] = await Promise.all([
    sb.from('pessoas').select('id,nome,telefone,etapa,igreja_id').eq('igreja_id', C.S.igrejaId).eq('situacao', 'ativo').gte('etapa', 4).order('nome'),
    sb.rpc('portal_situacao', { p_igreja: C.S.igrejaId })
  ]);
  const membros = (ps || []).filter(p => (p.telefone || '').replace(/\D/g, '').length >= 10);
  let sit = sit0 || [];
  const st = id => sit.find(x => x.pessoa_id === id);
  let filtro = 'faltam';
  el.innerHTML = `<section class="panel"><h2>Portal do Membro <span class="chips"><button class="chip on" data-pf="faltam">Ainda não receberam</button><button class="chip" data-pf="todos">Todos</button></span></h2>
    <p class="muted" style="margin:-4px 0 12px">Cada membro recebe um link só dele, sem senha. Toque em "Enviar" e o WhatsApp abre com a mensagem pronta.</p><div id="pt-lista"></div></section>`;
  const desenhar = () => {
    const l = membros.filter(p => filtro === 'todos' || !st(p.id));
    const enviados = membros.filter(p => st(p.id)).length, abriram = membros.filter(p => (st(p.id) || {}).ultimo_acesso).length;
    el.querySelector('#pt-lista').innerHTML = `<p style="margin:0 0 8px;font-size:14px"><b>${enviados}</b> de ${membros.length} membros com WhatsApp já receberam o link · <b>${abriram}</b> já abriram.</p>` +
      (l.length ? `<div class="envios">${l.map(p => { const s = st(p.id);
        return `<div class="linha ${s ? 'feito' : ''}"><div class="cresce"><b style="font-weight:600">${esc(p.nome)}</b><small class="muted" style="display:block">${s ? `enviado em ${brCurta(s.criado_em)} · ${s.ultimo_acesso ? 'abriu em ' + brCurta(s.ultimo_acesso) : 'ainda não abriu'}` : esc(fmtTel(p.telefone))}</small></div>
          <button class="btn sm ${s ? '' : 'whats'}" data-pe="${p.id}">${s ? 'Enviar de novo' : 'Enviar'}</button></div>`; }).join('')}</div>`
        : `<div class="vazio">${membros.length ? 'Todos os membros já receberam o link. 🎉' : 'Nenhum membro com WhatsApp cadastrado.'}</div>`);
  };
  desenhar();
  el.onclick = async e => {
    const f = e.target.closest('[data-pf]'); if (f) { filtro = f.dataset.pf; el.querySelectorAll('[data-pf]').forEach(x => x.classList.toggle('on', x === f)); return desenhar(); }
    const b = e.target.closest('[data-pe]'); if (!b) return;
    const p = membros.find(x => x.id === b.dataset.pe), s = st(p.id);
    if (s && !confirm(`Gerar um link novo para ${p.nome.split(' ')[0]}? O link anterior para de funcionar.`)) return;
    const janela = window.open('', '_blank');  // abre já no toque (o celular bloqueia janelas abertas depois)
    const { data: t, error } = await sb.rpc('portal_gerar_link', { p_pessoa: p.id });
    if (error) { if (janela) janela.close(); return C.toast(C.traduzErro(error)); }
    const w = linkWhats(p.telefone, msgPortal(p.nome, t));
    if (janela) janela.location.href = w; else location.href = w;
    sit = sit.filter(x => x.pessoa_id !== p.id).concat({ pessoa_id: p.id, criado_em: new Date().toISOString(), ultimo_acesso: null });
    desenhar();
  };
}

/* ------------------------------------------------------------------ */
/* o portal                                                            */
/* ------------------------------------------------------------------ */
let aba = 'inicio';
export async function telaPortal(token) {
  const { esc, sb } = C, app = document.getElementById('app');
  const { data: D, error } = await sb.rpc('portal_dados', { p_token: token });
  if (error || !D) {
    app.innerHTML = `<div class="auth"><div class="auth-card"><h1>Link sem validade</h1><p>${esc(C.traduzErro(error || 'Este link do portal não vale mais.'))}</p><p class="muted">Peça à secretaria da igreja um link novo pelo WhatsApp.</p></div></div>`;
    try { if (localStorage.getItem('lc-portal') === token) localStorage.removeItem('lc-portal'); } catch (e) { /* */ }
    return;
  }
  guardarToken(token);
  // Ao instalar a partir desta página, o aplicativo abre direto no portal deste membro
  try {
    const base = location.origin + location.pathname.replace(/[^/]*$/, '');
    const man = { id: '/membro', name: 'Portal do Membro · ' + D.igreja.nome, short_name: 'Minha igreja', start_url: linkPortal(token), scope: base,
      display: 'standalone', orientation: 'portrait', background_color: '#eef2ef', theme_color: '#0d6b61', lang: 'pt-BR',
      icons: [{ src: base + 'icones/icone-192.png', sizes: '192x192', type: 'image/png' }, { src: base + 'icones/icone-512.png', sizes: '512x512', type: 'image/png' },
        { src: base + 'icones/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }] };
    const l = document.querySelector('link[rel=manifest]'); if (l) l.href = 'data:application/manifest+json,' + encodeURIComponent(JSON.stringify(man));
    const t = document.querySelector('meta[name=apple-mobile-web-app-title]'); if (t) t.content = 'Minha igreja';
  } catch (e) { /* segue sem trocar */ }
  const P = D.pessoa, IG = D.igreja, primeiro = P.nome.split(' ')[0];
  const recarregar = () => telaPortal(token);
  const acao = async (fn, args, ok) => { const { error: er } = await sb.rpc(fn, { p_token: token, ...args }); if (er) { C.toast(C.traduzErro(er)); return false; } if (ok) C.toast(ok); return true; };

  const ETAPAS = C.ETAPAS;
  const cartao = (t, corpo, extra = '') => `<section class="pcard ${extra}"><h2>${t}</h2>${corpo}</section>`;
  const dataBox = d => `<div class="datebox"><b>${dt(d).getDate()}</b><span>${MESES[dt(d).getMonth()]}</span></div>`;
  const hora = h => h ? h.slice(0, 5).replace(':00', 'h').replace(':', 'h') : '';

  const telaInicio = () => {
    let h = '';
    if (D.escalas.length) h += cartao('Minhas escalas', D.escalas.map(s => `<div class="pitem">${dataBox(s.data)}<div class="cresce"><b>${esc(s.evento)}</b><small>${SEM[dt(s.data).getDay()]} ${hora(s.hora)} · ${esc(s.ministerio)}${s.local ? ' · ' + esc(s.local) : ''}</small></div>
      ${s.status === 'pendente' ? `<div class="pbotoes"><button class="btn sm pri" data-esc="${s.token}" data-st="confirmado">Confirmar</button><button class="btn sm" data-esc="${s.token}" data-st="recusado">Não posso</button></div>`
        : `<span class="pill ${s.status === 'confirmado' ? 'p-ok' : 'p-bad'}">${s.status === 'confirmado' ? 'confirmado' : 'não posso'}</span>`}</div>`).join(''));
    if (D.avisos.length) h += cartao('Avisos', D.avisos.map(a => `<div class="paviso"><b>${esc(a.titulo)}</b><small class="muted">${brCurta(a.criado_em)}</small><p>${esc(a.texto.replace(/\{nome\}/gi, primeiro)).replace(/\n/g, '<br>')}</p></div>`).join(''));
    if (D.atendimentos.length) h += cartao('Conversa com o pastor', D.atendimentos.map(a => `<div class="pitem"><div class="cresce"><b>${ASSUNTOS[a.assunto] || 'Atendimento'}</b><small>${a.status === 'agendado' ? 'Marcado para ' + new Date(a.agendado_para).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) + (a.local ? ' · ' + esc(a.local) : '') : 'Pedido enviado. O pastor vai falar com você.'}</small></div><span class="pill ${a.status === 'agendado' ? 'p-acc' : 'p-warn'}">${a.status === 'agendado' ? 'marcado' : 'aguardando'}</span></div>`).join(''));
    if (D.discipulos.length) h += cartao('Meus discípulos', D.discipulos.map(d => { const feitas = d.licoes || [], prox = LICOES.findIndex((_, i) => !feitas.includes(i + 1)) + 1;
      const w = linkWhats(d.telefone, `Olá, ${d.nome.split(' ')[0]}! `);
      return `<div class="pdisc"><div class="pitem" style="border:0;padding:0"><div class="cresce"><b>${esc(d.nome)}</b><small>${feitas.length} de 8 lições${d.ultimo ? ' · último encontro ' + brCurta(d.ultimo) : ''}</small></div>${w ? `<a class="btn sm whats" href="${esc(w)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}</div>
        <div class="licoes">${LICOES.map((_, i) => `<i class="${feitas.includes(i + 1) ? 'd' : ''}">${i + 1}</i>`).join('')}</div>
        <details><summary>Registrar encontro</summary><form class="f penc" data-disc="${d.id}" style="grid-template-columns:1fr">
          <div class="fld"><label>Data</label><input type="date" name="data" value="${hoje()}" max="${hoje()}" required></div>
          <div class="fld"><label>Lição estudada</label><select name="licao"><option value="">Só conversa e oração</option>${LICOES.map((l, i) => `<option value="${i + 1}" ${i + 1 === prox ? 'selected' : ''}>${i + 1}. ${esc(l.titulo)}${feitas.includes(i + 1) ? ' ✓' : ''}</option>`).join('')}</select></div>
          <div class="fld"><label>Como foi <span class="muted">(opcional)</span></label><textarea name="resumo" rows="2" maxlength="1000"></textarea></div>
          <button class="btn pri" type="submit">Salvar encontro</button></form></details>
        ${prox ? `<a class="lnk" href="${esc(linkRoteiro(IG.id, prox))}" target="_blank" rel="noopener">Roteiro da lição ${prox} ›</a>` : ''}</div>`; }).join(''));
    if (D.discipulado) { const n = (D.discipulado.licoes || []).length, w = linkWhats(D.discipulado.telefone, `Olá, ${D.discipulado.discipulador.split(' ')[0]}! `);
      h += cartao('Meu discipulado', `<div class="pitem" style="border:0;padding:0"><div class="cresce"><b>Com ${esc(D.discipulado.discipulador)}</b><small>${D.discipulado.status === 'concluido' ? 'Concluído 🎉' : n + ' de 8 lições'}</small></div>${w && D.discipulado.status === 'ativo' ? `<a class="btn sm whats" href="${esc(w)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}</div>
        <div class="licoes">${LICOES.map((_, i) => `<i class="${(D.discipulado.licoes || []).includes(i + 1) ? 'd' : ''}">${i + 1}</i>`).join('')}</div>`); }
    if (D.escola.length) h += cartao('Escola de Obreiros', `<p style="margin:0 0 8px"><a class="lnk" href="#/apostila/${IG.id}">📖 Abrir a apostila do curso ›</a></p>` + D.escola.map(e => `<div class="pitem"><div class="cresce"><b>${esc(e.curso)} · ${esc(e.turma)}</b><small>${e.horario ? esc(e.horario) + ' · ' : ''}frequência ${e.frequencia ?? '—'}${e.frequencia != null ? '%' : ''} · média ${e.media != null ? String(e.media).replace('.', ',') : '—'}</small></div>
      ${e.certificado ? `<a class="btn sm pri" href="#/certificado/${e.certificado}">Certificado</a>` : `<span class="pill ${e.situacao === 'cursando' ? 'p-acc' : 'p-neu'}">${e.situacao}</span>`}</div>`).join(''));
    if (P.etapa >= 4) {
      const validade = '12/' + (new Date().getFullYear() + 1);
      h += cartao('Carteirinha', `<div class="idcard"><div class="ch">${esc(IG.nome)}</div><div class="foto vazia">${esc(P.nome.split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase())}</div>
        <div class="info"><div class="nm">${esc(P.nome)}</div><dl><dt>Matrícula</dt><dd>${esc(P.matricula)}</dd><dt>Membro desde</dt><dd>${br(P.membro_desde)}</dd><dt>Ministério</dt><dd>${esc(P.ministerio || '—')}</dd><dt>Validade</dt><dd>${validade}</dd></dl></div>
        <div class="qr">${qrSvg(`${IG.nome} | ${P.nome} | ${P.matricula} | válida até ${validade}`, 3)}</div></div>`);
    }
    h = '<div id="p-instalar"></div>' + h;
    if (h === '<div id="p-instalar"></div>') h += cartao('Bem-vindo!', '<p>Aqui você acompanha suas escalas, a agenda, os avisos da igreja e pode pedir oração.</p>');
    return h;
  };
  const telaAgenda = () => cartao('Próximos eventos', D.agenda.length ? D.agenda.map(e => `<div class="pitem">${dataBox(e.data)}<div class="cresce"><b>${esc(e.titulo)}</b><small>${SEM[dt(e.data).getDay()]}${e.hora ? ' ' + hora(e.hora) : ''}${e.local ? ' · ' + esc(e.local) : ''}</small>${e.descricao ? `<small>${esc(e.descricao)}</small>` : ''}</div></div>`).join('') : '<div class="vazio">Nenhum evento marcado nas próximas semanas.</div>');
  const telaOracao = () =>
    cartao('Pedir oração', `<form class="f" id="po-f" style="grid-template-columns:1fr">
      <div class="fld"><label for="po-p">Seu pedido</label><textarea id="po-p" rows="3" required minlength="3" maxlength="2000"></textarea></div>
      <fieldset class="privacidade"><legend>Quem pode ler?</legend>
        <label><input type="radio" name="po-v" value="equipe" checked> <span>Pastores e equipe de intercessão</span></label>
        <label><input type="radio" name="po-v" value="mural"> <span>Também o mural da igreja (só o primeiro nome)</span></label>
        <label><input type="radio" name="po-v" value="pastores"> <span>Só os pastores</span></label></fieldset>
      <button class="btn pri" type="submit">Enviar pedido</button></form>`) +
    cartao('Mural de oração', D.mural.length ? D.mural.map(m => `<div class="paviso"><b>${esc(m.nome)}</b><small class="muted">${brCurta(m.criado_em)} · 🙏 ${m.oracoes}</small><p>${esc(m.pedido)}</p>
      ${m.meu ? '<span class="muted" style="font-size:13px">Seu pedido</span>' : m.orei ? '<span class="pill p-ok">você orou 🙏</span>' : `<button class="btn sm" data-orei="${m.id}">Orei por este pedido</button>`}</div>`).join('') : '<div class="vazio">Nenhum pedido no mural agora.</div>') +
    (D.meus_pedidos.length ? cartao('Meus pedidos', D.meus_pedidos.map(o => `<div class="paviso"><small class="muted">${brCurta(o.criado_em)} · ${o.status === 'respondido' ? 'Deus respondeu 🙌' : o.status === 'arquivado' ? 'arquivado' : 'a igreja está orando'}${o.compartilhar ? '' : ' · só pastores'}</small><p>${esc(o.pedido)}</p>${o.testemunho ? `<div class="testemunho">${esc(o.testemunho)}</div>` : ''}</div>`).join('')) : '') +
    cartao('Conversar com um pastor', `<form class="f" id="pa-f" style="grid-template-columns:1fr">
      <div class="fld"><label for="pa-a">Assunto</label><select id="pa-a">${Object.entries(ASSUNTOS).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
      <div class="fld"><label for="pa-m">Quer adiantar algo? <span class="muted">(confidencial)</span></label><textarea id="pa-m" rows="2" maxlength="2000"></textarea></div>
      <div class="fld"><label for="pa-h">Melhor dia e horário</label><input id="pa-h" maxlength="200"></div>
      <button class="btn" type="submit">Pedir conversa</button></form>`);
  const telaDados = () => cartao('Meus dados', `<form class="f" id="pd-f" style="grid-template-columns:1fr">
      <div class="fld"><label>Nome</label><input value="${esc(P.nome)}" disabled><span class="dica">Para corrigir o nome, fale com a secretaria.</span></div>
      <div class="fld"><label for="pd-t">WhatsApp</label><input id="pd-t" inputmode="tel" required value="${esc(P.telefone || '')}"></div>
      <div class="fld"><label for="pd-e">E-mail</label><input id="pd-e" type="email" value="${esc(P.email || '')}"></div>
      <div class="fld"><label for="pd-n">Nascimento</label><input id="pd-n" type="date" max="${hoje()}" value="${esc(P.nascimento || '')}"></div>
      <div class="fld"><label for="pd-c">Casamento <span class="muted">(se for casado)</span></label><input id="pd-c" type="date" max="${hoje()}" value="${esc(P.casamento || '')}"></div>
      <div class="fld"><label for="pd-d">Endereço</label><input id="pd-d" maxlength="300" value="${esc(P.endereco || '')}"></div>
      <div id="pd-msg"></div><button class="btn pri" type="submit">Salvar</button></form>
      <p class="muted" style="font-size:13px;margin:12px 0 0">Seus dados são usados só pela igreja para cuidar de você (LGPD). Para pedir a exclusão, fale com a secretaria.</p>`) +
    cartao('Aplicativo no celular', `<div id="p-instalar-dados"></div><p class="muted" style="font-size:13px;margin:10px 0 0">Este link é só seu: não encaminhe para outras pessoas.</p>`);

  const desenhar = () => {
    app.innerHTML = `<div class="portal">
      <header class="ptopo"><div class="brand"><div class="mark"><svg viewBox="0 0 24 24"><path d="M12 4v16M6 10h12"/></svg></div><div><b>${esc(IG.nome)}</b><small>Portal do Membro</small></div></div>
        <h1>Olá, ${esc(primeiro)}!</h1><p><span class="pill stg" style="--i:${P.etapa}"><span class="dot"></span>${ETAPAS[P.etapa]}</span>${P.ministerio ? ' · ' + esc(P.ministerio) : ''}</p></header>
      <nav class="pnav">${[['inicio', 'Início'], ['agenda', 'Agenda'], ['oracao', 'Oração'], ['dados', 'Meus dados']].map(([k, l]) => `<button class="${aba === k ? 'on' : ''}" data-aba="${k}">${l}${k === 'inicio' && D.escalas.some(s => s.status === 'pendente') ? ' <i class="ponto"></i>' : ''}</button>`).join('')}</nav>
      <main class="pcorpo">${aba === 'agenda' ? telaAgenda() : aba === 'oracao' ? telaOracao() : aba === 'dados' ? telaDados() : telaInicio()}</main></div>`;
    window.scrollTo(0, 0);
    ligarInstalar(document.getElementById('p-instalar'));
    ligarInstalar(document.getElementById('p-instalar-dados'), true);
    app.querySelectorAll('[data-aba]').forEach(b => b.onclick = () => { aba = b.dataset.aba; desenhar(); });
    app.querySelectorAll('[data-esc]').forEach(b => b.onclick = () => C.ocupado(b, async () => {
      const { error: er } = await sb.rpc('responder_escala', { p_token: b.dataset.esc, p_status: b.dataset.st });
      if (er) return C.toast(C.traduzErro(er));
      C.toast(b.dataset.st === 'confirmado' ? 'Presença confirmada. Obrigado por servir!' : 'Avisamos o líder. Obrigado por responder.'); recarregar();
    }));
    app.querySelectorAll('[data-orei]').forEach(b => b.onclick = () => C.ocupado(b, async () => { if (await acao('portal_orei', { p_pedido: b.dataset.orei }, 'Obrigado por orar! 🙏')) recarregar(); }));
    app.querySelectorAll('form.penc').forEach(f => f.onsubmit = e => { e.preventDefault(); C.ocupado(f.querySelector('[type=submit]'), async () => {
      const fd = new FormData(f);
      if (await acao('portal_registrar_encontro', { p_discipulado: f.dataset.disc, p_data: fd.get('data'), p_licao: fd.get('licao') ? +fd.get('licao') : null, p_resumo: fd.get('resumo') || null }, 'Encontro registrado. Obrigado por discipular!')) recarregar();
    }); });
    const fo = app.querySelector('#po-f');
    if (fo) fo.onsubmit = e => { e.preventDefault(); C.ocupado(fo.querySelector('[type=submit]'), async () => {
      const v = app.querySelector('[name=po-v]:checked').value;
      if (await acao('portal_pedir_oracao', { p_pedido: $v('po-p'), p_compartilhar: v !== 'pastores', p_mural: v === 'mural' }, 'Pedido enviado. Vamos orar por você! 🙏')) recarregar();
    }); };
    const fa = app.querySelector('#pa-f');
    if (fa) fa.onsubmit = e => { e.preventDefault(); C.ocupado(fa.querySelector('[type=submit]'), async () => {
      if (await acao('portal_pedir_atendimento', { p_assunto: $v('pa-a'), p_mensagem: $v('pa-m') || null, p_preferencia: $v('pa-h') || null }, 'Pedido enviado. Um pastor vai falar com você pelo WhatsApp.')) { aba = 'inicio'; recarregar(); }
    }); };
    const fd = app.querySelector('#pd-f');
    if (fd) fd.onsubmit = e => { e.preventDefault(); C.ocupado(fd.querySelector('[type=submit]'), async () => {
      const { error: er } = await sb.rpc('portal_atualizar', { p_token: token, p_telefone: $v('pd-t'), p_email: $v('pd-e') || null, p_endereco: $v('pd-d') || null, p_nascimento: $v('pd-n') || null, p_casamento: $v('pd-c') || null });
      if (er) return erroEm('pd-msg', er);
      C.toast('Dados atualizados. Obrigado!'); recarregar();
    }); };
  };
  desenhar();
}
