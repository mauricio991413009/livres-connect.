// Livres Connect · Discipulado
// Aba interna (discipulados em andamento, encontros, lições) e roteiro
// público das 8 lições para o discipulador, em #/discipulado/<igreja>.
import { LICOES } from './discipulado-conteudo.js';
import { modal, fecharModal, mh, $v, erroEm, hoje, br, brCurta, linkWhats, fmtTel, abrirFicha } from './pessoas.js';

let C;
export function instalar(ctx) { C = ctx; }

const linkRoteiro = (ig, n) => location.origin + location.pathname + '#/discipulado/' + ig + (n ? '/' + n : '');
const dias = d => d ? Math.max(0, Math.round((Date.parse(hoje()) - Date.parse(d)) / 864e5)) : null;
const STATUS = { ativo: ['Em andamento', 'p-acc'], concluido: ['Concluído', 'p-ok'], interrompido: ['Interrompido', 'p-neu'] };
const podeCriar = () => C.pode(['pastor', 'secretaria', 'lider']);
let filtro = 'ativo';
export { LICOES, linkRoteiro };

// Conteúdo de uma lição (usado aqui, no roteiro público e no portal do membro)
export const blocoLicao = (l, i, esc) => `
  <article class="estudo">
    <div class="estudo-num">Lição ${i + 1} de ${LICOES.length}</div>
    <h1>${esc(l.titulo)}</h1>
    <p class="estudo-resumo">${esc(l.objetivo)}</p>
    <div class="caixa leia"><span class="rotulo">Leiam juntos</span><b>${esc(l.leitura)}</b></div>
    <h2>Para conversar</h2>
    <ol class="pontos">${l.pontos.map(([t, txt, ref]) => `<li><h3>${esc(t)}</h3><p>${esc(txt)}</p><span class="ref">${esc(ref)}</span></li>`).join('')}</ol>
    <h2>Perguntas</h2>
    <ol class="perguntas">${l.perguntas.map(q => `<li>${esc(q)}</li>`).join('')}</ol>
    <div class="caixa desafio"><span class="rotulo">Prática da semana</span>${esc(l.pratica)}</div>
    <div class="caixa memorizar"><span class="rotulo">Dica para o discipulador</span>${esc(l.dica)}</div>
  </article>`;

const progresso = (licoes, cls = '') => `<div class="licoes ${cls}" title="${licoes.length} de ${LICOES.length} lições">${LICOES.map((_, i) => `<i class="${licoes.includes(i + 1) ? 'd' : ''}">${i + 1}</i>`).join('')}</div>`;

