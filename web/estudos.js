// Livres Connect · Estudos para novo convertido
// Aba interna (QR Code, link, lições e quem está estudando) e páginas
// públicas de leitura, abertas pelo QR Code sem login. O aluno coloca nome e
// WhatsApp; cada estudo concluído fica registrado para a equipe acompanhar.
import { ESTUDOS } from './estudos-conteudo.js';
import { qrSvg, qrPng, abrirFicha, linkWhats, fmtTel } from './pessoas.js';

let C;
export function instalar(ctx) { C = ctx; }

const linkEstudos = (ig, n) => location.origin + location.pathname + '#/estudos/' + ig + (n ? '/' + n : '');
const msgEstudos = (ig, nome) => `Olá${nome ? ', ' + nome : ''}! Que alegria ter você na família da ${C.igrejaAtual().nome}. Preparamos 10 estudos bíblicos para os seus primeiros passos com Jesus. Comece por aqui: ${linkEstudos(ig)}`;
export { linkEstudos, msgEstudos };

// Código do aluno guardado no celular (com ele, o progresso continua de onde parou)
const chaveAluno = ig => 'lc-aluno-' + ig;
const lerAluno = ig => { try { return localStorage.getItem(chaveAluno(ig)); } catch (e) { return null; } };
const salvarAluno = (ig, id) => { try { id ? localStorage.setItem(chaveAluno(ig), id) : localStorage.removeItem(chaveAluno(ig)); } catch (e) { /* sem armazenamento */ } };
const dataCurta = s => s ? new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '';
const diasDesde = s => Math.floor((Date.now() - new Date(s).getTime()) / 864e5);

