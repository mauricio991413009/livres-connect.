// Livres Connect · fase Pessoas
// Membros (com foto e carteirinha), Visitantes (ficha pública por QR Code)
// e Jornada da Alma. Recebe do app.js as ferramentas comuns em instalar().
import qrcode from 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm';

let C; // contexto: sb, S, $, esc, toast, pode, igrejaAtual, cab, icon, traduzErro, ocupado, ETAPAS, render
export function instalar(ctx) { C = ctx; }

/* ------------------------------------------------------------------ */
/* constantes e utilidades                                             */
/* ------------------------------------------------------------------ */
const ETAPA_DESC = ['1ª e 2ª visita', 'Aceitou Jesus', 'Estudos semanais', 'Preparação e batismo', 'Membro da igreja', 'Escola de Obreiros', 'Atuando no Reino'];
const CANAIS = { whatsapp: 'WhatsApp', ligacao: 'Ligação', visita: 'Visita', culto: 'Conversa no culto', outro: 'Outro' };
const SITUACOES = { ativo: 'Ativo', afastado: 'Afastado', transferido: 'Transferido', falecido: 'Falecido' };
const INTERESSES = ['Conhecer a igreja', 'Receber oração', 'Aceitar Jesus', 'Conversar com um pastor', 'Voltar para a igreja'];
const hoje = () => new Date().toISOString().slice(0, 10);
const br = d => d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '';
const brCurta = d => d ? d.slice(8, 10) + '/' + d.slice(5, 7) : '';
const dias = d => d ? Math.max(0, Math.round((Date.parse(hoje()) - Date.parse(d.slice(0, 10))) / 864e5)) : null;
const idade = n => { if (!n) return ''; const h = new Date(), b = new Date(n + 'T12:00:00'); let a = h.getFullYear() - b.getFullYear(); if (h < new Date(h.getFullYear(), b.getMonth(), b.getDate())) a--; return a; };
const iniciais = n => (n || '?').split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || (n || '?')[0].toUpperCase();
const matricula = p => 'LC-' + String(p.numero || 0).padStart(5, '0');
const etapaPill = i => `<span class="pill stg" style="--i:${i}"><span class="dot"></span>${C.ETAPAS[i]}</span>`;
const contatoPill = d => { const n = dias(d); if (n === null) return '<span class="pill p-neu">sem contato</span>'; const c = n > 21 ? 'p-bad' : n > 10 ? 'p-warn' : 'p-ok'; return `<span class="pill ${c}">${n === 0 ? 'hoje' : n === 1 ? 'há 1 dia' : 'há ' + n + ' dias'}</span>`; };
// Sem nenhum contato: precisa de atenção após 2 dias da 1ª visita. Com contato: após 10 dias do último.
const precisaContato = (p, ultimo) => ultimo ? dias(ultimo) > 10 : (dias(p.primeira_visita) ?? 0) > 2;
const linkFicha = () => location.origin + location.pathname + '#/ficha/' + C.S.igrejaId;
function qrSvg(texto, celula = 4) { const q = qrcode(0, 'M'); q.addData(texto); q.make(); return q.createSvgTag({ cellSize: celula, margin: 2, scalable: true }); }
function qrPng(texto) { const q = qrcode(0, 'M'); q.addData(texto); q.make(); return q.createDataURL(10, 4); }
const podeEditar = p => C.pode(['pastor', 'secretaria']) || (C.pode(['lider']) && p.responsavel_id === C.S.user.id);
const podeFoto = () => C.pode(['pastor', 'secretaria']);
const podeAnotacao = p => C.pode(['pastor']) || (C.pode(['lider']) && p.responsavel_id === C.S.user.id);

let equipeCache = { igreja: null, lista: [] };
async function equipe() {
  if (equipeCache.igreja === C.S.igrejaId) return equipeCache.lista;
  const { data } = await C.sb.rpc('equipe_acompanhamento', { p_igreja: C.S.igrejaId });
  equipeCache = { igreja: C.S.igrejaId, lista: data || [] };
  return equipeCache.lista;
}
const nomeEquipe = (lista, id) => (lista.find(e => e.user_id === id) || {}).nome || '—';
async function ministerios() {
  const { data } = await C.sb.from('ministerios').select('id,nome').eq('igreja_id', C.S.igrejaId).eq('ativo', true).order('nome');
  return data || [];
}
async function ultimosContatos(ids) {
  if (!ids.length) return {};
  const { data } = await C.sb.from('contatos').select('pessoa_id,data').in('pessoa_id', ids).order('data', { ascending: false });
  const m = {}; (data || []).forEach(c => { if (!m[c.pessoa_id]) m[c.pessoa_id] = c.data; }); return m;
}
const fotoCache = new Map();
async function fotoUrl(p) {
  if (!p.foto_url) return null;
  const k = p.foto_url + '|' + (p._v || '');
  if (fotoCache.has(k)) return fotoCache.get(k);
  const { data } = await C.sb.storage.from('fotos').createSignedUrl(p.foto_url, 3600);
  const u = data && data.signedUrl; fotoCache.set(k, u); return u;
}
const avatar = (p, url) => url ? `<img class="av av-img" src="${C.esc(url)}" alt="">` : `<span class="av">${C.esc(iniciais(p.nome))}</span>`;