/* ------------------------------------------------------------------ */
/* aba interna                                                         */
/* ------------------------------------------------------------------ */
export async function telaDiscipulado(main) {
  const { esc, sb } = C, ig = C.S.igrejaId;
  main.innerHTML = C.cab('Discipulado', 'Um membro acompanha cada novo convertido por 8 lições, um encontro por semana. Registre os encontros para ninguém ficar parado.',
    podeCriar() ? `<button class="btn pri" data-novo>${C.icon('discipulado')}Novo discipulado</button>` : '') +
    `<div class="kpis" id="d-kpis"></div>
    <section class="panel"><h2>Discipulados <span class="chips">${[['ativo', 'Em andamento'], ['concluido', 'Concluídos'], ['todos', 'Todos']].map(([k, l]) => `<button class="chip ${filtro === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</span></h2>
      <div id="d-lista"><div class="carregando">Carregando…</div></div></section>
    <section class="panel"><h2>Roteiro das 8 lições <a class="lnk" href="${esc(linkRoteiro(ig, 'todos'))}" target="_blank" rel="noopener">Apostila para imprimir ›</a></h2>
      <p class="muted" style="margin:-4px 0 12px">Envie o link ao discipulador: ele abre no celular, sem login, e conduz cada encontro pelo roteiro.</p>
      <div class="lista">${LICOES.map((l, i) => `<div class="linha"><span class="num-estudo">${i + 1}</span><div class="cresce"><b style="font-weight:600">${esc(l.titulo)}</b><div class="muted" style="font-size:13.5px">${esc(l.objetivo)}</div></div>
        <a class="btn sm" href="${esc(linkRoteiro(ig, i + 1))}" target="_blank" rel="noopener">Abrir</a></div>`).join('')}</div>
      <div class="acts" style="margin-top:12px"><button class="btn sm" data-copiar="${esc(linkRoteiro(ig))}">Copiar link do roteiro</button></div></section>`;

  const { data, error } = await sb.rpc('discipulados_lista', { p_igreja: ig });
  if (error) return erroEm('d-lista', error);
  const todos = data || [];
  const ativos = todos.filter(d => d.status === 'ativo');
  const parados = ativos.filter(d => (dias(d.ultimo_encontro || d.inicio) ?? 0) > 14);
  document.getElementById('d-kpis').innerHTML = [
    ['Em andamento', ativos.length, 'discipulados ativos'],
    ['Sem encontro há 2 semanas', parados.length, 'precisam de incentivo'],
    ['Concluídos', todos.filter(d => d.status === 'concluido').length, 'as 8 lições'],
    ['Discipuladores', new Set(ativos.map(d => d.discipulador_id)).size, 'membros acompanhando']
  ].map(([l, v, s]) => `<div class="kpi"><span class="l">${l}</span><span class="v">${v}</span><span class="s">${s}</span></div>`).join('');

  const desenhar = () => {
    const l = todos.filter(d => filtro === 'todos' || d.status === filtro);
    document.getElementById('d-lista').innerHTML = l.length ? `<div class="tw"><table><thead><tr><th>Discípulo</th><th>Discipulador</th><th>Lições</th><th>Último encontro</th><th>Situação</th><th></th></tr></thead><tbody>
      ${l.map(d => { const n = dias(d.ultimo_encontro || d.inicio);
        return `<tr><td><button class="lk" data-abrir="${d.id}">${esc(d.discipulo)}</button><small class="muted" style="display:block">desde ${br(d.inicio)}</small></td>
        <td>${esc(d.discipulador)}</td><td>${progresso(d.licoes || [])}</td>
        <td>${d.ultimo_encontro ? `<span class="pill ${d.status !== 'ativo' ? 'p-neu' : n > 14 ? 'p-bad' : n > 8 ? 'p-warn' : 'p-ok'}">${brCurta(d.ultimo_encontro)} · ${n === 0 ? 'hoje' : n === 1 ? 'ontem' : 'há ' + n + ' dias'}</span>` : '<span class="pill p-warn">nenhum ainda</span>'}</td>
        <td><span class="pill ${STATUS[d.status][1]}">${STATUS[d.status][0]}</span></td>
        <td class="acoes"><button class="btn sm ${d.status === 'ativo' ? 'pri' : ''}" data-abrir="${d.id}">${d.status === 'ativo' ? 'Registrar encontro' : 'Ver'}</button></td></tr>`; }).join('')}</tbody></table></div>`
      : `<div class="vazio">${todos.length ? 'Nenhum discipulado nesta situação.' : 'Nenhum discipulado ainda. Use "Novo discipulado" para ligar um novo convertido a um membro que vai acompanhá-lo.'}</div>`;
  };
  desenhar();

  main.onclick = async e => {
    const f = e.target.closest('[data-f]'); if (f) { filtro = f.dataset.f; main.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', x === f)); return desenhar(); }
    const a = e.target.closest('[data-abrir]'); if (a) return abrirDiscipulado(todos.find(d => d.id === a.dataset.abrir), () => telaDiscipulado(main));
    if (e.target.closest('[data-novo]')) return novoDiscipulado(todos, () => telaDiscipulado(main));
    const c = e.target.closest('[data-copiar]');
    if (c) { try { await navigator.clipboard.writeText(c.dataset.copiar); C.toast('Link do roteiro copiado.'); } catch (er) { prompt('Copie o link:', c.dataset.copiar); } }
  };
}

/* ------------------------------------------------------------------ */
/* novo discipulado                                                    */
/* ------------------------------------------------------------------ */
async function novoDiscipulado(todos, depois, discipuloFixo = null) {
  const { esc, sb } = C, ig = C.S.igrejaId;
  const [{ data: ps }, { data: dis }] = await Promise.all([
    sb.from('pessoas').select('id,nome,etapa').eq('igreja_id', ig).eq('situacao', 'ativo').lte('etapa', 3).order('nome'),
    sb.rpc('discipuladores_possiveis', { p_igreja: ig })
  ]);
  const ocupados = new Set(todos.filter(d => d.status === 'ativo').map(d => d.discipulo_id));
  const livres = (ps || []).filter(p => !ocupados.has(p.id));
  const md = modal(mh('Novo discipulado', 'Escolha quem vai ser discipulado e o membro que vai acompanhar.') + `
    <form class="f" id="f-nd">
      <div class="fld full"><label for="nd-disc">Discípulo</label><select id="nd-disc" required><option value="">Escolha…</option>${livres.map(p => `<option value="${p.id}" ${p.id === discipuloFixo ? 'selected' : ''}>${esc(p.nome)} · ${C.ETAPAS[p.etapa]}</option>`).join('')}</select>
        <span class="dica">Visitantes, novos convertidos e pessoas em discipulado ou batismo que ainda não têm discipulador.</span></div>
      <div class="fld full"><label for="nd-dor">Discipulador</label><select id="nd-dor" required><option value="">Escolha…</option>${(dis || []).map(p => `<option value="${p.pessoa_id}">${esc(p.nome)}${p.discipulos ? ` · já acompanha ${p.discipulos}` : ''}</option>`).join('')}</select>
        <span class="dica">Membros ativos da igreja.</span></div>
      <div class="fld"><label for="nd-ini">Início</label><input id="nd-ini" type="date" value="${hoje()}" required></div>
      <div id="nd-msg" class="fld full"></div>
      <div class="fa"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn pri" type="submit">Começar discipulado</button></div>
    </form>`);
  md.querySelector('#f-nd').onsubmit = e => {
    e.preventDefault();
    C.ocupado(e.target.querySelector('[type=submit]'), async () => {
      if ($v('nd-disc') === $v('nd-dor')) return erroEm('nd-msg', 'O discípulo e o discipulador precisam ser pessoas diferentes.');
      const { error } = await sb.from('discipulados').insert({ igreja_id: ig, discipulo_id: $v('nd-disc'), discipulador_id: $v('nd-dor'), inicio: $v('nd-ini') });
      if (error) return erroEm('nd-msg', /um_ativo|duplicate/i.test(error.message) ? 'Esta pessoa já está em um discipulado em andamento.' : error);
      fecharModal(); C.toast('Discipulado iniciado. Envie o roteiro ao discipulador.'); depois && depois();
    });
  };
}
export { novoDiscipulado };

/* ------------------------------------------------------------------ */
/* um discipulado: encontros                                           */
/* ------------------------------------------------------------------ */
async function abrirDiscipulado(d, depois) {
  const { esc, sb } = C;
  const { data: ens } = await sb.from('discipulado_encontros').select('id,data,licao,resumo,via_portal').eq('discipulado_id', d.id).order('data', { ascending: false });
  const encontros = ens || [], feitas = new Set(encontros.map(x => x.licao).filter(Boolean));
  const proxima = LICOES.findIndex((_, i) => !feitas.has(i + 1)) + 1;
  const ativo = d.status === 'ativo', ig = C.S.igrejaId;
  const wDisc = linkWhats(d.discipulo_tel, `Olá, ${d.discipulo.split(' ')[0]}! `);
  const wDor = linkWhats(d.discipulador_tel, `Olá, ${d.discipulador.split(' ')[0]}! Obrigado por acompanhar ${d.discipulo.split(' ')[0]} no discipulado. O roteiro das lições está aqui: ${linkRoteiro(ig)}`);
  const md = modal(mh(esc(d.discipulo), `Discipulado com ${esc(d.discipulador)} · desde ${br(d.inicio)} · <span class="pill ${STATUS[d.status][1]}">${STATUS[d.status][0]}</span>`) + `
    ${progresso([...feitas], 'grande')}
    <div class="acts">${wDisc ? `<a class="btn sm whats" href="${esc(wDisc)}" target="_blank" rel="noopener">WhatsApp do discípulo</a>` : ''}${wDor ? `<a class="btn sm whats" href="${esc(wDor)}" target="_blank" rel="noopener">Enviar roteiro ao discipulador</a>` : ''}
      <button class="btn sm" data-ficha="${d.discipulo_id}">Ficha do discípulo</button></div>
    ${ativo ? `<section><div class="sec-t">Registrar encontro</div>
      <form class="f" id="f-enc">
        <div class="fld"><label for="en-data">Data</label><input id="en-data" type="date" value="${hoje()}" max="${hoje()}" required></div>
        <div class="fld"><label for="en-lic">Lição estudada</label><select id="en-lic"><option value="">Só conversa e oração</option>${LICOES.map((l, i) => `<option value="${i + 1}" ${i + 1 === proxima ? 'selected' : ''}>${i + 1}. ${esc(l.titulo)}${feitas.has(i + 1) ? ' ✓' : ''}</option>`).join('')}</select></div>
        <div class="fld full"><label for="en-res">Como foi <span class="muted">(opcional)</span></label><textarea id="en-res" rows="2" maxlength="1000" placeholder="Ex.: conversamos sobre perdão; pediu oração pela mãe"></textarea>
          <span class="dica">Visível para quem acompanha esta pessoa. Assuntos confidenciais vão nas anotações pastorais da ficha.</span></div>
        <div id="en-msg" class="fld full"></div>
        <div class="fa"><button class="btn pri" type="submit">Salvar encontro</button></div>
      </form></section>` : ''}
    <section><div class="sec-t">Encontros (${encontros.length})</div>
      <div class="tl">${encontros.map(x => `<div><small class="num">${brCurta(x.data)}</small>${x.licao ? `<b>Lição ${x.licao}</b> · ${esc(LICOES[x.licao - 1].titulo)}` : 'Conversa e oração'}${x.resumo ? `<br><span class="muted">${esc(x.resumo)}</span>` : ''}${x.via_portal ? ' <span class="pill p-neu">pelo portal</span>' : ''}</div>`).join('') || '<div class="vazio">Nenhum encontro registrado ainda.</div>'}</div></section>
    <div class="fa">${ativo ? `<button class="btn" data-status="interrompido">Interromper</button><button class="btn ${feitas.size >= LICOES.length ? 'pri' : ''}" data-status="concluido">Marcar como concluído</button>` : '<button class="btn" data-status="ativo">Reabrir</button>'}</div>`, true, depois);

  const fe = md.querySelector('#f-enc');
  if (fe) fe.onsubmit = e => {
    e.preventDefault();
    C.ocupado(e.target.querySelector('[type=submit]'), async () => {
      const { error } = await sb.from('discipulado_encontros').insert({ igreja_id: ig, discipulado_id: d.id, data: $v('en-data'), licao: $v('en-lic') ? +$v('en-lic') : null, resumo: $v('en-res') || null });
      if (error) return erroEm('en-msg', error);
      const n = new Set([...feitas, +$v('en-lic') || 0].filter(Boolean)).size;
      C.toast(n >= LICOES.length ? 'Encontro salvo. As 8 lições foram concluídas! Marque o discipulado como concluído.' : 'Encontro salvo.');
      d.ultimo_encontro = $v('en-data'); if ($v('en-lic')) d.licoes = [...new Set([...(d.licoes || []), +$v('en-lic')])];
      abrirDiscipulado(d, depois);
    });
  };
  md.querySelectorAll('[data-status]').forEach(b => b.onclick = () => C.ocupado(b, async () => {
    const st = b.dataset.status;
    if (st === 'concluido' && feitas.size < LICOES.length && !confirm(`Foram estudadas ${feitas.size} de ${LICOES.length} lições. Marcar como concluído mesmo assim?`)) return;
    if (st === 'interrompido' && !confirm('Interromper este discipulado? Você pode reabrir depois.')) return;
    const { error } = await sb.from('discipulados').update({ status: st }).eq('id', d.id);
    if (error) return C.toast(/um_ativo|duplicate/i.test(error.message) ? 'Esta pessoa já tem outro discipulado em andamento.' : C.traduzErro(error));
    d.status = st; C.toast(st === 'concluido' ? 'Discipulado concluído. Combine o próximo passo com o pastor.' : st === 'ativo' ? 'Discipulado reaberto.' : 'Discipulado interrompido.');
    abrirDiscipulado(d, depois);
  }));
  const fi = md.querySelector('[data-ficha]'); if (fi) fi.onclick = () => abrirFicha(d.discipulo_id, depois);
}

/* ------------------------------------------------------------------ */
/* roteiro público para o discipulador                                 */
/* ------------------------------------------------------------------ */
export async function telaRoteiroPublico(ig, qual) {
  const { esc, sb } = C, app = document.getElementById('app');
  window.scrollTo(0, 0);
  const { data } = await sb.rpc('igreja_publica', { p_igreja: ig });
  const igreja = data && data[0];
  const topo = `<header class="leitura-topo"><a class="brand" href="#/discipulado/${ig}"><div class="mark"><svg viewBox="0 0 24 24"><path d="M12 4v16M6 10h12"/></svg></div>
    <div><b>${igreja ? esc(igreja.nome) : 'Livres Connect'}</b><small>Roteiro do discipulado</small></div></a></header>`;
  if (!igreja) { app.innerHTML = `<div class="leitura">${topo}<section class="estudo"><h1>Roteiro indisponível</h1><p>Este link não está ativo. Fale com a liderança da igreja.</p></section></div>`; return; }
  if (qual === 'todos') {
    app.innerHTML = `<div class="leitura">${topo}<div class="estudo-acoes nao-imprime" style="margin:0 0 16px"><button class="btn pri" data-imprimir>Imprimir apostila</button><a class="btn" href="#/discipulado/${ig}">Voltar</a></div>
      ${LICOES.map((l, i) => blocoLicao(l, i, esc)).join('<div class="quebra-pagina"></div>')}</div>`;
  } else if (qual && LICOES[+qual - 1]) {
    const i = +qual - 1;
    app.innerHTML = `<div class="leitura">${topo}${blocoLicao(LICOES[i], i, esc)}
      <nav class="estudo-nav nao-imprime">${i > 0 ? `<a class="btn" href="#/discipulado/${ig}/${i}">‹ Anterior</a>` : '<span></span>'}
        <a class="btn ghost" href="#/discipulado/${ig}">Todas as lições</a>
        ${i < LICOES.length - 1 ? `<a class="btn pri" href="#/discipulado/${ig}/${i + 2}">Próxima ›</a>` : '<span></span>'}</nav></div>`;
  } else {
    app.innerHTML = `<div class="leitura">${topo}
      <section class="estudo capa"><h1>Roteiro do discipulado</h1>
        <p>Obrigado por acompanhar alguém nos primeiros passos com Jesus! São 8 lições, uma por semana. Em cada encontro: leiam o texto juntos, conversem sobre os pontos, façam as perguntas com calma e terminem orando.</p>
        <p class="muted" style="font-size:14px">Depois de cada encontro, avise quem acompanha vocês na igreja (ou registre pelo Portal do Membro) para o progresso ficar anotado.</p></section>
      <ol class="lista-estudos">${LICOES.map((l, i) => `<li><a href="#/discipulado/${ig}/${i + 1}"><span class="num-estudo">${i + 1}</span><span class="cresce"><b>${esc(l.titulo)}</b><small>${esc(l.objetivo)}</small></span><span class="seta">›</span></a></li>`).join('')}</ol>
      <p class="muted nao-imprime" style="text-align:center;font-size:13px;margin:18px 0 0"><a href="#/discipulado/${ig}/todos">Ver todas as lições em uma página</a></p></div>`;
  }
  app.onclick = e => { if (e.target.closest('[data-imprimir]')) window.print(); };
}
