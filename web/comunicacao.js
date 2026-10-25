// Livres Connect · Comunicação
// Comunicados com público definido e lista de envio pelo WhatsApp (um toque
// por pessoa, marcando quem já recebeu), texto pronto para grupos,
// aniversariantes da semana e modelos de mensagem.
import { modal, fecharModal, mh, $v, erroEm, hoje, br, brCurta, linkWhats, fmtTel, ministerios } from './pessoas.js';

let C;
export function instalar(ctx) { C = ctx; }

export const ALVOS = { membros: 'Membros', todos: 'Todos (visitantes e membros)', novos: 'Novos convertidos e discipulado', visitantes: 'Visitantes', servindo: 'Quem está servindo (formação e serviço)', ministerio: 'Um ministério' };
const gereTudo = () => C.pode(['pastor', 'secretaria']);
const primeiro = n => (n || '').split(' ')[0];
const personalizar = (txt, nome) => txt.replace(/\{nome\}/gi, primeiro(nome));
const MODELOS = [
  ['Convite para o culto', 'Culto de domingo', 'Olá, {nome}! Neste domingo, às 19h, teremos culto na {igreja}. Vai ser uma alegria ter você com a gente. Traga alguém junto!'],
  ['Boas-vindas', 'Seja bem-vindo', 'Olá, {nome}! Foi muito bom ter você conosco. A {igreja} é a sua casa. Se precisar de oração ou quiser conversar, é só responder esta mensagem.'],
  ['Campanha de oração', 'Campanha de oração', 'Olá, {nome}! Começamos uma campanha de oração. Separe alguns minutos por dia e ore com a gente. Envie seus pedidos respondendo esta mensagem.'],
  ['Aviso geral', 'Aviso importante', 'Olá, {nome}! Aviso da {igreja}: ']
];
let ministeriosCache = [];

