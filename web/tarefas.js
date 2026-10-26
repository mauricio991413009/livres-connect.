/* Livres Connect · Automações
   "Suas tarefas de hoje" no Painel e a configuração das regras. */
import { linkWhats, abrirFicha, hoje } from './pessoas.js';

let C;
export function instalar(ctx) { C = ctx; }

const ROTULO = {
  visitante_sem_contato: ['Visitante', 'p-bad'],
  acompanhar_novo: ['Acompanhar', 'p-warn'],
  novo_sem_discipulado: ['Sem discipulador', 'p-warn'],
  estudos_parado: ['Estudos parados', 'p-neu'],
  discipulado_parado: ['Discipulado parado', 'p-warn'],
  membro_sumido: ['Sem contato', 'p-neu'],
  aniversario: ['Aniversário', 'p-ouro'],
  escala_pendente: ['Escala', 'p-bad'],
  atendimento_pendente: ['Quer conversar', 'p-bad'],
  faltas_escola: ['Escola', 'p-warn']
};
// regras resolvidas por um contato registrado (o WhatsApp já registra)
const POR_CONTATO = ['visitante_sem_contato', 'acompanhar_novo', 'membro_sumido'];

const primeiro = n => (n || '').trim().split(/\s+/)[0] || '';
const dm = d => d ? String(d).slice(8, 10) + '/' + String(d).slice(5, 7) : '';
const base = () => location.origin + location.pathname;

function mensagem(t) {
  const ig = C.igrejaAtual().nome, eu = primeiro(C.S.nome), n = primeiro(t.nome), x = t.extra || {};
  switch (t.regra) {
    case 'visitante_sem_contato': return `Olá, ${n}! Aqui é ${eu}, da ${ig}. Foi uma alegria ter você com a gente! Como você está? Se precisar de oração ou quiser conversar, conte comigo. Deus abençoe!`;
    case 'acompanhar_novo': return `Oi, ${n}! Aqui é ${eu}, da ${ig}. Passando para saber como você está e como está sua caminhada com Jesus. Estou orando por você! Precisa de alguma coisa?`;
    case 'novo_sem_discipulado': return `Oi, ${n}! Aqui é ${eu}, da ${ig}. Queremos caminhar junto com você nesse começo com Jesus: são 8 encontros simples de discipulado, no dia e horário que for melhor para você. Vamos marcar o primeiro?`;
    case 'estudos_parado': return `Oi, ${n}! Vi que você começou os estudos para novos convertidos. Que tal continuar de onde parou? É só abrir: ${base()}#/estudos/${C.S.igrejaId}`;
    case 'discipulado_parado': return `Oi, ${primeiro(x.discipulador)}! Como está o discipulado com ${t.nome}? Faz um tempo que não registramos encontro. Precisa de ajuda para continuar?`;
    case 'membro_sumido': return `Oi, ${n}! Aqui é ${eu}, da ${ig}. Que saudade de você! Como você e sua família estão? Estamos orando por vocês.`;
    case 'aniversario': return `Feliz aniversário, ${n}! 🎉 Que Deus abençoe sua vida com saúde, paz e muitas alegrias neste novo ano. Com carinho, ${ig}.`;
    case 'escala_pendente': return `Oi, ${n}! Você está na escala do ${x.ministerio} no ${x.evento}, dia ${dm(x.data)}${x.hora ? ' às ' + String(x.hora).slice(0, 5) : ''}. Pode confirmar por aqui? ${base()}#/escala/${x.token}`;
    case 'atendimento_pendente': return `Olá, ${n}! Aqui é ${eu}, da ${ig}. Recebemos seu pedido para conversar com um pastor. Qual o melhor dia e horário para você?`;
    case 'faltas_escola': return `Oi, ${n}! Sentimos sua falta nas últimas aulas da Escola. Está tudo bem? Se precisar de ajuda para acompanhar o conteúdo, me fala.`;
  }
  return '';
}