/* ------------------------------------------------------------------ */
/* janela (modal)                                                      */
/* ------------------------------------------------------------------ */
let aoFechar = null;
function modal(html, largo = false, fechar = null) {
  let el = document.getElementById('modal');
  if (!el) { el = document.createElement('div'); el.id = 'modal'; document.body.appendChild(el); }
  el.innerHTML = `<div class="ov"><div class="md ${largo ? 'largo' : ''}" role="dialog" aria-modal="true">${html}</div></div>`;
  aoFechar = fechar;
  el.querySelector('.ov').onclick = e => { if (e.target.classList.contains('ov') || e.target.closest('[data-fechar]')) fecharModal(); };
  const f = el.querySelector('input:not([type=checkbox]),select,textarea'); if (f) f.focus();
  return el.querySelector('.md');
}
function fecharModal() { const el = document.getElementById('modal'); if (el) el.innerHTML = ''; const f = aoFechar; aoFechar = null; if (f) f(); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModal(); });
const mh = (t, p) => `<div class="mh"><div><h2>${t}</h2>${p ? `<p>${p}</p>` : ''}</div><button class="x" data-fechar aria-label="Fechar">×</button></div>`;

/* ------------------------------------------------------------------ */
/* nova pessoa                                                         */
/* ------------------------------------------------------------------ */
async function novaPessoa(etapa, depois) {
  const [mins, eq] = await Promise.all([ministerios(), equipe()]);
  const md = modal(mh(etapa >= 4 ? 'Novo membro' : 'Novo visitante', 'Cadastro feito pela equipe.') + `
    <form class="f" id="f-np">
      <div class="fld full"><label for="np-nome">Nome completo</label><input id="np-nome" required minlength="3"></div>
      <div class="fld"><label for="np-tel">WhatsApp</label><input id="np-tel" inputmode="tel" placeholder="(47) 99999-0000"></div>
      <div class="fld"><label for="np-nasc">Nascimento</label><input id="np-nasc" type="date"></div>
      <div class="fld"><label for="np-etapa">Etapa da Jornada</label><select id="np-etapa">${C.ETAPAS.map((n, i) => `<option value="${i}" ${i === etapa ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="fld"><label for="np-min">Ministério</label><select id="np-min"><option value="">Nenhum</option>${mins.map(m => `<option value="${m.id}">${C.esc(m.nome)}</option>`).join('')}</select></div>
      <div class="fld full"><label for="np-resp">Responsável pelo acompanhamento</label><select id="np-resp"><option value="">Ninguém ainda</option>${eq.map(e => `<option value="${e.user_id}">${C.esc(e.nome)}</option>`).join('')}</select></div>
      <label class="chk"><input type="checkbox" id="np-lgpd" required> A pessoa autorizou a igreja a usar estes dados para contato e acompanhamento (LGPD).</label>
      <div id="np-msg" class="fld full"></div>
      <div class="fa"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn pri" type="submit">Cadastrar</button></div>
    </form>`);
  md.querySelector('#f-np').onsubmit = e => {
    e.preventDefault();
    C.ocupado(e.target.querySelector('[type=submit]'), async () => {
      const reg = {
        igreja_id: C.S.igrejaId, nome: $v('np-nome'), telefone: $v('np-tel') || null, nascimento: $v('np-nasc') || null,
        etapa: +$v('np-etapa'), ministerio_id: $v('np-min') || null, responsavel_id: $v('np-resp') || null,
        consentimento_lgpd_em: new Date().toISOString(), primeira_visita: hoje()
      };
      if (reg.etapa >= 1) reg.data_conversao = hoje();
      const { error } = await C.sb.from('pessoas').insert(reg);
      if (error) return erroEm('np-msg', error);
      fecharModal(); C.toast('Cadastro feito.'); depois && depois();
    });
  };
}
const $v = id => (document.getElementById(id).value || '').trim();
const erroEm = (id, e) => { document.getElementById(id).innerHTML = `<div class="erro">${C.esc(C.traduzErro(e))}</div>`; };

/* ------------------------------------------------------------------ */
/* ficha da pessoa                                                     */
/* ------------------------------------------------------------------ */
export async function abrirFicha(id, depois) {
  const sb = C.sb, esc = C.esc;
  const { data: p, error } = await sb.from('pessoas').select('*').eq('id', id).single();
  if (error || !p) return C.toast('Não foi possível abrir esta ficha.');
  const ed = podeEditar(p), veNota = podeAnotacao(p);
  const [mins, eq, et, ct, mod, at, notas, foto] = await Promise.all([
    ministerios(), equipe(),
    sb.from('jornada_etapas').select('etapa,data_inicio,autor_id').eq('pessoa_id', id).order('criado_em'),
    sb.from('contatos').select('canal,data,resumo,autor_id').eq('pessoa_id', id).order('data', { ascending: false }),
    sb.from('jornada_atividades_modelo').select('id,descricao,ordem').eq('igreja_id', p.igreja_id).eq('etapa', p.etapa).eq('ativo', true).order('ordem'),
    sb.from('jornada_atividades').select('id,modelo_id,concluida_em').eq('pessoa_id', id),
    veNota ? sb.from('anotacoes_pastorais').select('id,texto,criado_em,autor_id').eq('pessoa_id', id).order('criado_em', { ascending: false }) : Promise.resolve({ data: null }),
    fotoUrl(p)
  ]);
  const feitas = new Map((at.data || []).filter(a => a.concluida_em).map(a => [a.modelo_id, a]));
  const inicioEtapa = ((et.data || []).filter(x => x.etapa === p.etapa).slice(-1)[0] || {}).data_inicio || p.primeira_visita;
  const hist = [
    ...(et.data || []).map(x => ({ d: x.data_inicio, t: x === (et.data || [])[0] ? `Cadastrado como ${C.ETAPAS[x.etapa]}` : `Avançou para ${C.ETAPAS[x.etapa]}`, a: x.autor_id })),
    ...(ct.data || []).map(x => ({ d: x.data, t: `${CANAIS[x.canal]}${x.resumo ? ': ' + x.resumo : ''}`, a: x.autor_id }))
  ].sort((a, b) => (b.d || '').localeCompare(a.d || ''));
  const recarregar = () => abrirFicha(id, depois);

  const md = modal(`
    <div class="mh"><div class="ficha-topo">${avatar(p, foto)}<div><h2>${esc(p.nome)}</h2><p>${etapaPill(p.etapa)} · ${dias(inicioEtapa)} dias nesta etapa · Matrícula ${matricula(p)}</p></div></div><button class="x" data-fechar aria-label="Fechar">×</button></div>
    <div class="trilha">${C.ETAPAS.map((n, i) => `<div class="no stg ${i <= p.etapa ? 'sel' : ''}" style="--i:${i}"><span class="o">${i < p.etapa ? '✓' : i + 1}</span><span>${n}</span></div>`).join('')}</div>
    ${ed ? `<div class="acts">${p.etapa > 0 ? `<button class="btn sm" data-etapa="${p.etapa - 1}">‹ Voltar para ${C.ETAPAS[p.etapa - 1]}</button>` : ''}${p.etapa < 6 ? `<button class="btn pri sm" data-etapa="${p.etapa + 1}">Avançar para ${C.ETAPAS[p.etapa + 1]} ›</button>` : ''}${p.etapa >= 4 ? '<button class="btn sm" data-cart>Carteirinha</button>' : ''}</div>` : (p.etapa >= 4 ? '<div class="acts"><button class="btn sm" data-cart>Carteirinha</button></div>' : '')}

    <div class="duas">
      <section><div class="sec-t">Atividades da etapa ${C.ETAPAS[p.etapa]}</div>
        <div class="tarefas">${(mod.data || []).map(m => `<label><input type="checkbox" data-ativ="${m.id}" ${feitas.has(m.id) ? 'checked' : ''} ${ed ? '' : 'disabled'}> ${esc(m.descricao)}</label>`).join('') || '<div class="vazio">Nenhuma atividade cadastrada para esta etapa.</div>'}</div>
        ${ed ? `<div class="sec-t" style="margin-top:16px">Registrar contato</div>
        <form class="f" id="f-ct" style="grid-template-columns:1fr 1fr">
          <div class="fld"><label for="ct-canal">Canal</label><select id="ct-canal">${Object.entries(CANAIS).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
          <div class="fld"><label for="ct-data">Data</label><input id="ct-data" type="date" value="${hoje()}" max="${hoje()}"></div>
          <div class="fld full"><label for="ct-res">Resumo</label><input id="ct-res" placeholder="Ex.: confirmou presença no domingo"></div>
          <div class="fa"><button class="btn sm pri" type="submit">Salvar contato</button></div></form>` : ''}
      </section>
      <section><div class="sec-t">Histórico</div>
        <div class="tl">${hist.slice(0, 12).map(h => `<div><small class="num">${brCurta(h.d)}</small>${esc(h.t)}<span class="muted"> · ${esc(nomeEquipe(eq, h.a) === '—' ? 'equipe' : nomeEquipe(eq, h.a))}</span></div>`).join('') || '<div class="vazio">Sem registros.</div>'}</div>
      </section>
    </div>

    <details class="dados" ${ed ? '' : 'open'}><summary>Dados pessoais</summary>
      <form class="f" id="f-dados">
        <div class="fld full"><label for="d-nome">Nome completo</label><input id="d-nome" value="${esc(p.nome)}" ${ed ? '' : 'disabled'} required></div>
        <div class="fld"><label for="d-tel">WhatsApp</label><input id="d-tel" value="${esc(p.telefone)}" ${ed ? '' : 'disabled'}></div>
        <div class="fld"><label for="d-email">E-mail</label><input id="d-email" type="email" value="${esc(p.email)}" ${ed ? '' : 'disabled'}></div>
        <div class="fld"><label for="d-nasc">Nascimento</label><input id="d-nasc" type="date" value="${esc(p.nascimento)}" ${ed ? '' : 'disabled'}></div>
        <div class="fld"><label for="d-cas">Casamento</label><input id="d-cas" type="date" value="${esc(p.casamento)}" ${ed ? '' : 'disabled'}></div>
        <div class="fld full"><label for="d-end">Endereço</label><input id="d-end" value="${esc(p.endereco)}" ${ed ? '' : 'disabled'}></div>
        <div class="fld"><label for="d-min">Ministério</label><select id="d-min" ${ed ? '' : 'disabled'}><option value="">Nenhum</option>${mins.map(m => `<option value="${m.id}" ${m.id === p.ministerio_id ? 'selected' : ''}>${esc(m.nome)}</option>`).join('')}</select></div>
        <div class="fld"><label for="d-sit">Situação</label><select id="d-sit" ${ed ? '' : 'disabled'}>${Object.entries(SITUACOES).map(([k, l]) => `<option value="${k}" ${k === p.situacao ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="fld"><label for="d-resp">Responsável</label><select id="d-resp" ${ed ? '' : 'disabled'}><option value="">Ninguém</option>${eq.map(e => `<option value="${e.user_id}" ${e.user_id === p.responsavel_id ? 'selected' : ''}>${esc(e.nome)}</option>`).join('')}</select></div>
        <div class="fld"><label for="d-conv">Convidado por</label><input id="d-conv" value="${esc(p.convidado_por)}" ${ed ? '' : 'disabled'}></div>
        <div class="fld"><label>Conversão</label><input value="${br(p.data_conversao)}" disabled></div>
        <div class="fld"><label for="d-bat">Batismo</label><input id="d-bat" type="date" value="${esc(p.data_batismo)}" ${ed ? '' : 'disabled'}></div>
        ${p.interesse ? `<div class="fld full"><label>Interesse informado na ficha</label><input value="${esc(p.interesse)}" disabled></div>` : ''}
        <div class="fld full"><label for="d-obs">Observações gerais</label><textarea id="d-obs" rows="2" ${ed ? '' : 'disabled'}>${esc(p.observacoes)}</textarea><span class="dica">Visível para toda a equipe. Assuntos sensíveis vão nas anotações pastorais.</span></div>
        ${podeFoto() ? `<div class="fld full"><label for="d-foto">Foto (JPG ou PNG, até 2 MB)</label><input id="d-foto" type="file" accept="image/jpeg,image/png,image/webp"></div>` : ''}
        <div id="d-msg" class="fld full"></div>
        ${ed ? '<div class="fa"><button class="btn pri" type="submit">Salvar dados</button></div>' : ''}
      </form>
    </details>

    ${veNota ? `<section class="restrito"><div class="sec-t">${C.icon('seguranca')} Anotações pastorais · só o pastor e o líder responsável veem</div>
      <form class="f" id="f-nota" style="grid-template-columns:1fr auto;align-items:end"><div class="fld"><label for="n-txt">Nova anotação</label><textarea id="n-txt" rows="2" required></textarea></div><button class="btn sm pri" type="submit">Guardar</button></form>
      <div class="tl" style="margin-top:10px">${(notas.data || []).map(n => `<div><small class="num">${brCurta(n.criado_em)}</small>${esc(n.texto)}<span class="muted"> · ${esc(nomeEquipe(eq, n.autor_id) === '—' ? 'equipe' : nomeEquipe(eq, n.autor_id))}</span></div>`).join('') || '<div class="vazio">Nenhuma anotação.</div>'}</div></section>` : ''}
  `, true, depois);

  md.querySelectorAll('[data-etapa]').forEach(b => b.onclick = () => C.ocupado(b, async () => {
    const { error: er } = await sb.rpc('mudar_etapa', { p_pessoa: id, p_etapa: +b.dataset.etapa });
    if (er) return C.toast(C.traduzErro(er));
    C.toast(p.nome.split(' ')[0] + ' agora está em ' + C.ETAPAS[+b.dataset.etapa] + '.' + (+b.dataset.etapa === 4 ? ' Carteirinha liberada.' : ''));
    recarregar();
  }));
  const bc = md.querySelector('[data-cart]'); if (bc) bc.onclick = () => carteirinha(p, foto, () => abrirFicha(id, depois));
  md.querySelectorAll('[data-ativ]').forEach(ch => ch.onchange = async () => {
    const modelo = ch.dataset.ativ, existe = (at.data || []).find(a => a.modelo_id === modelo);
    const r = existe
      ? await sb.from('jornada_atividades').update({ concluida_em: ch.checked ? new Date().toISOString() : null }).eq('id', existe.id)
      : await sb.from('jornada_atividades').insert({ igreja_id: p.igreja_id, pessoa_id: id, modelo_id: modelo, concluida_em: new Date().toISOString() });
    if (r.error) { ch.checked = !ch.checked; return C.toast(C.traduzErro(r.error)); }
    if (!existe) { const { data: nova } = await sb.from('jornada_atividades').select('id,modelo_id,concluida_em').eq('pessoa_id', id).eq('modelo_id', modelo).maybeSingle(); if (nova) (at.data = at.data || []).push(nova); }
    else existe.concluida_em = ch.checked ? 'x' : null;
    C.toast(ch.checked ? 'Atividade concluída.' : 'Atividade desmarcada.');
  });
  const fct = md.querySelector('#f-ct'); if (fct) fct.onsubmit = e => {
    e.preventDefault();
    C.ocupado(e.target.querySelector('[type=submit]'), async () => {
      const { error: er } = await sb.from('contatos').insert({ igreja_id: p.igreja_id, pessoa_id: id, canal: $v('ct-canal'), data: $v('ct-data') || hoje(), resumo: $v('ct-res') || null });
      if (er) return C.toast(C.traduzErro(er));
      C.toast('Contato registrado.'); recarregar();
    });
  };
  const fd = md.querySelector('#f-dados'); if (fd && ed) fd.onsubmit = e => {
    e.preventDefault();
    C.ocupado(e.target.querySelector('[type=submit]'), async () => {
      const upd = {
        nome: $v('d-nome'), telefone: $v('d-tel') || null, email: $v('d-email') || null, nascimento: $v('d-nasc') || null,
        casamento: $v('d-cas') || null, endereco: $v('d-end') || null, ministerio_id: $v('d-min') || null, situacao: $v('d-sit'),
        responsavel_id: $v('d-resp') || null, convidado_por: $v('d-conv') || null, data_batismo: $v('d-bat') || null, observacoes: $v('d-obs') || null
      };
      const arq = md.querySelector('#d-foto') && md.querySelector('#d-foto').files[0];
      if (arq) {
        if (arq.size > 2 * 1024 * 1024) return erroEm('d-msg', 'A foto passa de 2 MB. Escolha uma imagem menor.');
        const caminho = `${p.igreja_id}/${p.id}.jpg`;
        const { error: eu } = await sb.storage.from('fotos').upload(caminho, arq, { upsert: true, contentType: arq.type });
        if (eu) return erroEm('d-msg', eu);
        upd.foto_url = caminho; fotoCache.clear();
      }
      const { error: er } = await sb.from('pessoas').update(upd).eq('id', id);
      if (er) return erroEm('d-msg', er);
      C.toast('Dados salvos.'); recarregar();
    });
  };
  const fn = md.querySelector('#f-nota'); if (fn) fn.onsubmit = e => {
    e.preventDefault();
    C.ocupado(e.target.querySelector('[type=submit]'), async () => {
      const { error: er } = await sb.from('anotacoes_pastorais').insert({ igreja_id: p.igreja_id, pessoa_id: id, texto: $v('n-txt'), autor_id: C.S.user.id });
      if (er) return C.toast(C.traduzErro(er));
      C.toast('Anotação guardada.'); recarregar();
    });
  };
}

/* ------------------------------------------------------------------ */
/* carteirinha                                                         */
/* ------------------------------------------------------------------ */
async function carteirinha(p, foto, voltar) {
  const ig = C.igrejaAtual(), mins = await ministerios();
  const min = (mins.find(m => m.id === p.ministerio_id) || {}).nome || '—';
  const desde = p.data_batismo || p.data_conversao || p.primeira_visita;
  const validade = '12/' + (new Date().getFullYear() + 1);
  const md = modal(mh('Carteirinha digital', 'Mostre esta tela na recepção. A versão para o membro abrir no próprio celular chega com o Portal do Membro.') + `
    <div class="idcard">
      <div class="ch">${C.esc(ig.nome)}</div>
      ${foto ? `<img class="foto" src="${C.esc(foto)}" alt="">` : `<div class="foto vazia">${C.esc(iniciais(p.nome))}</div>`}
      <div class="info"><div class="nm">${C.esc(p.nome)}</div>
        <dl><dt>Matrícula</dt><dd>${matricula(p)}</dd><dt>Membro desde</dt><dd>${br(desde)}</dd><dt>Ministério</dt><dd>${C.esc(min)}</dd><dt>Validade</dt><dd>${validade}</dd></dl></div>
      <div class="qr">${qrSvg(`${ig.nome} | ${p.nome} | ${matricula(p)} | válida até ${validade}`, 3)}</div>
    </div>
    <div class="fa"><button class="btn" data-voltar>‹ Voltar para a ficha</button></div>`);
  md.querySelector('[data-voltar]').onclick = () => voltar();
}

/* ------------------------------------------------------------------ */
/* MEMBROS                                                             */
/* ------------------------------------------------------------------ */
const filtroM = { q: '', f: 'todos' };
export async function telaMembros(main) {
  const { esc, sb } = C;
  main.innerHTML = C.cab('Membros', 'Pessoas da etapa Membro em diante. Dados pessoais protegidos conforme a LGPD.',
    C.pode(['pastor', 'secretaria']) ? `<button class="btn pri" data-novo>${C.icon('membros')}Novo membro</button>` : '') +
    `<section class="panel"><div class="toolbar"><input type="search" id="m-q" placeholder="Buscar por nome, telefone ou ministério" value="${esc(filtroM.q)}" aria-label="Buscar membros">
      <div class="chips">${[['todos', 'Todos'], ['ativo', 'Ativos'], ['afastado', 'Afastados'], ['formacao', 'Formação e serviço']].map(([k, l]) => `<button class="chip ${filtroM.f === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div></div>
      <div id="m-lista"><div class="carregando">Carregando…</div></div></section>`;
  const [{ data: ps, error }, mins] = await Promise.all([
    sb.from('pessoas').select('id,nome,telefone,nascimento,etapa,situacao,ministerio_id,responsavel_id,data_batismo,data_conversao,primeira_visita,foto_url,numero').eq('igreja_id', C.S.igrejaId).gte('etapa', 4).order('nome'),
    ministerios()
  ]);
  if (error) return erroEm('m-lista', error);
  const nomeMin = id => (mins.find(m => m.id === id) || {}).nome || '';
  const desenhar = () => {
    const q = filtroM.q.toLowerCase();
    const l = (ps || []).filter(p => filtroM.f === 'todos' || (filtroM.f === 'formacao' ? p.etapa >= 5 : p.situacao === filtroM.f))
      .filter(p => !q || (p.nome + ' ' + (p.telefone || '') + ' ' + nomeMin(p.ministerio_id)).toLowerCase().includes(q));
    document.getElementById('m-lista').innerHTML = l.length ? `<div class="tw"><table><thead><tr><th>Nome</th><th>WhatsApp</th><th class="r">Idade</th><th>Ministério</th><th>Membro desde</th><th>Etapa</th><th>Situação</th></tr></thead><tbody>
      ${l.map(p => `<tr class="clicavel" data-ficha="${p.id}"><td><div class="who"><span class="av">${esc(iniciais(p.nome))}</span><div><b>${esc(p.nome)}</b><small>${matricula(p)}</small></div></div></td>
      <td class="num" style="white-space:nowrap">${esc(p.telefone || '')}</td><td class="r num">${idade(p.nascimento)}</td><td>${esc(nomeMin(p.ministerio_id)) || '<span class="muted">—</span>'}</td>
      <td class="num">${br(p.data_batismo || p.data_conversao || p.primeira_visita)}</td><td>${etapaPill(p.etapa)}</td>
      <td><span class="pill ${p.situacao === 'ativo' ? 'p-ok' : 'p-warn'}">${SITUACOES[p.situacao]}</span></td></tr>`).join('')}</tbody></table></div>
      <p class="muted" style="margin:10px 0 0;font-size:13px">${l.length} de ${(ps || []).length} membros. Clique em um nome para abrir a ficha.</p>`
      : `<div class="vazio">${(ps || []).length ? 'Ninguém encontrado com esse filtro.' : 'Nenhum membro cadastrado ainda. Use "Novo membro" ou avance pessoas na Jornada da Alma até a etapa Membro.'}</div>`;
  };
  desenhar();
  document.getElementById('m-q').oninput = e => { filtroM.q = e.target.value; desenhar(); };
  main.onclick = e => {
    const f = e.target.closest('[data-f]'); if (f) { filtroM.f = f.dataset.f; main.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', x === f)); return desenhar(); }
    const fi = e.target.closest('[data-ficha]'); if (fi) return abrirFicha(fi.dataset.ficha, () => telaMembros(main));
    if (e.target.closest('[data-novo]')) return novaPessoa(4, () => telaMembros(main));
  };
}

/* ------------------------------------------------------------------ */
/* VISITANTES                                                          */
/* ------------------------------------------------------------------ */
const filtroV = { f: 'todos' };
export async function telaVisitantes(main) {
  const { esc, sb } = C;
  const link = linkFicha();
  main.innerHTML = C.cab('Visitantes e evangelismo', 'A ficha do QR Code cai aqui e vai direto para um líder. Registre cada contato para ninguém ficar esquecido.',
    C.pode(['pastor', 'secretaria']) ? `<button class="btn" data-novo>Cadastrar manualmente</button>` : '') +
    `<div class="kpis" id="v-kpis"></div>
    <div class="grid"><section class="panel c8"><h2>Em acompanhamento <span class="chips">${[['todos', 'Todos'], ['0', 'Visitantes'], ['1', 'Novos convertidos'], ['2', 'Discipulado']].map(([k, l]) => `<button class="chip ${filtroV.f === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</span></h2>
      <div id="v-lista"><div class="carregando">Carregando…</div></div></section>
    <section class="panel c4"><h2>QR Code da recepção</h2>
      <div class="qr-grande">${qrSvg(link, 5)}</div>
      <p style="margin:10px 0 6px">O visitante aponta a câmera do celular e preenche a ficha. Não precisa de aplicativo nem de cadastro.</p>
      <div class="acts"><a class="btn sm" href="${esc(qrPng(link))}" download="qr-ficha-visitante.png">Baixar QR Code</a><button class="btn sm" data-copiar>Copiar link</button><a class="btn sm" href="${esc(link)}" target="_blank" rel="noopener">Abrir ficha</a></div>
      <p class="muted" style="margin:10px 0 0;font-size:13px">Imprima o QR Code e coloque na recepção, nos bancos ou no telão.</p></section></div>`;

  const mesIni = hoje().slice(0, 8) + '01', ano = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
  const [{ data: todos }, eq] = await Promise.all([
    sb.from('pessoas').select('id,nome,telefone,etapa,situacao,primeira_visita,ultima_visita,visitas,convidado_por,interesse,responsavel_id,data_batismo,origem').eq('igreja_id', C.S.igrejaId),
    equipe()
  ]);
  const ps = todos || [];
  const acompanha = ps.filter(p => p.etapa <= 2 && p.situacao === 'ativo');
  const ult = await ultimosContatos(acompanha.map(p => p.id));
  const recentes = ps.filter(p => p.primeira_visita >= ano);
  document.getElementById('v-kpis').innerHTML = [
    ['Visitantes no mês', ps.filter(p => p.primeira_visita >= mesIni).length, 'primeiras visitas'],
    ['Voltaram', recentes.length ? Math.round(recentes.filter(p => p.visitas >= 2).length / recentes.length * 100) + '%' : '—', '2ª visita ou mais, 12 meses'],
    ['Precisam de contato', acompanha.filter(p => precisaContato(p, ult[p.id])).length, 'sem contato recente'],
    ['Viraram membros', ps.filter(p => p.data_batismo && p.data_batismo >= ano).length, 'nos últimos 12 meses']
  ].map(([l, v, s]) => `<div class="kpi"><span class="l">${l}</span><span class="v">${v}</span><span class="s">${s}</span></div>`).join('');

  const desenhar = () => {
    const l = acompanha.filter(p => filtroV.f === 'todos' || String(p.etapa) === filtroV.f).sort((a, b) => (b.primeira_visita || '').localeCompare(a.primeira_visita || ''));
    document.getElementById('v-lista').innerHTML = l.length ? `<div class="tw"><table><thead><tr><th>Pessoa</th><th>1ª visita</th><th class="r">Visitas</th><th>Convidado por</th><th>Responsável</th><th>Último contato</th><th></th></tr></thead><tbody>
      ${l.map(p => `<tr><td><div class="who"><span class="av">${esc(iniciais(p.nome))}</span><div><button class="lk" data-ficha="${p.id}">${esc(p.nome)}</button><small>${C.ETAPAS[p.etapa]}${p.origem === 'qr' ? ' · via QR Code' : ''}${p.interesse ? ' · ' + esc(p.interesse) : ''}</small></div></div></td>
      <td class="num">${brCurta(p.primeira_visita)}</td><td class="r num">${p.visitas}</td><td>${esc(p.convidado_por || '—')}</td>
      <td>${podeEditar(p) ? `<select data-resp="${p.id}" aria-label="Responsável"><option value="">Ninguém</option>${eq.map(e => `<option value="${e.user_id}" ${e.user_id === p.responsavel_id ? 'selected' : ''}>${esc(e.nome)}</option>`).join('')}</select>` : esc(nomeEquipe(eq, p.responsavel_id))}</td>
      <td>${contatoPill(ult[p.id] || null)}</td>
      <td class="acoes"><button class="btn sm" data-ficha="${p.id}">Abrir ficha</button></td></tr>`).join('')}</tbody></table></div>`
      : '<div class="vazio">Ninguém em acompanhamento nesta etapa. Quando um visitante preencher a ficha do QR Code, ele aparece aqui.</div>';
  };
  desenhar();
  main.onclick = async e => {
    const f = e.target.closest('[data-f]'); if (f) { filtroV.f = f.dataset.f; main.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', x === f)); return desenhar(); }
    const fi = e.target.closest('[data-ficha]'); if (fi) return abrirFicha(fi.dataset.ficha, () => telaVisitantes(main));
    if (e.target.closest('[data-novo]')) return novaPessoa(0, () => telaVisitantes(main));
    if (e.target.closest('[data-copiar]')) { try { await navigator.clipboard.writeText(link); C.toast('Link da ficha copiado.'); } catch (er) { prompt('Copie o link:', link); } }
  };
  main.onchange = async e => {
    const s = e.target.closest('[data-resp]'); if (!s) return;
    const { error } = await sb.from('pessoas').update({ responsavel_id: s.value || null }).eq('id', s.dataset.resp);
    error ? C.toast(C.traduzErro(error)) : C.toast(s.value ? 'Encaminhado para ' + nomeEquipe(eq, s.value) + '.' : 'Responsável removido.');
  };
}

/* ------------------------------------------------------------------ */
/* JORNADA DA ALMA                                                     */
/* ------------------------------------------------------------------ */
const filtroJ = { resp: 'todos', etapa: null };
export async function telaJornada(main) {
  const { esc, sb } = C;
  main.innerHTML = C.cab('Jornada da Alma', 'Da primeira visita ao serviço ministerial. Cada etapa tem responsável, atividades e acompanhamento.', '<span id="j-filtro"></span>') +
    `<section class="panel"><div class="trilha grande" id="j-trilha"></div></section><div class="quadro" id="j-quadro"><div class="carregando">Carregando…</div></div>`;
  const [{ data: ps }, { data: et }, { data: mod }, { data: at }, eq] = await Promise.all([
    sb.from('pessoas').select('id,nome,etapa,responsavel_id,primeira_visita').eq('igreja_id', C.S.igrejaId).eq('situacao', 'ativo'),
    sb.from('jornada_etapas').select('pessoa_id,etapa,data_inicio').eq('igreja_id', C.S.igrejaId).order('criado_em'),
    sb.from('jornada_atividades_modelo').select('id,etapa,descricao,ordem').eq('igreja_id', C.S.igrejaId).eq('ativo', true).order('ordem'),
    sb.from('jornada_atividades').select('pessoa_id,modelo_id,concluida_em').eq('igreja_id', C.S.igrejaId),
    equipe()
  ]);
  const inicio = {}; (et || []).forEach(x => { inicio[x.pessoa_id + '|' + x.etapa] = x.data_inicio; });
  const feitas = new Set((at || []).filter(a => a.concluida_em).map(a => a.pessoa_id + '|' + a.modelo_id));
  const modPor = i => (mod || []).filter(m => m.etapa === i);
  document.getElementById('j-filtro').innerHTML = `<select id="j-resp" aria-label="Filtrar por responsável"><option value="todos">Todos os responsáveis</option><option value="meus" ${filtroJ.resp === 'meus' ? 'selected' : ''}>Só os que eu acompanho</option>${eq.map(e => `<option value="${e.user_id}" ${filtroJ.resp === e.user_id ? 'selected' : ''}>${esc(e.nome)}</option>`).join('')}</select>`;

  const desenhar = () => {
    const l = (ps || []).filter(p => filtroJ.resp === 'todos' || p.responsavel_id === (filtroJ.resp === 'meus' ? C.S.user.id : filtroJ.resp));
    const cont = C.ETAPAS.map((_, i) => l.filter(p => p.etapa === i).length);
    document.getElementById('j-trilha').innerHTML = C.ETAPAS.map((n, i) => `<button class="no stg ${filtroJ.etapa === i ? 'sel' : ''}" style="--i:${i}" data-etapa-f="${i}"><span class="o">${cont[i]}</span><span>${n}</span><small>${ETAPA_DESC[i]}</small></button>`).join('');
    const cols = C.ETAPAS.map((n, i) => {
      if (filtroJ.etapa !== null && filtroJ.etapa !== i) return '';
      const ms = modPor(i);
      const cards = l.filter(p => p.etapa === i).map(p => ({ p, d: dias(inicio[p.id + '|' + i] || p.primeira_visita) })).sort((a, b) => b.d - a.d);
      return `<div class="col stg" style="--i:${i}"><header><span class="dot"></span><b>${n}</b><span class="num">${cards.length}</span></header>
        ${cards.map(({ p, d }) => { const ok = ms.filter(m => feitas.has(p.id + '|' + m.id)), prox = ms.find(m => !feitas.has(p.id + '|' + m.id));
          return `<div class="card"><button class="nm" data-ficha="${p.id}">${esc(p.nome)}</button>
            <div class="meta"><span>${esc(nomeEquipe(eq, p.responsavel_id))}</span><span class="${d > 30 ? 'atrasado' : ''}">${d} dias na etapa</span></div>
            <div class="prox">${prox ? 'Próximo: ' + esc(prox.descricao) : 'Atividades concluídas'}</div>
            <div class="ft"><div class="prog" title="${ok.length} de ${ms.length} atividades">${ms.map(m => `<i class="${feitas.has(p.id + '|' + m.id) ? 'd' : ''}"></i>`).join('')}</div>
            ${i < 6 && podeEditar(p) ? `<button class="btn sm" data-avancar="${p.id}" data-para="${i + 1}">${C.ETAPAS[i + 1]} ›</button>` : i === 6 ? '<span class="pill p-ok">Servindo</span>' : ''}</div></div>`; }).join('') || '<div class="vazio" style="padding:6px 4px">Ninguém nesta etapa.</div>'}</div>`;
    }).join('');
    const q = document.getElementById('j-quadro');
    q.classList.toggle('uma', filtroJ.etapa !== null);
    q.innerHTML = cols;
  };
  desenhar();
  document.getElementById('j-resp').onchange = e => { filtroJ.resp = e.target.value; desenhar(); };
  main.onclick = async e => {
    const ef = e.target.closest('[data-etapa-f]'); if (ef) { const i = +ef.dataset.etapaF; filtroJ.etapa = filtroJ.etapa === i ? null : i; return desenhar(); }
    const fi = e.target.closest('[data-ficha]'); if (fi) return abrirFicha(fi.dataset.ficha, () => telaJornada(main));
    const av = e.target.closest('[data-avancar]');
    if (av) C.ocupado(av, async () => {
      const { error } = await sb.rpc('mudar_etapa', { p_pessoa: av.dataset.avancar, p_etapa: +av.dataset.para });
      if (error) return C.toast(C.traduzErro(error));
      const p = ps.find(x => x.id === av.dataset.avancar); p.etapa = +av.dataset.para; inicio[p.id + '|' + p.etapa] = hoje();
      C.toast(p.nome.split(' ')[0] + ' avançou para ' + C.ETAPAS[p.etapa] + '.'); desenhar();
    });
  };
}

/* ------------------------------------------------------------------ */
/* Pessoas que precisam de atenção (usado no Painel)                   */
/* ------------------------------------------------------------------ */
export async function painelAtencao(el) {
  const { esc, sb } = C;
  const [{ data: ps }, eq] = await Promise.all([
    sb.from('pessoas').select('id,nome,etapa,situacao,responsavel_id,primeira_visita').eq('igreja_id', C.S.igrejaId).or('etapa.lte.3,situacao.eq.afastado'),
    equipe()
  ]);
  const l = (ps || []).filter(p => p.situacao === 'ativo' || p.situacao === 'afastado');
  const ult = await ultimosContatos(l.map(p => p.id));
  const lista = l.map(p => ({ p, d: ult[p.id] || p.primeira_visita })).filter(x => x.p.situacao === 'afastado' || precisaContato(x.p, ult[x.p.id]))
    .sort((a, b) => (a.d || '').localeCompare(b.d || '')).slice(0, 6);
  el.innerHTML = `<h2>Precisam de atenção</h2><div class="lista">${lista.map(({ p, d }) => `<div class="linha"><span class="av">${esc(iniciais(p.nome))}</span><div class="cresce"><button class="lk" data-ficha="${p.id}">${esc(p.nome)}</button><div class="muted" style="font-size:13px">${p.situacao === 'afastado' ? 'Membro afastado' : C.ETAPAS[p.etapa]} · ${esc(nomeEquipe(eq, p.responsavel_id))}</div></div>${contatoPill(ult[p.id] || null)}</div>`).join('') || '<div class="vazio">Ninguém sem contato recente. Visitantes novos aparecem aqui se ninguém falar com eles em 2 dias.</div>'}</div>`;
  el.onclick = e => { const fi = e.target.closest('[data-ficha]'); if (fi) abrirFicha(fi.dataset.ficha, () => painelAtencao(el)); };
}

/* ------------------------------------------------------------------ */
/* FICHA PÚBLICA DO VISITANTE (sem login)                              */
/* ------------------------------------------------------------------ */
export async function telaFichaPublica(igrejaId) {
  const { esc, sb } = C;
  const app = document.getElementById('app');
  const { data } = await sb.rpc('igreja_publica', { p_igreja: igrejaId });
  const ig = data && data[0];
  const casca = corpo => `<div class="auth"><div class="auth-card ficha-pub">
    <div class="brand"><div class="mark"><svg viewBox="0 0 24 24"><path d="M12 4v16M6 10h12"/></svg></div><div><b>${ig ? esc(ig.nome) : 'Livres Connect'}</b><small>Ficha do visitante</small></div></div>${corpo}</div></div>`;
  if (!ig) { app.innerHTML = casca('<h1>Ficha indisponível</h1><p>Este QR Code não está ativo. Fale com a recepção.</p>'); return; }
  const formulario = () => {
    app.innerHTML = casca(`<div><h1>Seja bem-vindo!</h1><p>Que alegria ter você conosco. Deixe seu contato para conhecermos você melhor.</p></div>
      <form class="f" id="f-pub" style="grid-template-columns:1fr">
        <div class="fld"><label for="fp-nome">Seu nome completo</label><input id="fp-nome" autocomplete="name" required minlength="3" maxlength="120"></div>
        <div class="fld"><label for="fp-tel">WhatsApp com DDD</label><input id="fp-tel" type="tel" inputmode="tel" autocomplete="tel" required placeholder="(47) 99999-0000"></div>
        <div class="fld"><label for="fp-nasc">Data de nascimento <span class="muted">(opcional)</span></label><input id="fp-nasc" type="date" max="${hoje()}"></div>
        <div class="fld"><label for="fp-conv">Quem convidou você? <span class="muted">(opcional)</span></label><input id="fp-conv" placeholder="Nome de quem convidou, ou redes sociais"></div>
        <div class="fld"><label for="fp-int">Você gostaria de</label><select id="fp-int">${INTERESSES.map(i => `<option>${i}</option>`).join('')}</select></div>
        <label class="chk"><input type="checkbox" id="fp-lgpd" required> Autorizo a ${esc(ig.nome)} a usar estes dados para entrar em contato comigo e me acompanhar. Posso pedir a exclusão a qualquer momento.</label>
        <div id="fp-msg"></div>
        <button class="btn pri full" type="submit">Enviar</button>
      </form>`);
    document.getElementById('f-pub').onsubmit = e => {
      e.preventDefault();
      C.ocupado(e.target.querySelector('[type=submit]'), async () => {
        const { data: r, error } = await sb.rpc('registrar_visitante', {
          p_igreja: igrejaId, p_nome: $v('fp-nome'), p_telefone: $v('fp-tel'), p_nascimento: $v('fp-nasc') || null,
          p_convidado_por: $v('fp-conv') || null, p_interesse: $v('fp-int'), p_consentimento: document.getElementById('fp-lgpd').checked
        });
        if (error) return erroEm('fp-msg', error);
        app.innerHTML = casca(r === 'retorno'
          ? `<div><h1>Que bom ter você de volta!</h1><p>Registramos mais esta visita. Fique à vontade, a casa é sua.</p></div>`
          : `<div><h1>Obrigado!</h1><p>Recebemos seus dados. Alguém da nossa equipe vai falar com você pelo WhatsApp nos próximos dias.</p></div>`);
        app.querySelector('.auth-card').insertAdjacentHTML('beforeend', '<button class="btn full" id="fp-outra">Preencher para outra pessoa</button>');
        document.getElementById('fp-outra').onclick = formulario;
      });
    };
  };
  formulario();
}
