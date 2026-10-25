// Livres Connect · Estudos para novo convertido
// Aba interna (QR Code, link e lista das lições) e páginas públicas de
// leitura, abertas pelo QR Code sem login. O progresso fica salvo no
// celular de quem estuda.
import { ESTUDOS } from './estudos-conteudo.js';
import { qrSvg, qrPng } from './pessoas.js';

let C;
export function instalar(ctx) { C = ctx; }

const linkEstudos = (ig, n) => location.origin + location.pathname + '#/estudos/' + ig + (n ? '/' + n : '');
const chave = ig => 'lc-estudos-' + ig;
const lidos = ig => { try { return new Set(JSON.parse(localStorage.getItem(chave(ig)) || '[]')); } catch (e) { return new Set(); } };
const salvarLidos = (ig, s) => { try { localStorage.setItem(chave(ig), JSON.stringify([...s])); } catch (e) { /* sem armazenamento */ } };
const msgEstudos = (ig, nome) => `Olá${nome ? ', ' + nome : ''}! Que alegria ter você na família da ${C.igrejaAtual().nome}. Preparamos 10 estudos bíblicos para os seus primeiros passos com Jesus. Comece por aqui: ${linkEstudos(ig)}`;
export { linkEstudos, msgEstudos };

/* ------------------------------------------------------------------ */
/* aba interna                                                         */
/* ------------------------------------------------------------------ */
export function telaEstudos(main) {
  const { esc } = C, ig = C.S.igrejaId, link = linkEstudos(ig);
  main.innerHTML = C.cab('Estudos para novo convertido', '10 estudos bíblicos para os primeiros passos na fé. O novo convertido abre pelo QR Code ou pelo link, no celular, sem precisar de cadastro.') +
    `<div class="grid">
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
        <p class="muted" style="margin:12px 0 0;font-size:13px">Dica: na ficha de cada novo convertido há o botão <b>Enviar estudos</b>, que abre o WhatsApp com o link pronto. Combine com o discipulador um estudo por semana.</p>
      </section></div>`;
  main.onclick = async e => {
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
  const { data } = await sb.rpc('igreja_publica', { p_igreja: ig });
  const igreja = data && data[0];
  window.scrollTo(0, 0);
  const topo = `<header class="leitura-topo"><a class="brand" href="#/estudos/${ig}"><div class="mark"><svg viewBox="0 0 24 24"><path d="M12 4v16M6 10h12"/></svg></div>
    <div><b>${igreja ? esc(igreja.nome) : 'Livres Connect'}</b><small>Estudos para novo convertido</small></div></a></header>`;
  if (!igreja) { app.innerHTML = `<div class="leitura">${topo}<section class="estudo"><h1>Estudos indisponíveis</h1><p>Este link não está ativo. Fale com a recepção da igreja.</p></section></div>`; return; }

  const feitos = lidos(ig);
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
      ${sozinho ? `<div class="estudo-acoes nao-imprime">
        <button class="btn ${feitos.has(i) ? '' : 'pri'}" data-lido="${i}">${feitos.has(i) ? '✓ Estudado' : 'Marcar como estudado'}</button>
        <button class="btn" data-imprimir>Imprimir</button></div>
        <nav class="estudo-nav nao-imprime">${i > 0 ? `<a class="btn" href="#/estudos/${ig}/${i}">‹ Anterior</a>` : '<span></span>'}
          <a class="btn ghost" href="#/estudos/${ig}">Todos os estudos</a>
          ${i < ESTUDOS.length - 1 ? `<a class="btn pri" href="#/estudos/${ig}/${i + 2}">Próximo ›</a>` : '<span></span>'}</nav>` : ''}
    </article>`;

  if (qual === 'todos') {
    app.innerHTML = `<div class="leitura">${topo}<div class="estudo-acoes nao-imprime" style="margin:0 0 16px"><button class="btn pri" data-imprimir>Imprimir apostila</button><a class="btn" href="#/estudos/${ig}">Voltar</a></div>
      ${ESTUDOS.map((e, i) => blocoEstudo(e, i, false)).join('<div class="quebra-pagina"></div>')}</div>`;
  } else if (qual && ESTUDOS[+qual - 1]) {
    app.innerHTML = `<div class="leitura">${topo}${blocoEstudo(ESTUDOS[+qual - 1], +qual - 1, true)}</div>`;
  } else {
    const n = feitos.size;
    app.innerHTML = `<div class="leitura">${topo}
      <section class="estudo capa"><h1>Seus primeiros passos com Jesus</h1>
        <p>Seja bem-vindo à família de Deus! Estes 10 estudos vão ajudar você a entender a sua nova vida em Cristo. Faça um por semana, com a sua Bíblia aberta, e converse sobre eles com o seu discipulador.</p>
        <div class="progresso"><div class="trilho"><div style="width:${n / ESTUDOS.length * 100}%"></div></div><span>${n} de ${ESTUDOS.length} estudados</span></div>
        ${n === ESTUDOS.length ? '<div class="caixa memorizar"><span class="rotulo">Parabéns!</span>Você concluiu todos os estudos. Fale com seu discipulador ou com o pastor sobre o próximo passo: o batismo nas águas e a integração em um ministério.</div>' : ''}
      </section>
      <ol class="lista-estudos">${ESTUDOS.map((e, i) => `<li><a href="#/estudos/${ig}/${i + 1}"><span class="num-estudo ${feitos.has(i) ? 'feito' : ''}">${feitos.has(i) ? '✓' : i + 1}</span>
        <span class="cresce"><b>${esc(e.titulo)}</b><small>${esc(e.resumo)}</small></span><span class="seta">›</span></a></li>`).join('')}</ol>
      <p class="muted nao-imprime" style="text-align:center;font-size:13px;margin:18px 0 0">O progresso fica salvo neste celular. <a href="#/estudos/${ig}/todos">Ver todos os estudos em uma página</a></p></div>`;
  }
  app.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if ('imprimir' in b.dataset) return window.print();
    if (b.dataset.lido) {
      const i = +b.dataset.lido, s = lidos(ig);
      s.has(i) ? s.delete(i) : s.add(i); salvarLidos(ig, s);
      b.classList.toggle('pri', !s.has(i)); b.textContent = s.has(i) ? '✓ Estudado' : 'Marcar como estudado';
      if (s.has(i)) C.toast(i < ESTUDOS.length - 1 ? 'Muito bem! Quando estiver pronto, siga para o próximo estudo.' : 'Parabéns! Você concluiu os 10 estudos.');
    }
  };
}