/* ------------------------------------------------------------------ */
/* Painel: Suas tarefas de hoje                                        */
/* ------------------------------------------------------------------ */
export async function painelTarefas(el) {
  const { esc, sb } = C;
  const { data, error } = await sb.rpc('minhas_tarefas', { p_igreja: C.S.igrejaId });
  if (error) { el.innerHTML = `<h2>Suas tarefas de hoje</h2><div class="vazio">${esc(C.traduzErro(error))}</div>`; return; }
  const ts = data || [];
  const limite = el.dataset.todas ? ts.length : 8;
  el.innerHTML = `<div class="tar-cab"><h2>Suas tarefas de hoje</h2>${ts.length ? `<span class="pill p-acc">${ts.length}</span>` : ''}
      ${C.pode(['pastor']) ? '<a class="btn sm" href="#/igreja" style="margin-left:auto">Ajustar automações</a>' : ''}</div>
    ${ts.length ? `<div class="lista">${ts.slice(0, limite).map((t, i) => {
      const tel = t.regra === 'discipulado_parado' ? (t.extra || {}).discipulador_tel : t.telefone;
      const wa = linkWhats(tel, mensagem(t));
      const [rot, cls] = ROTULO[t.regra] || [t.regra, 'p-neu'];
      return `<div class="linha tarefa" data-i="${i}">
        <div class="cresce"><div class="tar-tit"><span class="pill ${cls}">${rot}</span> ${t.pessoa_id ? `<button class="lk" data-ficha="${t.pessoa_id}">${esc(t.nome)}</button>` : `<b style="font-weight:600">${esc(t.nome)}</b>`}</div>
          <div class="muted" style="font-size:13px">${esc(t.detalhe)}</div></div>
        <div class="tar-acoes">
          ${wa ? `<a class="btn sm pri" href="${esc(wa)}" target="_blank" rel="noopener" data-wa="${i}">WhatsApp</a>` : (t.regra === 'atendimento_pendente' ? '' : '<span class="muted" style="font-size:12px">sem WhatsApp</span>')}
          ${t.regra === 'atendimento_pendente' ? '<a class="btn sm" href="#/cuidado">Responder</a>' : ''}
          <button class="btn sm" data-feito="${i}">Feito</button>
          <button class="btn sm" data-adiar="${i}" title="Esconder por 3 dias">Adiar</button>
        </div></div>`;
    }).join('')}</div>
    ${ts.length > limite ? `<button class="btn sm" data-mais style="margin-top:8px">Ver todas (${ts.length})</button>` : ''}`
    : '<div class="vazio">Tudo em dia! Nenhuma pessoa esperando por você hoje. 🙌</div>'}`;

  const sumir = (i, txt) => { const l = el.querySelector(`.tarefa[data-i="${i}"]`); if (l) l.remove(); if (txt) C.toast(txt); if (!el.querySelector('.tarefa')) painelTarefas(el); };
  const contato = async (t, canal, resumo) => {
    if (!t.pessoa_id) return;
    await sb.from('contatos').insert({ igreja_id: C.S.igrejaId, pessoa_id: t.pessoa_id, canal, data: hoje(), resumo });
  };
  const adiar = (t, dias) => sb.rpc('adiar_tarefa', { p_igreja: C.S.igrejaId, p_chave: t.chave, p_dias: dias });

  el.onclick = async e => {
    if (e.target.closest('[data-mais]')) { el.dataset.todas = '1'; return painelTarefas(el); }
    const fi = e.target.closest('[data-ficha]'); if (fi) return abrirFicha(fi.dataset.ficha, () => painelTarefas(el));
    const w = e.target.closest('[data-wa]');
    if (w) {  // deixa o link abrir o WhatsApp e registra o contato
      const t = ts[+w.dataset.wa];
      if (POR_CONTATO.includes(t.regra) || t.regra === 'aniversario' || t.regra === 'faltas_escola' || t.regra === 'estudos_parado' || t.regra === 'novo_sem_discipulado')
        await contato(t, 'whatsapp', 'Mensagem enviada pelas tarefas do dia (' + (ROTULO[t.regra] || [''])[0].toLowerCase() + ').');
      if (!POR_CONTATO.includes(t.regra)) await adiar(t, t.regra === 'aniversario' ? 365 : t.regra === 'escala_pendente' ? 2 : 7);
      return setTimeout(() => sumir(w.dataset.wa, 'Contato registrado.'), 300);
    }
    const f = e.target.closest('[data-feito]');
    if (f) {
      const t = ts[+f.dataset.feito];
      if (POR_CONTATO.includes(t.regra)) await contato(t, 'outro', 'Contato feito (marcado nas tarefas do dia).');
      else {
        const { error: er } = await adiar(t, t.regra === 'aniversario' ? 365 : t.regra === 'escala_pendente' ? 3 : 14);
        if (er) return C.toast(C.traduzErro(er));
      }
      return sumir(f.dataset.feito, 'Feito. Deus abençoe!');
    }
    const a = e.target.closest('[data-adiar]');
    if (a) {
      const { error: er } = await adiar(ts[+a.dataset.adiar], 3);
      if (er) return C.toast(C.traduzErro(er));
      sumir(a.dataset.adiar, 'Tarefa adiada por 3 dias.');
    }
  };
}

/* ------------------------------------------------------------------ */
/* Configurações da igreja: ligar e ajustar as automações             */
/* ------------------------------------------------------------------ */
export async function secaoAutomacoes(el) {
  const { esc, sb } = C;
  const { data, error } = await sb.rpc('automacoes_da_igreja', { p_igreja: C.S.igrejaId });
  if (error) { el.innerHTML = `<div class="vazio">${esc(C.traduzErro(error))}</div>`; return; }
  el.innerHTML = `<p class="muted" style="margin-top:0">Todo dia, cada pessoa da equipe recebe no Painel a lista de quem precisa de cuidado, só com as pessoas que ela acompanha. Ligue, desligue e ajuste os prazos.</p>
    <div class="lista autos">${(data || []).map(r => `<div class="linha" data-regra="${r.regra}">
      <label class="chk cresce"><input type="checkbox" ${r.ativo ? 'checked' : ''} data-ativo><span><b style="font-weight:600">${esc(r.titulo)}</b><span class="muted" style="display:block;font-size:13px">${esc(r.descricao)}</span></span></label>
      <span class="auto-dias"><input type="number" min="0" max="365" value="${r.dias}" data-dias aria-label="Prazo de ${esc(r.titulo)}"> <span class="muted" style="font-size:13px">${esc(r.unidade)}</span></span>
    </div>`).join('')}</div>`;
  const salvar = async linha => {
    const dias = Math.max(0, Math.min(365, parseInt(linha.querySelector('[data-dias]').value, 10) || 0));
    const { error: er } = await sb.from('automacoes').upsert({ igreja_id: C.S.igrejaId, regra: linha.dataset.regra, ativo: linha.querySelector('[data-ativo]').checked, dias }, { onConflict: 'igreja_id,regra' });
    er ? C.toast(C.traduzErro(er)) : C.toast('Automação salva.');
  };
  el.onchange = e => { const l = e.target.closest('[data-regra]'); if (l) salvar(l); };
}