/* ------------------------------------------------------------------ */
/* aba                                                                 */
/* ------------------------------------------------------------------ */
export async function telaComunicacao(main) {
  const { esc, sb } = C, ig = C.S.igrejaId;
  const podeCriar = gereTudo() || C.S.vinculos.some(v => v.igreja_id === ig && v.ministerio_id && C.lideraMin(v.ministerio_id));
  main.innerHTML = C.cab('Comunicação', 'Escreva o comunicado uma vez e envie para cada pessoa pelo WhatsApp, com o nome dela. O sistema marca quem já recebeu. Os comunicados também aparecem no Portal do Membro.',
    podeCriar ? `<button class="btn pri" data-novo>${C.icon('comunicacao')}Novo comunicado</button>` : '') +
    `<section class="panel"><h2>Comunicados</h2><div id="c-lista"><div class="carregando">Carregando…</div></div></section>
    <div class="grid">
      <section class="panel c6"><h2>Aniversariantes da semana</h2><div id="c-niver"><div class="carregando">Carregando…</div></div></section>
      <section class="panel c6"><h2>Modelos de mensagem</h2>
        <p class="muted" style="margin:-4px 0 10px">Comece um comunicado a partir de um texto pronto. <b>{nome}</b> vira o primeiro nome de cada pessoa.</p>
        <div class="lista">${MODELOS.map(([t, , txt], i) => `<div class="linha"><div class="cresce"><b style="font-weight:600">${esc(t)}</b><div class="muted" style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:46ch">${esc(txt.replace('{igreja}', C.igrejaAtual().nome))}</div></div>${podeCriar ? `<button class="btn sm" data-modelo="${i}">Usar</button>` : ''}</div>`).join('')}</div></section>
    </div><div id="c-portal"></div>`;

  ministeriosCache = await ministerios();
  const [{ data: cs, error }, { data: rs }] = await Promise.all([
    sb.from('comunicados').select('*').eq('igreja_id', ig).order('criado_em', { ascending: false }).limit(100),
    sb.rpc('comunicados_resumo', { p_igreja: ig })
  ]);
  if (error) return erroEm('c-lista', error);
  const resumo = id => (rs || []).find(r => r.id === id) || { total: 0, enviados: 0, pode_enviar: false };
  const publico = c => c.alvo === 'ministerio' ? ((ministeriosCache.find(m => m.id === c.ministerio_id) || {}).nome || 'Ministério') : ALVOS[c.alvo];
  document.getElementById('c-lista').innerHTML = (cs || []).length ? `<div class="tw"><table><thead><tr><th>Comunicado</th><th>Público</th><th>Data</th><th>Envio</th><th></th></tr></thead><tbody>
    ${cs.map(c => { const r = resumo(c.id), pc = r.total ? Math.round(r.enviados / r.total * 100) : 0;
      return `<tr><td><b style="font-weight:600">${esc(c.titulo)}</b>${c.no_portal ? ' <span class="pill p-neu">no portal</span>' : ''}<small class="muted" style="display:block;max-width:48ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.texto)}</small></td>
      <td>${esc(publico(c))}</td><td class="num">${brCurta(c.criado_em)}</td>
      <td style="min-width:140px"><div class="mini-prog"><div style="width:${pc}%"></div></div><small class="num">${r.enviados} de ${r.total}</small></td>
      <td class="acoes"><button class="btn sm ${r.pode_enviar && r.enviados < r.total ? 'pri' : ''}" data-abrir="${c.id}">${r.pode_enviar ? (r.enviados < r.total ? 'Enviar' : 'Ver') : 'Ver'}</button></td></tr>`; }).join('')}</tbody></table></div>`
    : `<div class="vazio">Nenhum comunicado ainda.${podeCriar ? ' Use "Novo comunicado" ou um dos modelos abaixo.' : ''}</div>`;

  aniversariantes();
  if (Portal) Portal.secaoEnvio(document.getElementById('c-portal'));

  const recarregar = () => telaComunicacao(main);
  main.onclick = e => {
    const a = e.target.closest('[data-abrir]'); if (a) { const c = cs.find(x => x.id === a.dataset.abrir); return abrirComunicado(c, resumo(c.id).pode_enviar, publico(c), recarregar); }
    const m = e.target.closest('[data-modelo]'); if (m) { const [, t, txt] = MODELOS[+m.dataset.modelo]; return formComunicado({ titulo: t, texto: txt.replace('{igreja}', C.igrejaAtual().nome) }, recarregar); }
    if (e.target.closest('[data-novo]')) return formComunicado(null, recarregar);
  };
}

// O Portal do Membro adiciona aqui a seção de envio dos links (evita import circular)
let Portal = null;
export function registrarPortal(p) { Portal = p; }

/* ------------------------------------------------------------------ */
/* aniversariantes                                                     */
/* ------------------------------------------------------------------ */
async function aniversariantes() {
  const { esc, sb } = C, el = document.getElementById('c-niver');
  if (!C.pode(['pastor', 'presbiterio', 'secretaria', 'lider'])) { el.innerHTML = '<div class="vazio">Seu perfil não vê os dados das pessoas.</div>'; return; }
  const { data } = await sb.from('pessoas').select('id,nome,telefone,nascimento,casamento').eq('igreja_id', C.S.igrejaId).eq('situacao', 'ativo');
  const h = new Date(); h.setHours(0, 0, 0, 0);
  const proximo = d => { if (!d) return null; let n = new Date(h.getFullYear(), +d.slice(5, 7) - 1, +d.slice(8, 10)); if (n < h) n = new Date(h.getFullYear() + 1, n.getMonth(), n.getDate()); return Math.round((n - h) / 864e5); };
  const lista = [];
  (data || []).forEach(p => {
    const a = proximo(p.nascimento); if (a !== null && a <= 7) lista.push({ p, d: a, tipo: 'aniversário' });
    const c = proximo(p.casamento); if (c !== null && c <= 7) lista.push({ p, d: c, tipo: 'bodas' });
  });
  lista.sort((x, y) => x.d - y.d);
  el.innerHTML = lista.length ? `<div class="lista">${lista.map(({ p, d, tipo }) => {
    const msg = tipo === 'aniversário'
      ? `Feliz aniversário, ${primeiro(p.nome)}! 🎉 A família da ${C.igrejaAtual().nome} agradece a Deus pela sua vida. Que o Senhor te abençoe e te guarde neste novo ano!`
      : `Parabéns pelo aniversário de casamento, ${primeiro(p.nome)}! Que Deus continue abençoando a família de vocês. Com carinho, ${C.igrejaAtual().nome}.`;
    const w = linkWhats(p.telefone, msg);
    return `<div class="linha"><span class="pill ${d === 0 ? 'p-ouro' : 'p-neu'}">${d === 0 ? 'hoje' : d === 1 ? 'amanhã' : 'em ' + d + ' dias'}</span>
      <div class="cresce"><b style="font-weight:600">${esc(p.nome)}</b><div class="muted" style="font-size:13px">${tipo === 'aniversário' ? 'Aniversário' : 'Aniversário de casamento'} · ${brCurta((tipo === 'aniversário' ? p.nascimento : p.casamento))}</div></div>
      ${w ? `<a class="btn sm whats" href="${esc(w)}" target="_blank" rel="noopener">Dar parabéns</a>` : '<span class="muted" style="font-size:13px">sem WhatsApp</span>'}</div>`; }).join('')}</div>`
    : '<div class="vazio">Ninguém faz aniversário nos próximos 7 dias. Cadastre a data de nascimento na ficha de cada pessoa para aparecer aqui.</div>';
}

/* ------------------------------------------------------------------ */
/* novo comunicado                                                     */
/* ------------------------------------------------------------------ */
async function formComunicado(base, depois) {
  const { esc, sb } = C, b = base || {};
  const mins = gereTudo() ? ministeriosCache : ministeriosCache.filter(m => C.lideraMin(m.id));
  const alvos = gereTudo() ? Object.entries(ALVOS) : [['ministerio', ALVOS.ministerio]];
  const { data: evs } = await sb.from('eventos').select('id,titulo,data,hora,local').eq('igreja_id', C.S.igrejaId).gte('data', hoje()).order('data').limit(20);
  const md = modal(mh('Novo comunicado', 'Escreva uma vez. Na hora de enviar, cada pessoa recebe a mensagem com o próprio nome.') + `
    <form class="f" id="f-com">
      <div class="fld full"><label for="cm-tit">Título</label><input id="cm-tit" required minlength="2" maxlength="120" value="${esc(b.titulo || '')}"></div>
      <div class="fld"><label for="cm-alvo">Quem recebe</label><select id="cm-alvo">${alvos.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
      <div class="fld" id="cm-min-box"><label for="cm-min">Ministério</label><select id="cm-min">${mins.map(m => `<option value="${m.id}">${esc(m.nome)}</option>`).join('')}</select></div>
      ${(evs || []).length ? `<div class="fld full"><label for="cm-ev">Usar um evento da agenda <span class="muted">(opcional)</span></label><select id="cm-ev"><option value="">—</option>${evs.map(e => `<option value="${e.id}">${br(e.data)} · ${esc(e.titulo)}</option>`).join('')}</select></div>` : ''}
      <div class="fld full"><label for="cm-txt">Mensagem</label><textarea id="cm-txt" rows="6" required minlength="2" maxlength="3000">${esc(b.texto || 'Olá, {nome}! ')}</textarea>
        <span class="dica">Escreva <b>{nome}</b> onde deve aparecer o primeiro nome da pessoa.</span></div>
      <label class="chk"><input type="checkbox" id="cm-portal" checked> Mostrar também no Portal do Membro</label>
      <div class="fld"><label for="cm-exp">Mostrar no portal até <span class="muted">(opcional)</span></label><input id="cm-exp" type="date" min="${hoje()}"></div>
      <div id="cm-msg" class="fld full"></div>
      <div class="fa"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn pri" type="submit">Salvar e enviar</button></div>
    </form>`, true);
  const alvo = md.querySelector('#cm-alvo'), box = md.querySelector('#cm-min-box');
  alvo.onchange = () => { box.hidden = alvo.value !== 'ministerio'; };
  if (!mins.length && !gereTudo()) box.innerHTML = '<div class="aviso">Você não lidera nenhum ministério.</div>';
  alvo.onchange();
  const ev = md.querySelector('#cm-ev');
  if (ev) ev.onchange = () => {
    const e = (evs || []).find(x => x.id === ev.value); if (!e) return;
    const dia = new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
    md.querySelector('#cm-tit').value = e.titulo;
    md.querySelector('#cm-txt').value = `Olá, {nome}! Não perca: ${e.titulo}, ${dia}${e.hora ? ' às ' + e.hora.slice(0, 5).replace(':00', 'h').replace(':', 'h') : ''}${e.local ? ', em ' + e.local : ''}. Esperamos você!`;
    md.querySelector('#cm-exp').value = e.data;
  };
  md.querySelector('#f-com').onsubmit = e => {
    e.preventDefault();
    C.ocupado(e.target.querySelector('[type=submit]'), async () => {
      const reg = { igreja_id: C.S.igrejaId, titulo: $v('cm-tit'), texto: $v('cm-txt'), alvo: alvo.value, ministerio_id: alvo.value === 'ministerio' ? ($v('cm-min') || null) : null,
        no_portal: md.querySelector('#cm-portal').checked, expira_em: $v('cm-exp') || null };
      if (reg.alvo === 'ministerio' && !reg.ministerio_id) return erroEm('cm-msg', 'Escolha o ministério.');
      const { data: novo, error } = await sb.from('comunicados').insert(reg).select('*').single();
      if (error) return erroEm('cm-msg', error);
      fecharModal(); C.toast('Comunicado salvo. Agora envie para cada pessoa.');
      abrirComunicado(novo, true, reg.alvo === 'ministerio' ? (ministeriosCache.find(m => m.id === reg.ministerio_id) || {}).nome : ALVOS[reg.alvo], depois);
    });
  };
}

/* ------------------------------------------------------------------ */
/* envio                                                               */
/* ------------------------------------------------------------------ */
async function abrirComunicado(c, podeEnviar, publico, depois) {
  const { esc, sb } = C;
  let lista = [];
  if (podeEnviar) { const { data } = await sb.rpc('comunicado_destinatarios', { p_comunicado: c.id }); lista = data || []; }
  let soFaltam = false;
  const md = modal(mh(esc(c.titulo), `${esc(publico || '')} · ${br(c.criado_em.slice(0, 10))}${c.no_portal ? ' · também no Portal do Membro' : ''}`) + `
    <div class="previa">${esc(personalizar(c.texto, 'Maria')).replace(/\n/g, '<br>')}</div>
    <div class="acts"><button class="btn sm" data-copiar>Copiar texto para grupos</button>${C.pode(['pastor']) || podeEnviar ? '<button class="btn sm danger" data-excluir>Excluir</button>' : ''}</div>
    ${podeEnviar ? `<section><div class="sec-t" id="cm-cont"></div>
      <div class="chips" style="margin-bottom:8px"><button class="chip on" data-filtro="todos">Todos</button><button class="chip" data-filtro="faltam">Faltam enviar</button></div>
      <div class="envios" id="cm-env"></div>
      <p class="muted" style="font-size:13px;margin:8px 0 0">Toque em "Enviar": o WhatsApp abre com a mensagem pronta. Ao voltar, a pessoa já fica marcada como enviada.</p></section>`
      : '<p class="muted">A lista de envio aparece para quem pode enviar este comunicado.</p>'}`, true, depois);
  const desenhar = () => {
    const el = md.querySelector('#cm-env'); if (!el) return;
    const enviados = lista.filter(p => p.enviado_em).length;
    md.querySelector('#cm-cont').textContent = `Lista de envio · ${enviados} de ${lista.length} enviados`;
    const l = lista.filter(p => !soFaltam || !p.enviado_em);
    el.innerHTML = l.length ? l.map(p => { const w = linkWhats(p.telefone, personalizar(c.texto, p.nome));
      return `<div class="linha ${p.enviado_em ? 'feito' : ''}"><div class="cresce"><b style="font-weight:600">${esc(p.nome)}</b><small class="muted num" style="display:block">${esc(fmtTel(p.telefone))}</small></div>
        ${p.enviado_em ? `<span class="pill p-ok">enviado</span><button class="btn sm ghost" data-desmarcar="${p.pessoa_id}" title="Desmarcar">↺</button>` : ''}
        ${w ? `<a class="btn sm ${p.enviado_em ? '' : 'whats'}" href="${esc(w)}" target="_blank" rel="noopener" data-enviar="${p.pessoa_id}">${p.enviado_em ? 'Enviar de novo' : 'Enviar'}</a>` : ''}</div>`; }).join('')
      : `<div class="vazio">${lista.length ? 'Todos já receberam. 🎉' : 'Ninguém com WhatsApp cadastrado neste público.'}</div>`;
  };
  desenhar();
  md.onclick = async e => {
    const f = e.target.closest('[data-filtro]'); if (f) { soFaltam = f.dataset.filtro === 'faltam'; md.querySelectorAll('[data-filtro]').forEach(x => x.classList.toggle('on', x === f)); return desenhar(); }
    const env = e.target.closest('[data-enviar]');
    if (env) { const p = lista.find(x => x.pessoa_id === env.dataset.enviar); if (!p.enviado_em) { const { error } = await sb.rpc('comunicado_marcar', { p_comunicado: c.id, p_pessoa: p.pessoa_id, p_enviado: true }); if (!error) { p.enviado_em = new Date().toISOString(); setTimeout(desenhar, 300); } } return; }
    const des = e.target.closest('[data-desmarcar]');
    if (des) { const { error } = await sb.rpc('comunicado_marcar', { p_comunicado: c.id, p_pessoa: des.dataset.desmarcar, p_enviado: false }); if (error) return C.toast(C.traduzErro(error)); lista.find(x => x.pessoa_id === des.dataset.desmarcar).enviado_em = null; return desenhar(); }
    if (e.target.closest('[data-copiar]')) { const t = c.texto.replace(/,?\s*\{nome\}/gi, ''); try { await navigator.clipboard.writeText(t); C.toast('Texto copiado. Cole no grupo do WhatsApp.'); } catch (er) { prompt('Copie o texto:', t); } return; }
    const ex = e.target.closest('[data-excluir]');
    if (ex && confirm('Excluir este comunicado? Ele some também do Portal do Membro.')) { const { error } = await sb.from('comunicados').delete().eq('id', c.id); if (error) return C.toast(C.traduzErro(error)); fecharModal(); C.toast('Comunicado excluído.'); }
  };
}