/* ------------------------------------------------------------------ */
/* aba interna                                                         */
/* ------------------------------------------------------------------ */
export async function telaEstudos(main) {
  const { esc, sb } = C, ig = C.S.igrejaId, link = linkEstudos(ig);
  main.innerHTML = C.cab('Estudos para novo convertido', '10 estudos bíblicos para os primeiros passos na fé. O novo convertido abre pelo QR Code ou pelo link, coloca o nome e o WhatsApp, e cada estudo concluído aparece aqui.') +
    `<section class="panel"><h2>Quem está estudando</h2><div id="alunos"><div class="carregando">Carregando…</div></div></section>
    <div class="grid">
      <section class="panel c4"><h2>QR Code dos estudos</h2>
        <div class="qr-grande">${qrSvg(link, 5)}</div>
        <p style="margin:10px 0">Coloque na recepção, no material de boas-vindas ou entregue ao novo convertido.</p>
        <div class="acts"><a class="btn sm" href="${esc(qrPng(link))}" download="qr-estudos-novo-convertido.png">Baixar QR Code</a>
          <button class="btn sm" data-copiar="${esc(link)}">Copiar link</button>
          <button class="btn sm" data-copiar-msg>Copiar mensagem</button></div>
        <div class="acts" style="margin-top:8px"><a class="btn sm" href="${esc(linkEstudos(ig, 'todos'))}" target="_blank" rel="noopener">Apostila para imprimir</a>
          <a class="btn sm pri" href="${esc(link)}" target="_blank" rel="noopener">Ver como o aluno vê</a></div>
      </section>
      <section class="panel c8"><h2>As 10 lições</h2>
        <div class="lista">${ESTUDOS.map((e, i) => `<div class="linha"><span class="num-estudo">${i + 1}</span>
          <div class="cresce"><b style="font-weight:600">${esc(e.titulo)}</b><div class="muted" style="font-size:13.5px">${esc(e.resumo)}</div></div>
          <a class="btn sm" href="${esc(linkEstudos(ig, i + 1))}" target="_blank" rel="noopener">Abrir</a></div>`).join('')}</div>
      </section></div>`;

  const [{ data: alunos, error }, { data: feitos }] = await Promise.all([
    sb.from('estudos_alunos').select('id,nome,telefone,pessoa_id,criado_em,ultimo_acesso').eq('igreja_id', ig).order('ultimo_acesso', { ascending: false }),
    sb.from('estudos_concluidos').select('aluno_id,estudo,concluido_em').eq('igreja_id', ig)
  ]);
  const caixa = document.getElementById('alunos');
  if (error) caixa.innerHTML = `<div class="erro">${esc(C.traduzErro(error))}</div>`;
  else if (!(alunos || []).length) caixa.innerHTML = '<div class="vazio">Ninguém começou os estudos ainda. Quando o novo convertido abrir o link e colocar o nome, ele aparece aqui com o progresso de cada lição.</div>';
  else {
    const porAluno = {}; (feitos || []).forEach(f => (porAluno[f.aluno_id] = porAluno[f.aluno_id] || []).push(f));
    caixa.innerHTML = `<div class="tw"><table><thead><tr><th>Aluno</th><th>WhatsApp</th><th>Progresso</th><th>Último estudo</th><th>Situação</th><th></th></tr></thead><tbody>
      ${alunos.map(a => {
        const f = (porAluno[a.id] || []).sort((x, y) => y.concluido_em.localeCompare(x.concluido_em)), n = f.length, ult = f[0];
        const parado = diasDesde(a.ultimo_acesso);
        const sit = n >= ESTUDOS.length ? '<span class="pill p-ok">Concluiu os 10 ✓</span>'
          : parado > 10 ? `<span class="pill p-warn">parado há ${parado} dias</span>` : '<span class="pill p-acc">estudando</span>';
        const w = linkWhats(a.telefone, `Olá, ${a.nome.split(' ')[0]}! ${n >= ESTUDOS.length ? 'Parabéns por concluir os 10 estudos! Vamos conversar sobre o próximo passo?' : 'Como estão os estudos? Estamos orando por você.'}`);
        return `<tr><td><b style="font-weight:600">${esc(a.nome)}</b><small class="muted" style="display:block">começou em ${dataCurta(a.criado_em)}</small></td>
          <td class="num" style="white-space:nowrap">${w ? `<a class="lk-tel" href="${esc(w)}" target="_blank" rel="noopener">${esc(fmtTel(a.telefone))}</a>` : esc(a.telefone)}</td>
          <td style="min-width:150px"><div class="mini-prog"><div style="width:${n / ESTUDOS.length * 100}%"></div></div><small class="num">${n} de ${ESTUDOS.length}</small></td>
          <td>${ult ? `Estudo ${ult.estudo} · ${dataCurta(ult.concluido_em)}` : '<span class="muted">nenhum ainda</span>'}</td>
          <td>${sit}</td>
          <td class="acoes">${a.pessoa_id ? `<button class="btn sm" data-ficha="${a.pessoa_id}">Abrir ficha</button>` : ''}</td></tr>`;
      }).join('')}</tbody></table></div>
      <p class="muted" style="margin:10px 0 0;font-size:13px">Quem não estava cadastrado entra automaticamente como Novo convertido na Jornada da Alma, com um responsável. Ao concluir os 10 estudos, a atividade de lições é marcada na Jornada.</p>`;
  }
  main.onclick = async e => {
    const fi = e.target.closest('[data-ficha]'); if (fi) return abrirFicha(fi.dataset.ficha, () => telaEstudos(main));
    const b = e.target.closest('button'); if (!b) return;
    const txt = b.dataset.copiar || ('copiarMsg' in b.dataset ? msgEstudos(ig) : null);
    if (!txt) return;
    try { await navigator.clipboard.writeText(txt); C.toast(b.dataset.copiar ? 'Link copiado.' : 'Mensagem copiada. Cole no WhatsApp.'); } catch (er) { prompt('Copie:', txt); }
  };
}

