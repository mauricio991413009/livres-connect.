// Livres Connect · Escola de Obreiros
// Turmas, matrículas, aulas com chamada, avaliações com notas, resultado
// (frequência e média) e certificado com QR Code de verificação.
// O certificado também abre sem login em #/certificado/<código>.
import { modal, fecharModal, mh, $v, erroEm, hoje, br, linkWhats, fmtTel, qrSvg, abrirFicha } from './pessoas.js';
import { CURSO, LICOES_ESCOLA } from './escola-conteudo.js';

let C;
export function instalar(ctx) { C = ctx; }

const SIT = { cursando: ['Cursando', 'p-acc'], aprovado: ['Aprovado', 'p-ok'], reprovado: ['Reprovado', 'p-bad'], desistente: ['Desistente', 'p-neu'] };
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const porExtenso = d => d ? `${+d.slice(8, 10)} de ${MESES[+d.slice(5, 7) - 1]} de ${d.slice(0, 4)}` : '';
const nota = n => n == null || isNaN(n) ? '—' : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const linkApostila = (ig, n) => location.origin + location.pathname + '#/apostila/' + ig + (n ? '/' + n : '');
const linkCert = c => location.origin + location.pathname + '#/certificado/' + c;
const turmaDoHash = () => { const m = location.hash.match(/^#\/escola\/([0-9a-f-]{36})/i); return m ? m[1] : null; };
const gere = () => C.pode(['pastor', 'secretaria']);
let abaTurma = 'alunos';

async function equipe() {
  const { data } = await C.sb.rpc('equipe_acompanhamento', { p_igreja: C.S.igrejaId });
  return data || [];
}

/* ------------------------------------------------------------------ */
/* lista de turmas                                                     */
/* ------------------------------------------------------------------ */
export async function telaEscola(main) {
  const id = turmaDoHash();
  if (id) return telaTurma(main, id);
  const { esc, sb } = C;
  main.innerHTML = C.cab('Escola de Obreiros', 'Turmas, chamada, notas e certificados. O professor de cada turma faz a chamada e lança as notas pelo próprio acesso.',
    gere() ? `<button class="btn pri" data-nova>${C.icon('escola')}Nova turma</button>` : '') +
    `<section class="panel"><h2>Turmas</h2><div id="turmas"><div class="carregando">Carregando…</div></div></section>
    <section class="panel"><h2>Apostila do curso <a class="lnk" href="${esc(linkApostila(C.S.igrejaId, 'todos'))}" target="_blank" rel="noopener">Apostila completa para imprimir ›</a></h2>
      <p class="muted" style="margin:-4px 0 12px">${esc(CURSO.subtitulo)}. Cada lição tem estudo, caso para discutir em grupo, perguntas, tarefa prática, revisão e orientações para o professor. Os alunos abrem pelo link, sem login.</p>
      <div class="lista">${LICOES_ESCOLA.map((l, i) => `<div class="linha"><span class="num-estudo">${i + 1}</span><div class="cresce"><b style="font-weight:600">${esc(l.titulo)}</b><div class="muted" style="font-size:13.5px">${esc(l.objetivo)}</div></div>
        <a class="btn sm" href="${esc(linkApostila(C.S.igrejaId, i + 1))}" target="_blank" rel="noopener">Abrir</a></div>`).join('')}</div>
      <div class="acts" style="margin-top:12px"><button class="btn sm" data-copiar-apostila>Copiar link para os alunos</button></div></section>`;
  const [{ data: ts, error }, { data: als }, eq] = await Promise.all([
    sb.from('escola_turmas').select('*').eq('igreja_id', C.S.igrejaId).order('criado_em', { ascending: false }),
    sb.from('escola_alunos').select('turma_id,situacao').eq('igreja_id', C.S.igrejaId),
    equipe()
  ]);
  if (error) return erroEm('turmas', error);
  const nomeProf = id => (eq.find(e => e.user_id === id) || {}).nome || '—';
  const conta = (t, s) => (als || []).filter(a => a.turma_id === t && (!s || a.situacao === s)).length;
  document.getElementById('turmas').innerHTML = (ts || []).length ? `<div class="tw"><table><thead><tr><th>Turma</th><th>Período</th><th>Horário</th><th>Professor</th><th class="r">Alunos</th><th class="r">Aprovados</th><th>Situação</th><th></th></tr></thead><tbody>
    ${ts.map(t => `<tr class="clicavel" data-turma="${t.id}"><td><b style="font-weight:600">${esc(t.nome)}</b><small class="muted" style="display:block">${esc(t.curso)}</small></td>
      <td class="num" style="white-space:nowrap">${br(t.inicio) || '—'}${t.fim ? ' a ' + br(t.fim) : ''}</td><td>${esc(t.horario || '—')}</td><td>${esc(nomeProf(t.professor_id))}</td>
      <td class="r num">${conta(t.id)}</td><td class="r num">${conta(t.id, 'aprovado')}</td>
      <td>${t.status === 'aberta' ? '<span class="pill p-ok">em andamento</span>' : '<span class="pill p-neu">encerrada</span>'}</td>
      <td class="acoes"><button class="btn sm" data-turma="${t.id}">Abrir</button></td></tr>`).join('')}</tbody></table></div>`
    : `<div class="vazio">${gere() ? 'Nenhuma turma ainda. Use "Nova turma" para começar: depois você matricula os alunos e o professor faz a chamada e lança as notas.' : 'Você não é professor de nenhuma turma. Quando o pastor ou a secretaria colocar você como professor, a turma aparece aqui.'}</div>`;
  main.onclick = e => {
    const t = e.target.closest('[data-turma]'); if (t) { location.hash = '#/escola/' + t.dataset.turma; return; }
    if (e.target.closest('[data-nova]')) formTurma(null, eq, id => { location.hash = '#/escola/' + id; });
    if (e.target.closest('[data-copiar-apostila]')) { const l = linkApostila(C.S.igrejaId); navigator.clipboard.writeText(l).then(() => C.toast('Link da apostila copiado.'), () => prompt('Copie o link:', l)); }
  };
}

/* ------------------------------------------------------------------ */
/* cadastro e edição da turma                                          */
/* ------------------------------------------------------------------ */
function formTurma(t, eq, depois) {
  const { esc } = C, v = t || { curso: 'Escola de Obreiros', media_minima: 7, frequencia_minima: 75, status: 'aberta' };
  const md = modal(mh(t ? 'Editar turma' : 'Nova turma', 'O professor escolhido faz a chamada e lança as notas desta turma.') + `
    <form class="f" id="f-tu">
      <div class="fld"><label for="tu-nome">Nome da turma</label><input id="tu-nome" required minlength="2" value="${esc(v.nome || '')}" placeholder="Ex.: Turma 2027"></div>
      <div class="fld"><label for="tu-curso">Curso</label><input id="tu-curso" required value="${esc(v.curso)}"></div>
      <div class="fld"><label for="tu-ini">Início</label><input id="tu-ini" type="date" value="${esc(v.inicio || '')}"></div>
      <div class="fld"><label for="tu-fim">Término previsto</label><input id="tu-fim" type="date" value="${esc(v.fim || '')}"></div>
      <div class="fld"><label for="tu-hor">Dia e horário</label><input id="tu-hor" value="${esc(v.horario || '')}" placeholder="Ex.: Sábados, 9h às 11h"></div>
      <div class="fld"><label for="tu-loc">Local</label><input id="tu-loc" value="${esc(v.local || '')}" placeholder="Ex.: Sala 2"></div>
      <div class="fld full"><label for="tu-prof">Professor responsável</label><select id="tu-prof"><option value="">A definir</option>${eq.map(e => `<option value="${e.user_id}" ${e.user_id === v.professor_id ? 'selected' : ''}>${esc(e.nome)}</option>`).join('')}</select>
        <span class="dica">Aparecem aqui pastores, presbíteros e líderes com acesso ao sistema. Professores convidados podem ser anotados em cada aula.</span></div>
      <div class="fld"><label for="tu-media">Média mínima para aprovação</label><input id="tu-media" type="number" min="0" max="10" step="0.5" value="${v.media_minima}"></div>
      <div class="fld"><label for="tu-freq">Frequência mínima (%)</label><input id="tu-freq" type="number" min="0" max="100" step="5" value="${v.frequencia_minima}"></div>
      ${t ? `<div class="fld"><label for="tu-st">Situação</label><select id="tu-st"><option value="aberta" ${v.status === 'aberta' ? 'selected' : ''}>Em andamento</option><option value="encerrada" ${v.status === 'encerrada' ? 'selected' : ''}>Encerrada</option></select></div>` : ''}
      <div id="tu-msg" class="fld full"></div>
      <div class="fa">${t && C.pode(['pastor']) ? '<button type="button" class="btn danger" data-excluir style="margin-right:auto">Excluir turma</button>' : ''}<button type="button" class="btn" data-fechar>Cancelar</button><button class="btn pri" type="submit">${t ? 'Salvar' : 'Criar turma'}</button></div>
    </form>`);
  md.querySelector('#f-tu').onsubmit = e => {
    e.preventDefault();
    C.ocupado(e.target.querySelector('[type=submit]'), async () => {
      const reg = { nome: $v('tu-nome'), curso: $v('tu-curso'), inicio: $v('tu-ini') || null, fim: $v('tu-fim') || null, horario: $v('tu-hor') || null,
        local: $v('tu-loc') || null, professor_id: $v('tu-prof') || null, media_minima: +$v('tu-media') || 0, frequencia_minima: +$v('tu-freq') || 0 };
      if (t) reg.status = $v('tu-st');
      const r = t ? await C.sb.from('escola_turmas').update(reg).eq('id', t.id)
        : await C.sb.from('escola_turmas').insert({ ...reg, igreja_id: C.S.igrejaId }).select('id').single();
      if (r.error) return erroEm('tu-msg', r.error);
      fecharModal(); C.toast(t ? 'Turma salva.' : 'Turma criada. Agora matricule os alunos.'); depois((r.data && r.data.id) || (t && t.id));
    });
  };
  const ex = md.querySelector('[data-excluir]');
  if (ex) ex.onclick = () => C.ocupado(ex, async () => {
    if (!confirm('Excluir esta turma com todas as aulas, notas e matrículas? Os certificados emitidos deixam de valer.')) return;
    const { error } = await C.sb.from('escola_turmas').delete().eq('id', t.id);
    if (error) return erroEm('tu-msg', error);
    fecharModal(); C.toast('Turma excluída.'); location.hash = '#/escola';
  });
}

/* ------------------------------------------------------------------ */
/* turma                                                               */
/* ------------------------------------------------------------------ */
async function telaTurma(main, id) {
  const { esc, sb } = C;
  main.innerHTML = '<div class="carregando">Carregando turma…</div>';
  const { data: t } = await sb.from('escola_turmas').select('*').eq('id', id).maybeSingle();
  if (!t) { main.innerHTML = C.cab('Turma não encontrada', 'Ela pode ter sido excluída ou você não tem acesso a ela.', '<a class="btn" href="#/escola">‹ Turmas</a>'); return; }
  const [{ data: als }, { data: aulas }, { data: avs }, eq] = await Promise.all([
    sb.rpc('escola_alunos_da_turma', { p_turma: id }),
    sb.from('escola_aulas').select('*').eq('turma_id', id).order('data', { ascending: false }),
    sb.from('escola_avaliacoes').select('*').eq('turma_id', id).order('criado_em'),
    equipe()
  ]);
  const idsAula = (aulas || []).map(a => a.id), idsAv = (avs || []).map(a => a.id);
  const [{ data: pres }, { data: nts }] = await Promise.all([
    idsAula.length ? sb.from('escola_presencas').select('aula_id,aluno_id,presente').in('aula_id', idsAula) : Promise.resolve({ data: [] }),
    idsAv.length ? sb.from('escola_notas').select('avaliacao_id,aluno_id,nota').in('avaliacao_id', idsAv) : Promise.resolve({ data: [] })
  ]);
  const alunos = als || [], P = pres || [], N = nts || [];
  const cuida = gere() || t.professor_id === C.S.user.id;
  const recarregar = () => telaTurma(main, id);

  // Frequência: presenças sobre as aulas que já tiveram chamada
  const aulasComChamada = new Set(P.map(p => p.aula_id));
  const freq = a => { const r = P.filter(p => p.aluno_id === a.id); return r.length ? Math.round(r.filter(p => p.presente).length / r.length * 100) : null; };
  // Média ponderada das avaliações que já têm nota
  const media = a => { let s = 0, w = 0; (avs || []).forEach(av => { const n = N.find(x => x.avaliacao_id === av.id && x.aluno_id === a.id); if (n) { s += n.nota * av.peso; w += +av.peso; } }); return w ? s / w : null; };
  const atende = a => { const f = freq(a), m = media(a); return (f === null || f >= t.frequencia_minima) && (m === null || m >= t.media_minima) && (f !== null || m !== null); };
  const ativos = alunos.filter(a => a.situacao !== 'desistente');
  const fs = ativos.map(freq).filter(x => x !== null), ms = ativos.map(media).filter(x => x !== null);

  main.innerHTML = C.cab(esc(t.nome), `${esc(t.curso)}${t.inicio ? ' · ' + br(t.inicio) + (t.fim ? ' a ' + br(t.fim) : '') : ''}${t.horario ? ' · ' + esc(t.horario) : ''}${t.local ? ' · ' + esc(t.local) : ''} · Professor: ${esc((eq.find(e => e.user_id === t.professor_id) || {}).nome || 'a definir')}`,
    `<a class="btn" href="#/escola">‹ Turmas</a><a class="btn" href="${esc(linkApostila(t.igreja_id))}" target="_blank" rel="noopener">Apostila</a>${gere() ? '<button class="btn" data-editar>Editar turma</button><button class="btn pri" data-matricular>Matricular alunos</button>' : ''}`) +
    `<div class="kpis">
      <div class="kpi"><span class="l">Alunos</span><span class="v">${ativos.length}</span><span class="s">${(n => n === 1 ? '1 aprovado' : n + ' aprovados')(alunos.filter(a => a.situacao === 'aprovado').length)}</span></div>
      <div class="kpi"><span class="l">Aulas dadas</span><span class="v">${aulasComChamada.size}</span><span class="s">${(aulas || []).length} cadastradas</span></div>
      <div class="kpi"><span class="l">Frequência média</span><span class="v">${fs.length ? Math.round(fs.reduce((a, b) => a + b, 0) / fs.length) + '%' : '—'}</span><span class="s">mínimo ${t.frequencia_minima}%</span></div>
      <div class="kpi"><span class="l">Média da turma</span><span class="v">${ms.length ? nota(ms.reduce((a, b) => a + b, 0) / ms.length) : '—'}</span><span class="s">mínimo ${nota(t.media_minima)}</span></div></div>
    <section class="panel"><div class="chips" style="margin-bottom:14px">${[['alunos', 'Alunos e resultado'], ['aulas', 'Aulas e chamada'], ['notas', 'Avaliações e notas']].map(([k, l]) => `<button class="chip ${abaTurma === k ? 'on' : ''}" data-aba="${k}">${l}</button>`).join('')}</div>
      <div id="aba"></div></section>`;

  const desenhar = () => {
    const el = document.getElementById('aba');
    main.querySelectorAll('[data-aba]').forEach(b => b.classList.toggle('on', b.dataset.aba === abaTurma));
    if (abaTurma === 'alunos') {
      el.innerHTML = alunos.length ? `<div class="tw"><table><thead><tr><th>Aluno</th><th>WhatsApp</th><th class="r">Frequência</th><th class="r">Média</th><th>Situação</th><th></th></tr></thead><tbody>
        ${alunos.map(a => { const f = freq(a), m = media(a), w = linkWhats(a.telefone, `Olá, ${a.nome.split(' ')[0]}! Aqui é da ${C.igrejaAtual().nome}, sobre a ${t.nome} da ${t.curso}. `);
          return `<tr><td><button class="lk" data-ficha="${a.pessoa_id}">${esc(a.nome)}</button><small class="muted" style="display:block">matrícula em ${br(a.matriculado_em)}</small></td>
          <td class="num" style="white-space:nowrap">${w ? `<a class="lk-tel" href="${esc(w)}" target="_blank" rel="noopener">${esc(fmtTel(a.telefone))}</a>` : '<span class="muted">—</span>'}</td>
          <td class="r">${f === null ? '<span class="muted">—</span>' : `<span class="pill ${f >= t.frequencia_minima ? 'p-ok' : 'p-warn'}">${f}%</span>`}</td>
          <td class="r">${m === null ? '<span class="muted">—</span>' : `<span class="pill ${m >= t.media_minima ? 'p-ok' : 'p-warn'}">${nota(m)}</span>`}</td>
          <td>${cuida ? `<select data-sit="${a.id}" aria-label="Situação de ${esc(a.nome)}">${Object.entries(SIT).map(([k, [l]]) => `<option value="${k}" ${k === a.situacao ? 'selected' : ''}>${l}</option>`).join('')}</select>` : `<span class="pill ${SIT[a.situacao][1]}">${SIT[a.situacao][0]}</span>`}</td>
          <td class="acoes">${a.certificado ? `<a class="btn sm" href="${esc(linkCert(a.certificado))}" target="_blank" rel="noopener">Certificado</a>${w ? `<a class="btn sm whats" href="${esc(linkWhats(a.telefone, `Parabéns, ${a.nome.split(' ')[0]}! Você concluiu a ${t.curso} (${t.nome}). Seu certificado está aqui: ${linkCert(a.certificado)}`))}" target="_blank" rel="noopener">Enviar</a>` : ''}` : ''}
            ${gere() && a.situacao === 'cursando' ? `<button class="btn sm danger" data-cancelar="${a.id}">Cancelar matrícula</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>
        ${cuida && alunos.some(a => a.situacao === 'cursando') ? `<div class="aviso" style="margin-top:14px"><b>Fechar o resultado:</b> quem atingiu ${t.frequencia_minima}% de frequência e média ${nota(t.media_minima)} fica aprovado e recebe o certificado; os demais ficam reprovados. Você pode ajustar cada aluno depois.
          <div class="acts" style="margin-top:8px"><button class="btn pri sm" data-fechar-resultado>Fechar resultado da turma</button></div></div>` : ''}`
        : `<div class="vazio">Nenhum aluno matriculado.${gere() ? ' Use "Matricular alunos" para escolher entre os membros da igreja.' : ''}</div>`;
    } else if (abaTurma === 'aulas') {
      const dadas = new Set((aulas || []).map(a => a.tema));
      const proxima = LICOES_ESCOLA.findIndex((l, i) => !dadas.has(`Lição ${i + 1}: ${l.titulo}`));
      el.innerHTML = (cuida ? `<form class="f" id="f-aula" style="grid-template-columns:150px 1fr 1fr auto;align-items:end;margin-bottom:14px">
          <div class="fld full"><label for="au-lic">Lição da apostila</label><select id="au-lic"><option value="">Outro tema</option>${LICOES_ESCOLA.map((l, i) => `<option value="${i + 1}" ${i === proxima ? 'selected' : ''}>${i + 1}. ${esc(l.titulo)}${dadas.has(`Lição ${i + 1}: ${l.titulo}`) ? ' ✓' : ''}</option>`).join('')}</select></div>
          <div class="fld"><label for="au-data">Data</label><input id="au-data" type="date" value="${hoje()}" required></div>
          <div class="fld"><label for="au-tema">Tema da aula</label><input id="au-tema" required minlength="2" placeholder="Ex.: O chamado do obreiro" value="${proxima >= 0 ? esc(`Lição ${proxima + 1}: ${LICOES_ESCOLA[proxima].titulo}`) : ''}"></div>
          <div class="fld"><label for="au-prof">Professor <span class="muted">(se for outro)</span></label><input id="au-prof" placeholder="opcional"></div>
          <button class="btn pri" type="submit">Adicionar aula</button><div id="au-msg" class="fld full"></div></form>` : '') +
        ((aulas || []).length ? `<div class="tw"><table><thead><tr><th>Data</th><th>Tema</th><th class="r">Presentes</th><th></th></tr></thead><tbody>
          ${aulas.map(au => { const r = P.filter(p => p.aula_id === au.id); return `<tr><td class="num">${br(au.data)}</td><td>${esc(au.tema)}${au.professor ? `<small class="muted" style="display:block">${esc(au.professor)}</small>` : ''}</td>
            <td class="r">${r.length ? `${r.filter(p => p.presente).length} de ${r.length}` : '<span class="pill p-warn">sem chamada</span>'}</td>
            <td class="acoes">${cuida ? `<button class="btn sm ${r.length ? '' : 'pri'}" data-chamada="${au.id}">${r.length ? 'Ver chamada' : 'Fazer chamada'}</button><button class="btn sm danger" data-del-aula="${au.id}">Excluir</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>`
          : '<div class="vazio">Nenhuma aula cadastrada. Cadastre a aula do dia e faça a chamada.</div>');
    } else {
      el.innerHTML = (cuida ? `<form class="f" id="f-av" style="grid-template-columns:1fr 150px 110px auto;align-items:end;margin-bottom:14px">
          <div class="fld"><label for="av-tit">Avaliação</label><input id="av-tit" required minlength="2" placeholder="Ex.: Prova do módulo 1"></div>
          <div class="fld"><label for="av-data">Data</label><input id="av-data" type="date" value="${hoje()}"></div>
          <div class="fld"><label for="av-peso">Peso</label><input id="av-peso" type="number" min="0.5" max="10" step="0.5" value="1"></div>
          <button class="btn pri" type="submit">Adicionar</button><div id="av-msg" class="fld full"></div></form>` : '') +
        ((avs || []).length && ativos.length ? `<div class="tw"><table class="notas"><thead><tr><th>Aluno</th>${avs.map(av => `<th class="r">${esc(av.titulo)}<small class="muted" style="display:block;text-transform:none;letter-spacing:0">peso ${nota(av.peso)}${cuida ? ` · <button class="lk" data-del-av="${av.id}" title="Excluir avaliação">excluir</button>` : ''}</small></th>`).join('')}<th class="r">Média</th></tr></thead><tbody>
          ${ativos.map(a => `<tr><td>${esc(a.nome)}</td>${avs.map(av => { const n = N.find(x => x.avaliacao_id === av.id && x.aluno_id === a.id);
            return `<td class="r">${cuida ? `<input class="nota" type="text" inputmode="decimal" maxlength="4" value="${n ? nota(n.nota) : ''}" data-av="${av.id}" data-al="${a.id}" aria-label="Nota de ${esc(a.nome)} em ${esc(av.titulo)}">` : nota(n && n.nota)}</td>`; }).join('')}
            <td class="r"><b class="num" data-media="${a.id}">${nota(media(a))}</b></td></tr>`).join('')}</tbody></table></div>
          ${cuida ? '<p class="muted" style="margin:10px 0 0;font-size:13px">Digite a nota de 0 a 10. Ela é salva assim que você sai do campo.</p>' : ''}`
          : `<div class="vazio">${(avs || []).length ? 'Matricule alunos para lançar as notas.' : 'Nenhuma avaliação cadastrada. Adicione provas, trabalhos ou participação, com o peso de cada uma.'}</div>`);
    }
    ligarFormularios();
  };

  const ligarFormularios = () => {
    const sl = document.getElementById('au-lic');
    if (sl) sl.onchange = () => { const i = +sl.value; document.getElementById('au-tema').value = i ? `Lição ${i}: ${LICOES_ESCOLA[i - 1].titulo}` : ''; };
    const fa = document.getElementById('f-aula');
    if (fa) fa.onsubmit = e => { e.preventDefault(); C.ocupado(e.target.querySelector('[type=submit]'), async () => {
      const { data: nova, error } = await sb.from('escola_aulas').insert({ igreja_id: t.igreja_id, turma_id: id, data: $v('au-data'), tema: $v('au-tema'), professor: $v('au-prof') || null }).select('id').single();
      if (error) return erroEm('au-msg', error);
      C.toast('Aula cadastrada. Faça a chamada.'); await recarregar(); if (nova && nova.id) chamada(nova.id);
    }); };
    const fv = document.getElementById('f-av');
    if (fv) fv.onsubmit = e => { e.preventDefault(); C.ocupado(e.target.querySelector('[type=submit]'), async () => {
      const { error } = await sb.from('escola_avaliacoes').insert({ igreja_id: t.igreja_id, turma_id: id, titulo: $v('av-tit'), data: $v('av-data') || null, peso: +$v('av-peso') || 1 });
      if (error) return erroEm('av-msg', error);
      C.toast('Avaliação criada. Lance as notas na tabela.'); recarregar();
    }); };
  };

  // Chamada de uma aula
  const chamada = aulaId => {
    const au = (aulas || []).find(a => a.id === aulaId) || { tema: '', data: hoje() };
    const lista = alunos.filter(a => a.situacao !== 'desistente');
    const md = modal(mh('Chamada', `${br(au.data)} · ${esc(au.tema)}`) + (lista.length ? `
      <div class="chamada">${lista.map(a => { const r = P.find(p => p.aula_id === aulaId && p.aluno_id === a.id);
        return `<label><input type="checkbox" data-pres="${a.id}" ${!r || r.presente ? 'checked' : ''}> <span>${esc(a.nome)}</span></label>`; }).join('')}</div>
      <p class="muted" style="margin:0;font-size:13px">Desmarque quem faltou.</p>
      <div class="fa"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn pri" data-salvar>Salvar chamada</button></div>`
      : '<div class="vazio">Nenhum aluno matriculado nesta turma.</div>'));
    const bs = md.querySelector('[data-salvar]');
    if (bs) bs.onclick = () => C.ocupado(bs, async () => {
      const rows = [...md.querySelectorAll('[data-pres]')].map(ch => ({ igreja_id: t.igreja_id, aula_id: aulaId, aluno_id: ch.dataset.pres, presente: ch.checked }));
      const { error } = await sb.from('escola_presencas').upsert(rows, { onConflict: 'aula_id,aluno_id' });
      if (error) return C.toast(C.traduzErro(error));
      fecharModal(); C.toast(`Chamada salva: ${rows.filter(r => r.presente).length} presentes.`); recarregar();
    });
  };

  // Matricular: membros (etapa Membro em diante) que ainda não estão na turma
  const matricular = async () => {
    const { data: ps } = await sb.from('pessoas').select('id,nome,etapa').eq('igreja_id', t.igreja_id).eq('situacao', 'ativo').gte('etapa', 4).order('nome');
    const ja = new Set(alunos.map(a => a.pessoa_id)), livres = (ps || []).filter(p => !ja.has(p.id));
    const md = modal(mh('Matricular alunos', 'Membros ativos da igreja. Marque quem vai estudar nesta turma.') + (livres.length ? `
      <input type="search" id="mt-q" placeholder="Buscar pelo nome" aria-label="Buscar membro">
      <div class="chamada" id="mt-lista">${livres.map(p => `<label data-nome="${esc(p.nome.toLowerCase())}"><input type="checkbox" data-mat="${p.id}"> <span>${esc(p.nome)}</span><small class="muted">${C.ETAPAS[p.etapa]}</small></label>`).join('')}</div>
      <div class="fa"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn pri" data-salvar>Matricular</button></div>`
      : '<div class="vazio">Todos os membros ativos já estão nesta turma, ou ainda não há membros cadastrados.</div>'), true);
    const q = md.querySelector('#mt-q');
    if (q) q.oninput = () => md.querySelectorAll('#mt-lista label').forEach(l => { l.hidden = !l.dataset.nome.includes(q.value.toLowerCase().trim()); });
    const bs = md.querySelector('[data-salvar]');
    if (bs) bs.onclick = () => C.ocupado(bs, async () => {
      const rows = [...md.querySelectorAll('[data-mat]:checked')].map(ch => ({ igreja_id: t.igreja_id, turma_id: id, pessoa_id: ch.dataset.mat }));
      if (!rows.length) return C.toast('Marque pelo menos uma pessoa.');
      const { error } = await sb.from('escola_alunos').insert(rows);
      if (error) return C.toast(C.traduzErro(error));
      fecharModal(); C.toast(rows.length === 1 ? '1 aluno matriculado.' : rows.length + ' alunos matriculados.'); abaTurma = 'alunos'; recarregar();
    });
  };

  desenhar();
  main.onclick = async e => {
    const aba = e.target.closest('[data-aba]'); if (aba) { abaTurma = aba.dataset.aba; return desenhar(); }
    if (e.target.closest('[data-editar]')) return formTurma(t, eq, recarregar);
    if (e.target.closest('[data-matricular]')) return matricular();
    const fi = e.target.closest('[data-ficha]'); if (fi) return abrirFicha(fi.dataset.ficha, recarregar);
    const ch = e.target.closest('[data-chamada]'); if (ch) return chamada(ch.dataset.chamada);
    const da = e.target.closest('[data-del-aula]');
    if (da && confirm('Excluir esta aula e a chamada dela?')) { const { error } = await sb.from('escola_aulas').delete().eq('id', da.dataset.delAula); return error ? C.toast(C.traduzErro(error)) : (C.toast('Aula excluída.'), recarregar()); }
    const dv = e.target.closest('[data-del-av]');
    if (dv && confirm('Excluir esta avaliação e as notas dela?')) { const { error } = await sb.from('escola_avaliacoes').delete().eq('id', dv.dataset.delAv); return error ? C.toast(C.traduzErro(error)) : (C.toast('Avaliação excluída.'), recarregar()); }
    const ca = e.target.closest('[data-cancelar]');
    if (ca && confirm('Cancelar a matrícula deste aluno? A chamada e as notas dele nesta turma serão apagadas.')) { const { error } = await sb.from('escola_alunos').delete().eq('id', ca.dataset.cancelar); return error ? C.toast(C.traduzErro(error)) : (C.toast('Matrícula cancelada.'), recarregar()); }
    const fr = e.target.closest('[data-fechar-resultado]');
    if (fr) {
      const cursando = alunos.filter(a => a.situacao === 'cursando'), ok = cursando.filter(atende);
      if (!confirm(`${ok.length} aluno(s) serão aprovados e ${cursando.length - ok.length} reprovado(s). Confirmar?`)) return;
      C.ocupado(fr, async () => {
        for (const a of cursando) {
          const { error } = await sb.from('escola_alunos').update({ situacao: atende(a) ? 'aprovado' : 'reprovado' }).eq('id', a.id);
          if (error) return C.toast(C.traduzErro(error));
        }
        if (gere() && t.status === 'aberta') await sb.from('escola_turmas').update({ status: 'encerrada' }).eq('id', id);
        C.toast(`Resultado fechado: ${ok.length} aprovado(s). Os certificados já estão disponíveis.`); recarregar();
      });
    }
  };
  main.onchange = async e => {
    const s = e.target.closest('[data-sit]');
    if (s) {
      const { error } = await sb.from('escola_alunos').update({ situacao: s.value }).eq('id', s.dataset.sit);
      if (error) return C.toast(C.traduzErro(error));
      C.toast(s.value === 'aprovado' ? 'Aprovado. O certificado já está disponível.' : 'Situação atualizada.'); return recarregar();
    }
    const n = e.target.closest('input.nota');
    if (n) {
      const val = n.value.trim() === '' ? null : Math.round(Number(n.value.replace(',', '.')) * 10) / 10;
      if (val !== null && (isNaN(val) || val < 0 || val > 10)) { n.classList.add('invalido'); return C.toast('A nota vai de 0 a 10.'); }
      n.classList.remove('invalido');
      const chave = { avaliacao_id: n.dataset.av, aluno_id: n.dataset.al };
      const { error } = val === null
        ? await sb.from('escola_notas').delete().eq('avaliacao_id', chave.avaliacao_id).eq('aluno_id', chave.aluno_id)
        : await sb.from('escola_notas').upsert({ igreja_id: t.igreja_id, ...chave, nota: val }, { onConflict: 'avaliacao_id,aluno_id' });
      if (error) return C.toast(C.traduzErro(error));
      const i = N.findIndex(x => x.avaliacao_id === chave.avaliacao_id && x.aluno_id === chave.aluno_id);
      if (i >= 0) N.splice(i, 1); if (val !== null) N.push({ ...chave, nota: val });
      const al = alunos.find(a => a.id === chave.aluno_id), el = main.querySelector(`[data-media="${chave.aluno_id}"]`);
      if (el && al) el.textContent = nota(media(al));
      n.classList.add('salvo'); setTimeout(() => n.classList.remove('salvo'), 900);
    }
  };
}

/* ------------------------------------------------------------------ */
/* certificado (página pública, para imprimir e conferir)              */
/* ------------------------------------------------------------------ */
export async function telaCertificado(codigo) {
  const { esc, sb } = C, app = document.getElementById('app');
  const { data } = await sb.rpc('certificado_publico', { p_codigo: codigo });
  const c = data && data[0];
  if (!c) {
    app.innerHTML = `<div class="auth"><div class="auth-card"><h1>Certificado não encontrado</h1><p>Este código não corresponde a nenhum certificado válido. Confira o link ou fale com a secretaria da igreja.</p></div></div>`;
    return;
  }
  const link = linkCert(codigo);
  const periodo = c.inicio ? `realizada de ${br(c.inicio)} a ${br(c.fim && c.fim <= c.concluido_em ? c.fim : c.concluido_em)}, ` : '';
  app.innerHTML = `<div class="cert-pagina">
    <div class="estudo-acoes nao-imprime"><button class="btn pri" data-imprimir>Imprimir certificado</button><span class="muted" style="font-size:13px">Dica: na impressão, escolha a orientação "paisagem".</span></div>
    <article class="certificado">
      <div class="cert-borda">
        <div class="cert-igreja">${esc(c.igreja)}${c.cidade ? ' · ' + esc(c.cidade) + (c.uf ? '/' + esc(c.uf) : '') : ''}</div>
        <h1>Certificado</h1>
        <p class="cert-texto">Certificamos que</p>
        <div class="cert-nome">${esc(c.nome)}</div>
        <p class="cert-texto">concluiu com aproveitamento a <b>${esc(c.curso)}</b> (${esc(c.turma)}), ${periodo}${c.aulas ? `com ${c.aulas} aula${c.aulas > 1 ? 's' : ''}, ` : ''}sendo aprovado(a) em ${porExtenso(c.concluido_em)}.</p>
        <p class="cert-verso">“Procura apresentar-te a Deus aprovado, como obreiro que não tem de que se envergonhar.” 2 Timóteo 2.15</p>
        <div class="cert-rodape">
          <div class="cert-assin"><span></span>Pastor presidente</div>
          <div class="cert-qr">${qrSvg(link, 3)}<small>Confira a autenticidade<br>apontando a câmera</small></div>
          <div class="cert-assin"><span></span>Coordenação da Escola</div>
        </div>
        <div class="cert-codigo">Código ${esc(codigo)}</div>
      </div>
    </article></div>`;
  app.onclick = e => { if (e.target.closest('[data-imprimir]')) window.print(); };
}


/* ------------------------------------------------------------------ */
/* apostila (página pública para alunos e professores)                 */
/* ------------------------------------------------------------------ */
export const blocoLicaoEscola = (l, i, esc) => `
  <article class="estudo">
    <div class="estudo-num">Lição ${i + 1} de ${LICOES_ESCOLA.length}</div>
    <h1>${esc(l.titulo)}</h1>
    <p class="estudo-resumo"><b>Objetivo:</b> ${esc(l.objetivo)}</p>
    <div class="caixa leia"><span class="rotulo">Leitura bíblica</span><b>${esc(l.leitura)}</b><span>Versículo-chave: ${esc(l.versiculo)}</span></div>
    ${l.intro.map(p => `<p>${esc(p)}</p>`).join('')}
    ${l.secoes.map((s, k) => `<h2>${k + 1}. ${esc(s.t)}</h2>${s.p.map(p => `<p>${esc(p)}</p>`).join('')}<span class="secao-ref">${esc(s.refs)}</span>`).join('')}
    <div class="caixa caso"><span class="rotulo">Estudo de caso · para discutir em grupo</span>${esc(l.caso)}</div>
    <h2>Perguntas para discussão</h2>
    <ol class="perguntas">${l.perguntas.map(q => `<li>${esc(q)}</li>`).join('')}</ol>
    <div class="caixa desafio"><span class="rotulo">Tarefa prática da semana</span>${esc(l.pratica)}</div>
    <h2>Revisão</h2>
    <ol class="perguntas">${l.revisao.map(q => `<li>${esc(q)}</li>`).join('')}</ol>
    <details class="caixa professor"><summary class="rotulo">Orientações para o professor</summary><ul>${l.professor.map(p => `<li>${esc(p)}</li>`).join('')}</ul></details>
  </article>`;

export async function telaApostila(ig, qual) {
  const { esc, sb } = C, app = document.getElementById('app');
  window.scrollTo(0, 0);
  const { data } = await sb.rpc('igreja_publica', { p_igreja: ig });
  const igreja = data && data[0];
  const topo = `<header class="leitura-topo"><a class="brand" href="#/apostila/${ig}"><div class="mark"><svg viewBox="0 0 24 24"><path d="M12 4v16M6 10h12"/></svg></div>
    <div><b>${igreja ? esc(igreja.nome) : 'Livres Connect'}</b><small>${esc(CURSO.nome)}</small></div></a></header>`;
  if (!igreja) { app.innerHTML = `<div class="leitura">${topo}<section class="estudo"><h1>Apostila indisponível</h1><p>Este link não está ativo. Fale com a coordenação da Escola.</p></section></div>`; return; }
  if (qual === 'todos') {
    app.innerHTML = `<div class="leitura">${topo}<div class="estudo-acoes nao-imprime" style="margin:0 0 16px"><button class="btn pri" data-imprimir>Imprimir apostila</button><a class="btn" href="#/apostila/${ig}">Voltar</a></div>
      <section class="estudo capa"><h1>${esc(CURSO.nome)}</h1><p class="estudo-resumo">${esc(CURSO.subtitulo)}</p>${CURSO.apresentacao.map(p => `<p>${esc(p)}</p>`).join('')}
        <h2>Lições</h2><ol>${LICOES_ESCOLA.map(l => `<li>${esc(l.titulo)}</li>`).join('')}</ol></section>
      <div class="quebra-pagina"></div>${LICOES_ESCOLA.map((l, i) => blocoLicaoEscola(l, i, esc)).join('<div class="quebra-pagina"></div>')}</div>`;
    app.querySelectorAll('details.professor').forEach(d => { d.open = true; });
  } else if (qual && LICOES_ESCOLA[+qual - 1]) {
    const i = +qual - 1;
    app.innerHTML = `<div class="leitura">${topo}${blocoLicaoEscola(LICOES_ESCOLA[i], i, esc)}
      <div class="estudo-acoes nao-imprime"><button class="btn" data-imprimir>Imprimir esta lição</button></div>
      <nav class="estudo-nav nao-imprime">${i > 0 ? `<a class="btn" href="#/apostila/${ig}/${i}">‹ Anterior</a>` : '<span></span>'}
        <a class="btn ghost" href="#/apostila/${ig}">Todas as lições</a>
        ${i < LICOES_ESCOLA.length - 1 ? `<a class="btn pri" href="#/apostila/${ig}/${i + 2}">Próxima ›</a>` : '<span></span>'}</nav></div>`;
  } else {
    app.innerHTML = `<div class="leitura">${topo}
      <section class="estudo capa"><h1>${esc(CURSO.nome)}</h1><p class="estudo-resumo">${esc(CURSO.subtitulo)}</p>${CURSO.apresentacao.map(p => `<p>${esc(p)}</p>`).join('')}</section>
      <ol class="lista-estudos">${LICOES_ESCOLA.map((l, i) => `<li><a href="#/apostila/${ig}/${i + 1}"><span class="num-estudo">${i + 1}</span><span class="cresce"><b>${esc(l.titulo)}</b><small>${esc(l.objetivo)}</small></span><span class="seta">›</span></a></li>`).join('')}</ol>
      <p class="muted nao-imprime" style="text-align:center;font-size:13px;margin:18px 0 0"><a href="#/apostila/${ig}/todos">Ver a apostila completa para imprimir</a></p></div>`;
  }
  app.onclick = e => { if (e.target.closest('[data-imprimir]')) window.print(); };
}