/* ------------------------------------------------------------------ */
/* páginas públicas                                                    */
/* ------------------------------------------------------------------ */
export async function telaEstudosPublico(ig, qual) {
  const { esc, sb } = C;
  const app = document.getElementById('app');
  window.scrollTo(0, 0);
  const aluno = { id: lerAluno(ig), nome: '', feitos: new Set() };
  const [{ data }, prog] = await Promise.all([
    sb.rpc('igreja_publica', { p_igreja: ig }),
    aluno.id ? sb.rpc('estudos_progresso', { p_aluno: aluno.id }) : Promise.resolve({ data: null })
  ]);
  const igreja = data && data[0];
  if (aluno.id) {
    if (prog.data && prog.data.nome) { aluno.nome = prog.data.nome; aluno.feitos = new Set(prog.data.concluidos || []); }
    else if (!prog.error) { salvarAluno(ig, null); aluno.id = null; }
  }
  const topo = `<header class="leitura-topo"><a class="brand" href="#/estudos/${ig}"><div class="mark"><svg viewBox="0 0 24 24"><path d="M12 4v16M6 10h12"/></svg></div>
    <div><b>${igreja ? esc(igreja.nome) : 'Livres Connect'}</b><small>Estudos para novo convertido</small></div></a></header>`;
  if (!igreja) { app.innerHTML = `<div class="leitura">${topo}<section class="estudo"><h1>Estudos indisponíveis</h1><p>Este link não está ativo. Fale com a recepção da igreja.</p></section></div>`; return; }

  const formAluno = (titulo, texto, botao) => `<form class="f form-aluno" style="grid-template-columns:1fr">
      <div><h2 style="margin:0 0 4px">${titulo}</h2><p class="muted" style="margin:0;font-size:15px">${texto}</p></div>
      <div class="fld"><label for="al-nome">Seu nome completo</label><input id="al-nome" autocomplete="name" required minlength="3" maxlength="120"></div>
      <div class="fld"><label for="al-tel">Seu WhatsApp com DDD</label><input id="al-tel" type="tel" inputmode="tel" autocomplete="tel" required placeholder="(47) 99999-0000"></div>
      <label class="chk"><input type="checkbox" id="al-lgpd" required> Autorizo a ${esc(igreja.nome)} a usar meu nome e WhatsApp para acompanhar meus estudos.</label>
      <div id="al-msg"></div>
      <button class="btn pri full" type="submit">${botao}</button></form>`;
  const identificar = async form => {
    const v = id => form.querySelector('#' + id).value.trim();
    const { data: id, error } = await sb.rpc('estudos_iniciar', { p_igreja: ig, p_nome: v('al-nome'), p_telefone: v('al-tel'), p_consentimento: form.querySelector('#al-lgpd').checked });
    if (error) { form.querySelector('#al-msg').innerHTML = `<div class="erro">${esc(C.traduzErro(error))}</div>`; return false; }
    aluno.id = id; salvarAluno(ig, id);
    const { data: p } = await sb.rpc('estudos_progresso', { p_aluno: id });
    if (p) { aluno.nome = p.nome; aluno.feitos = new Set(p.concluidos || []); }
    return true;
  };
  const marcar = async (n, feito) => {
    const { data: p, error } = await sb.rpc('estudos_concluir', { p_aluno: aluno.id, p_estudo: n, p_feito: feito });
    if (error) { C.toast(C.traduzErro(error)); return false; }
    aluno.feitos = new Set(p.concluidos || []);
    return true;
  };

  const blocoEstudo = (e, i, sozinho) => `
    <article class="estudo">
      <div class="estudo-num">Estudo ${i + 1} de ${ESTUDOS.length}</div>
      <h1>${esc(e.titulo)}</h1>
      <p class="estudo-resumo">${esc(e.resumo)}</p>
      <div class="caixa leia"><span class="rotulo">Leia na sua Bíblia</span><b>${esc(e.leitura)}</b></div>
      ${e.intro.map(p => `<p>${esc(p)}</p>`).join('')}
      <h2>O que a Bíblia ensina</h2>
      <ol class="pontos">${e.pontos.map(([t, txt, ref]) => `<li><h3>${esc(t)}</h3><p>${esc(txt)}</p><span class="ref">${esc(ref)}</span></li>`).join('')}</ol>
      <h2>Para pensar e conversar</h2>
      <ol class="perguntas">${e.perguntas.map(q => `<li>${esc(q)}</li>`).join('')}</ol>
      <div class="caixa desafio"><span class="rotulo">Desafio da semana</span>${esc(e.desafio)}</div>
      <div class="caixa memorizar"><span class="rotulo">Versículo para memorizar</span><b>${esc(e.memorizar)}</b><span>Procure na sua Bíblia, copie num cartão e leia todos os dias até saber de cor.</span></div>
      ${sozinho ? `<div id="concluir" class="nao-imprime"></div>
        <nav class="estudo-nav nao-imprime">${i > 0 ? `<a class="btn" href="#/estudos/${ig}/${i}">‹ Anterior</a>` : '<span></span>'}
          <a class="btn ghost" href="#/estudos/${ig}">Todos os estudos</a>
          ${i < ESTUDOS.length - 1 ? `<a class="btn pri" href="#/estudos/${ig}/${i + 2}">Próximo ›</a>` : '<span></span>'}</nav>` : ''}
    </article>`;

  const desenharConcluir = n => {
    const el = document.getElementById('concluir'); if (!el) return;
    if (!aluno.id) {
      el.innerHTML = `<div class="caixa-aluno">${formAluno('Terminou este estudo?', 'Coloque seu nome para a igreja saber que você concluiu e acompanhar você.', 'Concluí este estudo')}</div>`;
      el.querySelector('form').onsubmit = ev => { ev.preventDefault(); C.ocupado(ev.target.querySelector('[type=submit]'), async () => {
        if (await identificar(ev.target) && await marcar(n, true)) { desenharConcluir(n); C.toast(`Muito bem, ${aluno.nome.split(' ')[0]}! A igreja já sabe que você concluiu este estudo.`); }
      }); };
      return;
    }
    const ok = aluno.feitos.has(n);
    el.innerHTML = `<div class="estudo-acoes"><button class="btn ${ok ? '' : 'pri'}" data-lido>${ok ? '✓ Estudo concluído' : 'Concluí este estudo'}</button><button class="btn" data-imprimir>Imprimir</button></div>
      <p class="muted" style="font-size:13px;margin:8px 0 0">Estudando como ${esc(aluno.nome)}.</p>`;
    el.querySelector('[data-lido]').onclick = ev => C.ocupado(ev.target, async () => {
      if (!await marcar(n, !ok)) return;
      desenharConcluir(n);
      if (!ok) C.toast(aluno.feitos.size >= ESTUDOS.length ? 'Parabéns! Você concluiu os 10 estudos. A igreja já foi avisada.' : `Muito bem, ${aluno.nome.split(' ')[0]}! A igreja já sabe que você concluiu este estudo.`);
    });
  };

  if (qual === 'todos') {
    app.innerHTML = `<div class="leitura">${topo}<div class="estudo-acoes nao-imprime" style="margin:0 0 16px"><button class="btn pri" data-imprimir>Imprimir apostila</button><a class="btn" href="#/estudos/${ig}">Voltar</a></div>
      ${ESTUDOS.map((e, i) => blocoEstudo(e, i, false)).join('<div class="quebra-pagina"></div>')}</div>`;
  } else if (qual && ESTUDOS[+qual - 1]) {
    app.innerHTML = `<div class="leitura">${topo}${blocoEstudo(ESTUDOS[+qual - 1], +qual - 1, true)}</div>`;
    desenharConcluir(+qual);
  } else {
    const desenharCapa = () => {
      const n = aluno.feitos.size;
      app.innerHTML = `<div class="leitura">${topo}
        <section class="estudo capa"><h1>${aluno.id ? 'Olá, ' + esc(aluno.nome.split(' ')[0]) + '!' : 'Seus primeiros passos com Jesus'}</h1>
          <p>Seja bem-vindo à família de Deus! Estes 10 estudos vão ajudar você a entender a sua nova vida em Cristo. Faça um por semana, com a sua Bíblia aberta, e converse sobre eles com o seu discipulador.</p>
          ${aluno.id ? `<div class="progresso"><div class="trilho"><div style="width:${n / ESTUDOS.length * 100}%"></div></div><span>${n} de ${ESTUDOS.length} concluídos</span></div>
            ${n === ESTUDOS.length ? '<div class="caixa memorizar"><span class="rotulo">Parabéns!</span>Você concluiu todos os estudos. Fale com seu discipulador ou com o pastor sobre o próximo passo: o batismo nas águas e a integração em um ministério.</div>' : ''}
            <p class="muted" style="font-size:13px;margin:10px 0 0">Não é ${esc(aluno.nome.split(' ')[0])}? <a href="#" data-trocar>Trocar</a></p>`
          : `<div class="caixa-aluno">${formAluno('Comece colocando seu nome', 'Assim a igreja acompanha você e sabe quando você concluir cada estudo.', 'Começar os estudos')}</div>`}
        </section>
        <ol class="lista-estudos">${ESTUDOS.map((e, i) => `<li><a href="#/estudos/${ig}/${i + 1}"><span class="num-estudo ${aluno.feitos.has(i + 1) ? 'feito' : ''}">${aluno.feitos.has(i + 1) ? '✓' : i + 1}</span>
          <span class="cresce"><b>${esc(e.titulo)}</b><small>${esc(e.resumo)}</small></span><span class="seta">›</span></a></li>`).join('')}</ol>
        <p class="muted nao-imprime" style="text-align:center;font-size:13px;margin:18px 0 0"><a href="#/estudos/${ig}/todos">Ver todos os estudos em uma página</a></p></div>`;
      const f = app.querySelector('.form-aluno');
      if (f) f.onsubmit = ev => { ev.preventDefault(); C.ocupado(ev.target.querySelector('[type=submit]'), async () => { if (await identificar(ev.target)) { desenharCapa(); C.toast(`Bem-vindo, ${aluno.nome.split(' ')[0]}! Comece pelo estudo 1.`); } }); };
      const tr = app.querySelector('[data-trocar]');
      if (tr) tr.onclick = ev => { ev.preventDefault(); salvarAluno(ig, null); Object.assign(aluno, { id: null, nome: '', feitos: new Set() }); desenharCapa(); };
    };
    desenharCapa();
  }
  app.onclick = e => { const b = e.target.closest('[data-imprimir]'); if (b) window.print(); };
}
