// Livres Connect · aplicação web
// Base: login, verificação em duas etapas, escolha de igreja, usuários e perfis,
// configurações da igreja, auditoria e administração da plataforma.
// Fase Pessoas (pessoas.js): membros, visitantes com QR Code e Jornada da Alma.
// Fase Gestão (gestao.js): financeiro, agenda e escalas.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.1/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import * as Pessoas from './pessoas.js';
import * as Gestao from './gestao.js';
import * as Estudos from './estudos.js';
import * as Escola from './escola.js';
import * as Discipulado from './discipulado.js';
import * as Cuidado from './cuidado.js';
import * as Comunicacao from './comunicacao.js';
import * as Portal from './portal.js';
import * as Relatorios from './relatorios.js';
import * as Tarefas from './tarefas.js';
import { ligarInstalar } from './instalar.js';

/* ------------------------------------------------------------------ */
/* utilidades                                                          */
/* ------------------------------------------------------------------ */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const app = () => $('#app');
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 3800); }
const dataHora = s => new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const dinheiro = c => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PERFIS = {
  pastor: 'Pastor presidente', pastora: 'Pastora', presbiterio: 'Presbitério', tesouraria: 'Tesouraria',
  secretaria: 'Secretaria', lider: 'Líder de ministério', obreiro: 'Obreiro', missionario: 'Missionário',
  evangelista: 'Evangelista', diacono: 'Diácono', membro: 'Membro'
};
// Perfis novos herdam as permissões equivalentes (o banco aplica a mesma regra em tem_perfil)
const EQUIVALE = {
  obreiro: ['lider'], missionario: ['lider'], evangelista: ['lider'],
  pastora: ['presbiterio', 'secretaria', 'lider']
};
// Perfis que acompanham pessoas e podem liderar um ministério
const LIDERANCA = ['lider', 'obreiro', 'missionario', 'evangelista', 'pastora'];
const DESCRICAO_PERFIL = {
  pastor: 'Acesso total: pessoas, financeiro, usuários e configurações.',
  pastora: 'Acompanha toda a igreja e as anotações pastorais de quem acompanha; vê relatórios financeiros. Não lança no financeiro nem convida usuários.',
  presbiterio: 'Vê pessoas, agenda, escalas e relatórios financeiros.',
  tesouraria: 'Lança e confere o financeiro. Não vê dados das pessoas.',
  secretaria: 'Cadastra e edita pessoas, agenda e fotos. Não vê o financeiro.',
  lider: 'Acompanha as pessoas sob sua responsabilidade e monta a escala do seu ministério.',
  obreiro: 'Acompanha as pessoas sob sua responsabilidade e monta a escala do ministério que lidera.',
  missionario: 'Acompanha as pessoas sob sua responsabilidade e monta a escala do ministério que lidera.',
  evangelista: 'Acompanha visitantes e novos convertidos sob sua responsabilidade.',
  diacono: 'Vê a agenda e as escalas.'
};
const ETAPAS = ['Visitante', 'Novo convertido', 'Discipulado', 'Batismo', 'Membro', 'Formação', 'Serviço ministerial'];
const TABELAS = {
  igrejas: 'Igreja', ministerios: 'Ministério', vinculos: 'Acesso de usuário', convites: 'Convite',
  pessoas: 'Pessoa', jornada_etapas: 'Jornada da Alma', jornada_atividades_modelo: 'Atividade da Jornada',
  jornada_atividades: 'Atividade concluída', contatos: 'Contato', anotacoes_pastorais: 'Anotação pastoral',
  eventos: 'Evento', presencas: 'Presença', escalas: 'Escala', categorias_financeiras: 'Categoria financeira',
  campanhas: 'Campanha', lancamentos: 'Lançamento financeiro',
  escola_turmas: 'Turma da Escola', escola_aulas: 'Aula da Escola', escola_alunos: 'Matrícula na Escola', escola_avaliacoes: 'Avaliação da Escola',
  discipulados: 'Discipulado', discipulado_encontros: 'Encontro de discipulado',
  pedidos_oracao: 'Pedido de oração', atendimentos: 'Atendimento pastoral', comunicados: 'Comunicado'
};
const ACOES = { insert: 'criou', update: 'alterou', delete: 'excluiu' };

const ICONS = {
  painel: '<path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"/>',
  membros: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.8.7 3 2.4 3.5 5.2"/>',
  visitantes: '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c.8-3.6 3.4-5.5 6.5-5.5 1.6 0 3 .5 4.1 1.4M18 13v6M15 16h6"/>',
  jornada: '<path d="M4 19c4 0 4-6 8-6s4-6 8-6"/><circle cx="4" cy="19" r="1.6"/><circle cx="12" cy="13" r="1.6"/><circle cx="20" cy="7" r="1.6"/>',
  financeiro: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6.5 9.5v5M17.5 9.5v5"/>',
  agenda: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  escalas: '<path d="M4 6h16M4 12h16M4 18h9"/><path d="M16 17l2 2 3.5-4"/>',
  usuarios: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
  igreja: '<path d="M12 3v5M9.5 5.5h5M5 21V12l7-4 7 4v9M10 21v-4h4v4"/>',
  auditoria: '<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M10 12h6M10 16h6"/>',
  seguranca: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  escola: '<path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.5c1.5 1.6 3.4 2.4 5.5 2.4s4-.8 5.5-2.4V11M21.5 9v5"/>',
  discipulado: '<circle cx="8" cy="7.5" r="3"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M2.5 19c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5M13.5 15.2c.9-.8 1.9-1.2 3-1.2 2.2 0 3.9 1.4 4.5 4"/>',
  cuidado: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  comunicacao: '<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>',
  relatorios: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
  estudos: '<path d="M4 5.5C6.5 4 9.5 4 12 5.5v14c-2.5-1.5-5.5-1.5-8 0z"/><path d="M20 5.5C17.5 4 14.5 4 12 5.5v14c2.5-1.5 5.5-1.5 8 0z"/>',
  plataforma: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"/>'
};
const icon = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const marca = `<div class="mark"><svg viewBox="0 0 24 24"><path d="M12 4v16M6 10h12"/></svg></div>`;

// Módulos: perfis = quem vê (null = todos); fase = quando fica pronto
const MODULOS = [
  { k: 'painel', l: 'Painel', perfis: null },
  { k: 'membros', l: 'Membros', perfis: ['pastor', 'presbiterio', 'secretaria', 'lider'] },
  { k: 'visitantes', l: 'Visitantes', perfis: ['pastor', 'presbiterio', 'secretaria', 'lider'] },
  { k: 'jornada', l: 'Jornada da Alma', perfis: ['pastor', 'presbiterio', 'secretaria', 'lider'] },
  { k: 'estudos', l: 'Estudos', perfis: null },
  { k: 'discipulado', l: 'Discipulado', perfis: ['pastor', 'presbiterio', 'secretaria', 'lider'] },
  { k: 'cuidado', l: 'Oração e atendimento', perfis: ['pastor', 'presbiterio', 'secretaria', 'lider', 'diacono'] },
  { k: 'comunicacao', l: 'Comunicação', perfis: ['pastor', 'presbiterio', 'secretaria', 'lider'] },
  { k: 'relatorios', l: 'Relatórios', perfis: ['pastor', 'presbiterio', 'secretaria', 'tesouraria'] },
  { k: 'escola', l: 'Escola de Obreiros', perfis: ['pastor', 'presbiterio', 'secretaria', 'lider'] },
  { k: 'financeiro', l: 'Financeiro', perfis: ['pastor', 'presbiterio', 'tesouraria'] },
  { k: 'agenda', l: 'Agenda e eventos', perfis: null },
  { k: 'escalas', l: 'Escalas', perfis: ['pastor', 'presbiterio', 'secretaria', 'lider', 'diacono'] },
  { sep: true },
  { k: 'usuarios', l: 'Usuários e perfis', perfis: ['pastor'] },
  { k: 'igreja', l: 'Configurações da igreja', perfis: ['pastor'] },
  { k: 'auditoria', l: 'Auditoria', perfis: ['pastor'] },
  { k: 'seguranca', l: 'Minha conta', perfis: null }
];
const FASES = { Pessoas: 'semanas 6 a 9', Gestão: 'semanas 10 a 13' };

/* ------------------------------------------------------------------ */
/* estado                                                              */
/* ------------------------------------------------------------------ */
const configurado = !SUPABASE_URL.startsWith('COLE_AQUI') && !SUPABASE_ANON_KEY.startsWith('COLE_AQUI');
const sb = configurado ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const S = { user: null, nome: '', admin: false, vinculos: [], igrejas: [], igrejaId: null, recuperando: false };

const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } };
const ler = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };

const perfisAtuais = () => S.vinculos.filter(v => v.igreja_id === S.igrejaId).map(v => v.perfil);
const pode = perfis => !perfis || perfisAtuais().some(p => perfis.includes(p) || (EQUIVALE[p] || []).some(x => perfis.includes(x)));
const lideraMin = min => !!min && S.vinculos.some(v => v.igreja_id === S.igrejaId && LIDERANCA.includes(v.perfil) && v.ministerio_id === min);
const igrejaAtual = () => S.igrejas.find(i => i.id === S.igrejaId);
const rota = () => {
  const h = location.hash;
  if (!h || h.includes('access_token') || h.includes('error')) return 'painel';
  return h.replace(/^#\/?/, '').split(/[?/]/)[0] || 'painel';
};
const estudosPublico = () => { const m = location.hash.match(/^#\/estudos\/([0-9a-f-]{36})(?:\/(\d+|todos))?/i); return m ? [m[1], m[2] || null] : null; };
const escalaPublica = () => { const m = location.hash.match(/^#\/escala\/([0-9a-f-]{36})/i); return m ? m[1] : null; };
const roteiroPublico = () => { const m = location.hash.match(/^#\/discipulado\/([0-9a-f-]{36})(?:\/(\d+|todos))?/i); return m ? [m[1], m[2] || null] : null; };
const portalMembro = () => { const m = location.hash.match(/^#\/membro\/([0-9a-f]{64})/i); return m ? m[1].toLowerCase() : null; };
const oracaoPublica = () => { const m = location.hash.match(/^#\/oracao\/([0-9a-f-]{36})/i); return m ? m[1] : null; };
const apostilaPublica = () => { const m = location.hash.match(/^#\/apostila\/([0-9a-f-]{36})(?:\/(\d+|todos))?/i); return m ? [m[1], m[2] || null] : null; };
const certificadoPublico = () => { const m = location.hash.match(/^#\/certificado\/([0-9a-f-]{36})/i); return m ? m[1] : null; };
const fichaPublica = () => { const m = location.hash.match(/^#\/ficha\/([0-9a-f-]{36})/i); return m ? m[1] : null; };
const ir = r => { if (location.hash !== '#/' + r) location.hash = '#/' + r; else render(); };

function traduzErro(e) {
  const m = (e && (e.message || e.error_description || e)) + '';
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/Email not confirmed/i.test(m)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (/User already registered/i.test(m)) return 'Já existe uma conta com este e-mail. Use "Entrar" ou "Esqueci a senha".';
  if (/Password should be at least/i.test(m)) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (/rate limit|too many/i.test(m)) return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.';
  if (/Invalid TOTP|invalid code/i.test(m)) return 'Código inválido. Confira o código de 6 dígitos no aplicativo autenticador.';
  if (/duplicate key|already exists/i.test(m)) return 'Este registro já existe.';
  if (/row-level security|permission denied/i.test(m)) return 'Seu perfil não tem permissão para esta ação.';
  return m;
}

/* ------------------------------------------------------------------ */
/* início                                                              */
/* ------------------------------------------------------------------ */
async function iniciar() {
  if (!configurado) return telaNaoConfigurado();
  if (fichaPublica()) return Pessoas.telaFichaPublica(fichaPublica());
  if (escalaPublica()) return Gestao.telaEscalaPublica(escalaPublica());
  if (estudosPublico()) return Estudos.telaEstudosPublico(...estudosPublico());
  if (certificadoPublico()) return Escola.telaCertificado(certificadoPublico());
  if (apostilaPublica()) return Escola.telaApostila(...apostilaPublica());
  if (roteiroPublico()) return Discipulado.telaRoteiroPublico(...roteiroPublico());
  if (oracaoPublica()) return Cuidado.telaOracaoPublica(oracaoPublica());
  if (portalMembro()) return Portal.telaPortal(portalMembro());
  sb.auth.onAuthStateChange((evento, sessao) => {
    if (evento === 'PASSWORD_RECOVERY') { S.recuperando = true; telaNovaSenha(); return; }
    if (evento === 'SIGNED_OUT') { Object.assign(S, { user: null, vinculos: [], igrejas: [], admin: false }); telaEntrar(); }
  });
  const { data } = await sb.auth.getSession();
  if (S.recuperando) return;
  if (!data.session) {
    // Celular de membro que já abriu o portal: o aplicativo instalado abre direto nele
    const t = Portal.tokenGuardado();
    if (t && (!location.hash || location.hash === '#' || location.hash === '#/')) { location.hash = '#/membro/' + t; return; }
    return telaEntrar();
  }
  if (location.hash.includes('access_token')) history.replaceState(null, '', location.pathname + '#/painel');
  await aposEntrar();
}

async function aposEntrar() {
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') return telaCodigo2FA();
  await carregarContexto();
  if (!S.vinculos.length && !S.admin) return telaSemAcesso();
  render();
}

async function carregarContexto() {
  const { data: u } = await sb.auth.getUser();
  S.user = u.user;
  const [perfil, adm, vin] = await Promise.all([
    sb.from('usuarios').select('nome,email').eq('id', S.user.id).maybeSingle(),
    sb.from('admins_plataforma').select('user_id').eq('user_id', S.user.id).maybeSingle(),
    sb.from('vinculos').select('igreja_id,perfil,ministerio_id,igrejas(id,nome,cidade,uf,status)').eq('user_id', S.user.id).eq('ativo', true)
  ]);
  S.nome = (perfil.data && perfil.data.nome) || (S.user.user_metadata && S.user.user_metadata.nome) || S.user.email;
  S.admin = !!adm.data;
  S.vinculos = (vin.data || []).filter(v => v.igrejas);
  const mapa = new Map();
  S.vinculos.forEach(v => mapa.set(v.igreja_id, v.igrejas));
  S.igrejas = [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome));
  const salva = ler('lc-igreja');
  S.igrejaId = S.igrejas.some(i => i.id === salva) ? salva : (S.igrejas[0] && S.igrejas[0].id) || null;
}

window.addEventListener('hashchange', () => {
  const md = document.getElementById('modal'); if (md) md.innerHTML = '';  // fecha janela aberta ao trocar de tela
  if (fichaPublica()) return Pessoas.telaFichaPublica(fichaPublica());
  if (escalaPublica()) return Gestao.telaEscalaPublica(escalaPublica());
  if (estudosPublico()) return Estudos.telaEstudosPublico(...estudosPublico());
  if (certificadoPublico()) return Escola.telaCertificado(certificadoPublico());
  if (apostilaPublica()) return Escola.telaApostila(...apostilaPublica());
  if (roteiroPublico()) return Discipulado.telaRoteiroPublico(...roteiroPublico());
  if (oracaoPublica()) return Cuidado.telaOracaoPublica(oracaoPublica());
  if (portalMembro()) return Portal.telaPortal(portalMembro());
  if (S.user && !S.recuperando) render();
});

/* ------------------------------------------------------------------ */
/* telas de acesso                                                     */
/* ------------------------------------------------------------------ */
function telaAuth(titulo, sub, corpo) {
  app().innerHTML = `<div class="auth"><div class="auth-card">
    <div class="brand">${marca}<div><b>Livres Connect</b><small>Gestão eclesiástica</small></div></div>
    <div><h1>${titulo}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${corpo}</div></div>`;
  const f = $('form', app()); if (f) { const i = $('input', f); if (i) i.focus(); }
}
const msgErro = (el, e) => { el.innerHTML = `<div class="erro">${esc(traduzErro(e))}</div>`; };
async function ocupado(btn, fn) { btn.disabled = true; try { await fn(); } finally { btn.disabled = false; } }

function telaNaoConfigurado() {
  telaAuth('Configuração pendente', 'Falta ligar o site ao banco de dados.',
    `<div class="aviso ouro">Abra o arquivo <b>web/config.js</b> no GitHub e cole a <b>Project URL</b> e a <b>Publishable key</b> do Supabase, como explica o passo 3 do README.</div>`);
}

function telaEntrar(aviso = '') {
  telaAuth('Entrar', 'Use o e-mail cadastrado pela sua igreja.', `
    ${aviso ? `<div class="aviso">${aviso}</div>` : ''}
    <form class="f" id="f-entrar" style="grid-template-columns:1fr">
      <div class="fld"><label for="em">E-mail</label><input id="em" type="email" autocomplete="email" required></div>
      <div class="fld"><label for="se">Senha</label><input id="se" type="password" autocomplete="current-password" required></div>
      <div id="msg"></div>
      <button class="btn pri full" type="submit">Entrar</button>
    </form>
    <div class="auth-links"><button data-ir="criar">Criar minha conta</button><button data-ir="recuperar">Esqueci a senha</button></div>
    ${Portal.tokenGuardado() ? `<a class="btn full" href="#/membro/${esc(Portal.tokenGuardado())}">Abrir meu Portal do Membro</a>` : '<p class="muted" style="font-size:13px;margin:0">Membro da igreja? Peça à secretaria o link do seu Portal do Membro.</p>'}`);
  $('#f-entrar').onsubmit = e => {
    e.preventDefault();
    ocupado($('button[type=submit]', e.target), async () => {
      const { error } = await sb.auth.signInWithPassword({ email: $('#em').value.trim(), password: $('#se').value });
      if (error) return msgErro($('#msg'), error);
      await aposEntrar();
    });
  };
}

function telaCriar() {
  telaAuth('Criar minha conta', 'Use o mesmo e-mail em que o pastor enviou o convite.', `
    <form class="f" id="f-criar" style="grid-template-columns:1fr">
      <div class="fld"><label for="no">Nome completo</label><input id="no" autocomplete="name" required minlength="3"></div>
      <div class="fld"><label for="em">E-mail</label><input id="em" type="email" autocomplete="email" required></div>
      <div class="fld"><label for="se">Senha</label><input id="se" type="password" autocomplete="new-password" required minlength="8"><span class="dica">No mínimo 8 caracteres.</span></div>
      <div id="msg"></div>
      <button class="btn pri full" type="submit">Criar conta</button>
    </form>
    <div class="auth-links"><button data-ir="entrar">Já tenho conta</button></div>`);
  $('#f-criar').onsubmit = e => {
    e.preventDefault();
    ocupado($('button[type=submit]', e.target), async () => {
      const { error } = await sb.auth.signUp({
        email: $('#em').value.trim(), password: $('#se').value,
        options: { data: { nome: $('#no').value.trim() }, emailRedirectTo: location.origin + location.pathname }
      });
      if (error) return msgErro($('#msg'), error);
      telaEntrar('Conta criada. Abra o e-mail que enviamos e clique no link de confirmação. Depois, entre aqui.');
    });
  };
}

function telaRecuperar() {
  telaAuth('Esqueci a senha', 'Enviaremos um link para você criar uma senha nova.', `
    <form class="f" id="f-rec" style="grid-template-columns:1fr">
      <div class="fld"><label for="em">E-mail</label><input id="em" type="email" autocomplete="email" required></div>
      <div id="msg"></div>
      <button class="btn pri full" type="submit">Enviar link</button>
    </form>
    <div class="auth-links"><button data-ir="entrar">Voltar para entrar</button></div>`);
  $('#f-rec').onsubmit = e => {
    e.preventDefault();
    ocupado($('button[type=submit]', e.target), async () => {
      const { error } = await sb.auth.resetPasswordForEmail($('#em').value.trim(), { redirectTo: location.origin + location.pathname });
      if (error) return msgErro($('#msg'), error);
      telaEntrar('Se este e-mail estiver cadastrado, o link chega em alguns minutos. Confira também a caixa de spam.');
    });
  };
}

function telaNovaSenha() {
  telaAuth('Criar senha nova', '', `
    <form class="f" id="f-ns" style="grid-template-columns:1fr">
      <div class="fld"><label for="se">Senha nova</label><input id="se" type="password" autocomplete="new-password" required minlength="8"><span class="dica">No mínimo 8 caracteres.</span></div>
      <div id="msg"></div>
      <button class="btn pri full" type="submit">Salvar senha</button>
    </form>`);
  $('#f-ns').onsubmit = e => {
    e.preventDefault();
    ocupado($('button[type=submit]', e.target), async () => {
      const { error } = await sb.auth.updateUser({ password: $('#se').value });
      if (error) return msgErro($('#msg'), error);
      S.recuperando = false;
      history.replaceState(null, '', location.pathname + '#/painel');
      toast('Senha alterada.');
      await aposEntrar();
    });
  };
}

function telaCodigo2FA() {
  telaAuth('Verificação em duas etapas', 'Digite o código de 6 dígitos do seu aplicativo autenticador.', `
    <form class="f" id="f-2fa" style="grid-template-columns:1fr">
      <div class="fld"><label for="co">Código</label><input id="co" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></div>
      <div id="msg"></div>
      <button class="btn pri full" type="submit">Confirmar</button>
    </form>
    <div class="auth-links"><button data-acao="sair">Sair</button></div>`);
  $('#f-2fa').onsubmit = e => {
    e.preventDefault();
    ocupado($('button[type=submit]', e.target), async () => {
      const { data: f } = await sb.auth.mfa.listFactors();
      const fator = f && f.totp && f.totp[0];
      if (!fator) return msgErro($('#msg'), 'Nenhum autenticador encontrado. Fale com o pastor presidente.');
      const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: fator.id, code: $('#co').value.trim() });
      if (error) return msgErro($('#msg'), error);
      await aposEntrar();
    });
  };
}

function telaSemAcesso() {
  telaAuth('Aguardando convite', '', `
    <p>Sua conta <b>${esc(S.user.email)}</b> está ativa, mas ainda não foi ligada a nenhuma igreja.</p>
    <p>Peça ao pastor presidente para enviar um convite para este e-mail em <b>Usuários e perfis</b>. Assim que ele enviar, entre de novo.</p>
    <div class="acts"><button class="btn pri" data-acao="recarregar">Já recebi o convite</button><button class="btn" data-acao="sair">Sair</button></div>`);
}

/* ------------------------------------------------------------------ */
/* estrutura                                                           */
/* ------------------------------------------------------------------ */
function render() {
  const r = rota();
  const mods = MODULOS.filter(m => m.sep || pode(m.perfis));
  const ig = igrejaAtual();
  const nav = mods.map(m => m.sep ? '<div class="nav-sep"></div>' :
    `<a class="nav-item ${r === m.k ? 'on' : ''}" href="#/${m.k}" ${r === m.k ? 'aria-current="page"' : ''}>${icon(m.k)}<span>${m.l}</span>${m.fase ? '<span class="tag">em breve</span>' : ''}<span class="badge" data-badge="${m.k}" hidden></span></a>`).join('')
    + (S.admin ? `<div class="nav-sep"></div><a class="nav-item ${r === 'plataforma' ? 'on' : ''}" href="#/plataforma">${icon('plataforma')}<span>Plataforma</span></a>` : '');

  app().innerHTML = `
    <header class="top">
      <div class="brand">${marca}<div><b>Livres Connect</b><small>${ig ? esc(ig.nome) : 'Administração'}</small></div></div>
      ${S.igrejas.length > 1 ? `<div class="ctl"><label for="sel-igreja">Igreja</label><select id="sel-igreja">${S.igrejas.map(i => `<option value="${i.id}" ${i.id === S.igrejaId ? 'selected' : ''}>${esc(i.nome)}</option>`).join('')}</select></div>` : ''}
      <div class="ctl"><label>Conectado como</label><div style="display:flex;gap:8px;align-items:center"><b style="font-weight:600">${esc(S.nome)}</b><button class="btn sm" data-acao="sair">Sair</button></div></div>
    </header>
    <div class="app"><nav aria-label="Módulos">${nav}</nav><main id="main"><div class="wrap"><div class="carregando">Carregando…</div></div></main></div>`;

  atualizarAvisos();
  const sel = $('#sel-igreja');
  if (sel) sel.onchange = () => { S.igrejaId = sel.value; guardar('lc-igreja', sel.value); render(); toast('Agora você está em ' + igrejaAtual().nome + '.'); };

  const mod = MODULOS.find(m => m.k === r);
  const main = $('#main .wrap');
  if (r === 'plataforma' && S.admin) return telaPlataforma(main);
  if (r === 'seguranca') return telaSeguranca(main);
  if (!S.igrejaId) return S.admin ? ir('plataforma') : telaSemAcesso();
  if (!mod || !pode(mod.perfis)) return telaPainel(main);
  if (mod.fase) return telaEmBreve(main, mod);
  ({
    painel: telaPainel, usuarios: telaUsuarios, igreja: telaIgreja, auditoria: telaAuditoria, seguranca: telaSeguranca,
    membros: Pessoas.telaMembros, visitantes: Pessoas.telaVisitantes, jornada: Pessoas.telaJornada,
    estudos: Estudos.telaEstudos, escola: Escola.telaEscola, discipulado: Discipulado.telaDiscipulado, cuidado: Cuidado.telaCuidado, comunicacao: Comunicacao.telaComunicacao, relatorios: Relatorios.telaRelatorios,
    financeiro: Gestao.telaFinanceiro, agenda: Gestao.telaAgenda, escalas: Gestao.telaEscalas
  })[r](main);
}

/* ------------------------------------------------------------------ */
/* avisos da equipe: contadores no menu e faixa no Painel              */
/* (a segurança é a do banco: cada pessoa só conta o que já pode ver)  */
/* ------------------------------------------------------------------ */
async function contarAvisos() {
  if (!sb || !S.igrejaId) return null;
  const id = S.igrejaId, A = { oracao: 0, atend: 0, cadastros: 0, estudos: 0 };
  const cont = q => q.then(r => (r && !r.error && r.count) || 0, () => 0);
  const tarefas = [];
  if (pode(['pastor', 'presbiterio', 'secretaria', 'lider', 'diacono'])) {
    tarefas.push(cont(sb.from('pedidos_oracao').select('id', { count: 'exact', head: true }).eq('igreja_id', id).eq('status', 'aberto').eq('oracoes', 0)).then(n => A.oracao = n));
    tarefas.push(cont(sb.from('atendimentos').select('id', { count: 'exact', head: true }).eq('igreja_id', id).eq('status', 'pendente')).then(n => A.atend = n));
  }
  if (pode(['pastor', 'presbiterio', 'secretaria'])) {
    tarefas.push(cont(sb.from('pessoas').select('id', { count: 'exact', head: true }).eq('igreja_id', id).eq('situacao', 'ativo').is('responsavel_id', null).in('origem', ['qr', 'estudos'])).then(n => A.cadastros = n));
  }
  if (pode(['pastor', 'presbiterio', 'secretaria', 'lider'])) {
    const desde = new Date(Date.now() - 7 * 864e5).toISOString();
    tarefas.push(cont(sb.from('estudos_alunos').select('id', { count: 'exact', head: true }).eq('igreja_id', id).gte('criado_em', desde)).then(n => A.estudos = n));
  }
  await Promise.all(tarefas);
  return A;
}
async function atualizarAvisos() {
  const A = await contarAvisos(); if (!A) return;
  S.avisos = A;
  const marca = (k, n) => document.querySelectorAll(`[data-badge="${k}"]`).forEach(b => { b.textContent = n > 99 ? '99+' : n; b.hidden = !n; b.setAttribute('aria-label', n + ' pendente' + (n === 1 ? '' : 's')); });
  marca('cuidado', A.oracao + A.atend);
  marca('visitantes', A.cadastros);
  marca('estudos', A.estudos);
  const fx = document.getElementById('avisos-equipe');
  if (fx) {
    const it = [];
    if (A.oracao) it.push(`<a href="#/cuidado"><b>${A.oracao}</b> pedido${A.oracao === 1 ? '' : 's'} de oração ainda sem oração</a>`);
    if (A.atend) it.push(`<a href="#/cuidado"><b>${A.atend}</b> pessoa${A.atend === 1 ? '' : 's'} querendo conversar com um pastor</a>`);
    if (A.cadastros) it.push(`<a href="#/visitantes"><b>${A.cadastros}</b> cadastro${A.cadastros === 1 ? '' : 's'} novo${A.cadastros === 1 ? '' : 's'} sem responsável</a>`);
    if (A.estudos) it.push(`<a href="#/estudos"><b>${A.estudos}</b> aluno${A.estudos === 1 ? '' : 's'} novo${A.estudos === 1 ? '' : 's'} nos Estudos (últimos 7 dias)</a>`);
    fx.innerHTML = it.length ? `<div class="aviso ouro avisos-equipe"><b>Precisa da sua atenção:</b> ${it.join(' · ')}</div>` : '';
  }
}
setInterval(() => { if (S.user && S.igrejaId && !document.hidden) atualizarAvisos(); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.user && S.igrejaId) atualizarAvisos(); });

const cab = (t, p, a = '') => `<div class="ph"><div><h1>${t}</h1>${p ? `<p>${p}</p>` : ''}</div><div class="acts">${a}</div></div>`;

function telaEmBreve(main, m) {
  main.innerHTML = cab(m.l) + `<section class="panel breve">${icon(m.k)}<h2>Em construção</h2>
    <p>Este módulo chega na fase <b>${m.fase}</b> (${FASES[m.fase]} do cronograma). As tabelas e as regras de acesso dele já estão prontas no banco de dados.</p></section>`;
}

/* ------------------------------------------------------------------ */
/* painel                                                              */
/* ------------------------------------------------------------------ */
async function telaPainel(main) {
  const ig = igrejaAtual(), perf = perfisAtuais();
  const hoje = new Date(), mesIni = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
  const vePessoas = pode(['pastor', 'presbiterio', 'secretaria', 'lider']);
  const veFin = pode(['pastor', 'presbiterio', 'tesouraria']);
  main.innerHTML = cab('Olá, ' + esc(S.nome.split(' ')[0]), `${esc(ig.nome)}${ig.cidade ? ' · ' + esc(ig.cidade) + (ig.uf ? '/' + esc(ig.uf) : '') : ''} · ${perf.map(p => PERFIS[p]).join(', ')}`) + '<div id="avisos"></div><div id="avisos-equipe"></div><div id="instalar"></div><div class="kpis" id="kpis"><div class="carregando">Carregando números…</div></div>' +
    '<section class="panel" id="tarefas-dia"><div class="carregando">Carregando suas tarefas…</div></section>' +
    `<section class="panel"><h2>Situação do projeto</h2><div class="lista">
      <div class="linha"><span class="pill p-ok">pronto</span><span class="cresce">Login, verificação em duas etapas, várias igrejas, perfis de acesso, convites e auditoria</span></div>
      <div class="linha"><span class="pill p-ok">pronto</span><span class="cresce">Membros, visitantes com QR Code e Jornada da Alma</span></div>
      <div class="linha"><span class="pill p-ok">pronto</span><span class="cresce">Financeiro, agenda e escalas com confirmação pelo WhatsApp</span></div>
      <div class="linha"><span class="pill p-ok">pronto</span><span class="cresce">Estudos para novo convertido, discipulado com 8 lições e Escola de Obreiros com chamada, notas e certificado</span></div>
      <div class="linha"><span class="pill p-ok">pronto</span><span class="cresce">Pedidos de oração e atendimento pastoral com QR Code</span></div>
      <div class="linha"><span class="pill p-ok">pronto</span><span class="cresce">Comunicação pelo WhatsApp com lista de envio e aniversariantes</span></div>
      <div class="linha"><span class="pill p-ok">pronto</span><span class="cresce">Portal do Membro no celular, com link pessoal sem senha</span></div>
      <div class="linha"><span class="pill p-ok">pronto</span><span class="cresce">Relatórios do mês, prestação de contas, engajamento e relatório anual</span></div>
      <div class="linha"><span class="pill p-ok">pronto</span><span class="cresce">Automações: tarefas do dia para cada pessoa da equipe</span></div>
      <div class="linha"><span class="pill p-neu">depois</span><span class="cresce">Recursos de inteligência artificial (o sistema já está preparado)</span></div></div></section>`;

  ligarInstalar(document.getElementById('instalar'));
  if (pode(['pastor', 'tesouraria'])) {
    const { data: f } = await sb.auth.mfa.listFactors();
    if (!(f && f.totp && f.totp.length)) $('#avisos').innerHTML = `<div class="aviso ouro">Seu perfil acessa dados sensíveis. Ative a <a href="#/seguranca">verificação em duas etapas</a> para proteger sua conta.</div>`;
  }

  const kp = [];
  if (vePessoas) {
    const { data: ps } = await sb.from('pessoas').select('etapa,situacao,primeira_visita').eq('igreja_id', S.igrejaId);
    const l = ps || [];
    kp.push(['Membros ativos', l.filter(p => p.etapa >= 4 && p.situacao === 'ativo').length, 'etapa Membro em diante']);
    kp.push(['Visitantes no mês', l.filter(p => p.primeira_visita >= mesIni).length, 'primeiras visitas']);
    kp.push(['Na Jornada', l.filter(p => p.etapa >= 1 && p.etapa <= 3).length, ETAPAS.slice(1, 4).join(', ').toLowerCase()]);
  }
  const { count: ev } = await sb.from('eventos').select('id', { count: 'exact', head: true }).eq('igreja_id', S.igrejaId).gte('data', hoje.toISOString().slice(0, 10));
  kp.push(['Próximos eventos', ev || 0, 'na agenda']);
  if (veFin) {
    const { data: ls } = await sb.from('lancamentos').select('tipo,valor_centavos').eq('igreja_id', S.igrejaId).gte('data', mesIni);
    const ent = (ls || []).filter(x => x.tipo === 'entrada').reduce((a, b) => a + b.valor_centavos, 0);
    const sai = (ls || []).filter(x => x.tipo === 'saida').reduce((a, b) => a + b.valor_centavos, 0);
    kp.push(['Saldo do mês', dinheiro(ent - sai), `entradas ${dinheiro(ent)}`]);
  }
  if (pode(['pastor', 'pastora'])) {
    const [{ count: po }, { count: at }] = await Promise.all([
      sb.from('pedidos_oracao').select('id', { count: 'exact', head: true }).eq('igreja_id', S.igrejaId).eq('status', 'aberto'),
      sb.from('atendimentos').select('id', { count: 'exact', head: true }).eq('igreja_id', S.igrejaId).eq('status', 'pendente')
    ]);
    kp.push(['Pedidos de oração', po || 0, 'em aberto']);
    if (at) kp.push(['Querem conversar', at, 'atendimentos aguardando retorno']);
  }
  Tarefas.painelTarefas($('#tarefas-dia'));
  $('#kpis').innerHTML = kp.map(([l, v, s]) => `<div class="kpi"><span class="l">${l}</span><span class="v">${v}</span><span class="s">${esc(s)}</span></div>`).join('');
}

/* ------------------------------------------------------------------ */
/* usuários e perfis                                                   */
/* ------------------------------------------------------------------ */
async function telaUsuarios(main) {
  const ig = igrejaAtual();
  main.innerHTML = cab('Usuários e perfis', 'Convide pelo e-mail e defina o que cada pessoa pode ver. O acesso é liberado quando ela cria a conta com esse e-mail e o confirma.') +
    `<section class="panel"><h2>Convidar alguém</h2>
      <form class="f" id="f-conv">
        <div class="fld"><label for="ce">E-mail</label><input id="ce" type="email" required placeholder="nome@exemplo.com"></div>
        <div class="fld"><label for="cp">Perfil</label><select id="cp">${['lider', 'obreiro', 'missionario', 'evangelista', 'diacono', 'secretaria', 'tesouraria', 'presbiterio', 'pastora', 'pastor'].map(k => `<option value="${k}">${PERFIS[k]}</option>`).join('')}</select><span class="dica" id="cp-desc"></span></div>
        <div class="fld full" id="cm-box" hidden><label for="cm">Ministério que lidera</label><select id="cm"></select><span class="dica">Opcional para obreiro, missionário, evangelista e pastora. Quem lidera um ministério monta a escala dele.</span></div>
        <div id="msg" class="fld full"></div>
        <div class="fa"><button class="btn pri" type="submit">Enviar convite</button></div>
      </form></section>
     <section class="panel"><h2>Convites pendentes</h2><div id="pend"><div class="carregando">Carregando…</div></div></section>
     <section class="panel"><h2>Equipe com acesso</h2><div id="equipe"><div class="carregando">Carregando…</div></div></section>`;

  const [{ data: mins }, { data: vins }, { data: convs }] = await Promise.all([
    sb.from('ministerios').select('id,nome').eq('igreja_id', S.igrejaId).eq('ativo', true).order('nome'),
    sb.from('vinculos').select('id,user_id,perfil,ministerio_id,ativo').eq('igreja_id', S.igrejaId).order('perfil'),
    sb.from('convites').select('id,email,perfil,ministerio_id,criado_em').eq('igreja_id', S.igrejaId).is('aceito_em', null).order('criado_em', { ascending: false })
  ]);
  const nomeMin = id => ((mins || []).find(m => m.id === id) || {}).nome || '';
  $('#cm').innerHTML = '<option value="">Nenhum</option>' + (mins || []).map(m => `<option value="${m.id}">${esc(m.nome)}</option>`).join('');
  $('#cp').onchange = () => { $('#cm-box').hidden = !LIDERANCA.includes($('#cp').value); $('#cp-desc').textContent = DESCRICAO_PERFIL[$('#cp').value] || ''; };
  $('#cp').onchange();

  const ids = [...new Set((vins || []).map(v => v.user_id))];
  const { data: us } = ids.length ? await sb.from('usuarios').select('id,nome,email').in('id', ids) : { data: [] };
  const usu = id => (us || []).find(u => u.id === id) || { nome: '', email: '' };

  const linkSite = location.origin + location.pathname;
  $('#pend').innerHTML = (convs || []).length ? `<div class="tw"><table><thead><tr><th>E-mail</th><th>Perfil</th><th>Enviado em</th><th></th></tr></thead><tbody>${convs.map(c => `
    <tr><td>${esc(c.email)}</td><td>${PERFIS[c.perfil]}${c.ministerio_id ? ' · ' + esc(nomeMin(c.ministerio_id)) : ''}</td><td class="num">${dataHora(c.criado_em)}</td>
    <td class="acoes"><button class="btn sm" data-copiar="${esc(c.email)}" data-perfil="${c.perfil}">Copiar mensagem</button> <button class="btn sm danger" data-cancelar="${c.id}">Cancelar</button></td></tr>`).join('')}</tbody></table></div>
    <p class="muted" style="margin:10px 0 0;font-size:13px">Envie a mensagem pelo WhatsApp. Ela traz o link do sistema e explica que a conta deve ser criada com este e-mail.</p>` : '<div class="vazio">Nenhum convite aguardando.</div>';

  $('#equipe').innerHTML = `<div class="tw"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Situação</th><th></th></tr></thead><tbody>${(vins || []).sort((a, b) => usu(a.user_id).nome.localeCompare(usu(b.user_id).nome)).map(v => `
    <tr><td><b style="font-weight:600">${esc(usu(v.user_id).nome) || '—'}</b>${v.user_id === S.user.id ? ' <span class="pill p-acc">você</span>' : ''}</td><td>${esc(usu(v.user_id).email)}</td>
    <td>${PERFIS[v.perfil]}${v.ministerio_id ? ' · ' + esc(nomeMin(v.ministerio_id)) : ''}</td>
    <td>${v.ativo ? '<span class="pill p-ok">ativo</span>' : '<span class="pill p-neu">desativado</span>'}</td>
    <td class="acoes"><button class="btn sm" data-ativo="${v.id}" data-valor="${!v.ativo}">${v.ativo ? 'Desativar' : 'Reativar'}</button> <button class="btn sm danger" data-remover="${v.id}">Remover</button></td></tr>`).join('')}</tbody></table></div>`;

  $('#f-conv').onsubmit = e => {
    e.preventDefault();
    ocupado($('button[type=submit]', e.target), async () => {
      const perfil = $('#cp').value;
      const reg = { igreja_id: S.igrejaId, email: $('#ce').value.trim().toLowerCase(), perfil, ministerio_id: LIDERANCA.includes(perfil) ? $('#cm').value || null : null };
      const { error } = await sb.from('convites').insert(reg);
      if (error) return msgErro($('#msg'), /duplicate/i.test(error.message) ? 'Já existe um convite para este e-mail com este perfil.' : error);
      toast('Convite registrado. Se a pessoa já tem conta, o acesso já foi liberado.');
      telaUsuarios(main);
    });
  };
  main.onclick = async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.copiar) {
      const txt = `Olá! Você foi convidado(a) para o Livres Connect da ${ig.nome}, com o perfil ${PERFIS[b.dataset.perfil]}.\n\n1. Acesse ${linkSite}\n2. Toque em "Criar minha conta" e use este e-mail: ${b.dataset.copiar}\n3. Confirme pelo link que chegar no seu e-mail e pronto.`;
      try { await navigator.clipboard.writeText(txt); toast('Mensagem copiada. Cole no WhatsApp.'); }
      catch (err) { prompt('Copie a mensagem:', txt); }
    }
    if (b.dataset.cancelar && confirm('Cancelar este convite?')) {
      const { error } = await sb.from('convites').delete().eq('id', b.dataset.cancelar);
      error ? toast(traduzErro(error)) : (toast('Convite cancelado.'), telaUsuarios(main));
    }
    if (b.dataset.ativo) {
      const { error } = await sb.from('vinculos').update({ ativo: b.dataset.valor === 'true' }).eq('id', b.dataset.ativo);
      error ? toast(traduzErro(error)) : (toast('Acesso atualizado.'), telaUsuarios(main));
    }
    if (b.dataset.remover && confirm('Remover este acesso? A pessoa deixa de ver a igreja com este perfil.')) {
      const { error } = await sb.from('vinculos').delete().eq('id', b.dataset.remover);
      error ? toast(traduzErro(error)) : (toast('Acesso removido.'), telaUsuarios(main));
    }
  };
}

/* ------------------------------------------------------------------ */
/* configurações da igreja                                             */
/* ------------------------------------------------------------------ */
async function telaIgreja(main) {
  const [{ data: ig }, { data: mins }, { data: ativ }] = await Promise.all([
    sb.from('igrejas').select('*').eq('id', S.igrejaId).single(),
    sb.from('ministerios').select('id,nome,ativo').eq('igreja_id', S.igrejaId).order('nome'),
    sb.from('jornada_atividades_modelo').select('etapa,descricao,ordem').eq('igreja_id', S.igrejaId).eq('ativo', true).order('etapa').order('ordem')
  ]);
  main.innerHTML = cab('Configurações da igreja', 'Dados da igreja, ministérios, automações e atividades da Jornada da Alma.') +
    `<div class="grid"><section class="panel c6"><h2>Dados da igreja</h2>
      <form class="f" id="f-ig">
        <div class="fld full"><label for="in">Nome</label><input id="in" required value="${esc(ig.nome)}"></div>
        <div class="fld"><label for="ic">Cidade</label><input id="ic" value="${esc(ig.cidade)}"></div>
        <div class="fld"><label for="iu">UF</label><input id="iu" maxlength="2" value="${esc(ig.uf)}"></div>
        <div class="fld full"><label for="ij">CNPJ</label><input id="ij" value="${esc(ig.cnpj)}" placeholder="opcional"></div>
        <div id="msg" class="fld full"></div>
        <div class="fa"><button class="btn pri" type="submit">Salvar</button></div>
      </form></section>
     <section class="panel c6"><h2>Ministérios</h2>
      <form class="f" id="f-min" style="grid-template-columns:1fr auto;align-items:end">
        <div class="fld"><label for="mn">Novo ministério</label><input id="mn" required placeholder="Ex.: Jovens"></div>
        <button class="btn pri" type="submit">Adicionar</button>
      </form>
      <div class="lista" style="margin-top:10px">${(mins || []).map(m => `<div class="linha"><span class="cresce">${esc(m.nome)}</span>${m.ativo ? '' : '<span class="pill p-neu">inativo</span>'}<button class="btn sm" data-min="${m.id}" data-valor="${!m.ativo}">${m.ativo ? 'Desativar' : 'Reativar'}</button></div>`).join('')}</div></section>
     <section class="panel c12"><h2>Automações</h2><div id="automacoes"><div class="carregando">Carregando…</div></div></section>
     <section class="panel c12"><h2>Atividades da Jornada da Alma</h2>
      <p class="muted">Estas são as atividades padrão de cada etapa. A edição chega junto com o módulo Jornada da Alma.</p>
      <div class="tw"><table><thead><tr><th>Etapa</th><th>Atividades</th></tr></thead><tbody>${ETAPAS.map((n, i) => `<tr><td><b style="font-weight:600">${n}</b></td><td>${(ativ || []).filter(a => a.etapa === i).map(a => esc(a.descricao)).join(' · ')}</td></tr>`).join('')}</tbody></table></div></section></div>`;

  Tarefas.secaoAutomacoes($('#automacoes'));
  $('#f-ig').onsubmit = e => {
    e.preventDefault();
    ocupado($('button[type=submit]', e.target), async () => {
      const { error } = await sb.from('igrejas').update({ nome: $('#in').value.trim(), cidade: $('#ic').value.trim() || null, uf: $('#iu').value.trim().toUpperCase() || null, cnpj: $('#ij').value.trim() || null }).eq('id', S.igrejaId);
      if (error) return msgErro($('#msg'), error);
      await carregarContexto(); toast('Dados salvos.'); render();
    });
  };
  $('#f-min').onsubmit = e => {
    e.preventDefault();
    ocupado($('button[type=submit]', e.target), async () => {
      const { error } = await sb.from('ministerios').insert({ igreja_id: S.igrejaId, nome: $('#mn').value.trim() });
      if (error) return toast(traduzErro(error));
      toast('Ministério adicionado.'); telaIgreja(main);
    });
  };
  main.onclick = async e => {
    const b = e.target.closest('button[data-min]'); if (!b) return;
    const { error } = await sb.from('ministerios').update({ ativo: b.dataset.valor === 'true' }).eq('id', b.dataset.min);
    error ? toast(traduzErro(error)) : telaIgreja(main);
  };
}

/* ------------------------------------------------------------------ */
/* auditoria                                                           */
/* ------------------------------------------------------------------ */
async function telaAuditoria(main) {
  main.innerHTML = cab('Auditoria', 'Toda criação, alteração e exclusão feita no sistema, com autor e horário. Os textos de anotações pastorais nunca aparecem aqui.') +
    `<section class="panel"><div id="aud"><div class="carregando">Carregando…</div></div></section>`;
  const { data: regs, error } = await sb.from('auditoria').select('*').eq('igreja_id', S.igrejaId).order('em', { ascending: false }).limit(150);
  if (error) return msgErro($('#aud'), error);
  const ids = [...new Set((regs || []).map(r => r.user_id).filter(Boolean))];
  const { data: us } = ids.length ? await sb.from('usuarios').select('id,nome,email').in('id', ids) : { data: [] };
  const quem = id => { const u = (us || []).find(x => x.id === id); return u ? (u.nome || u.email) : id ? 'Usuário removido' : 'Sistema'; };
  const resumo = r => {
    const d = r.depois || r.antes || {};
    const nome = d.nome || d.titulo || d.email || d.descricao || '';
    if (r.acao !== 'update' || !r.antes || !r.depois) return esc(nome);
    const mud = Object.keys(r.depois).filter(k => JSON.stringify(r.depois[k]) !== JSON.stringify(r.antes[k]));
    return esc(nome) + (mud.length ? ` <span class="muted">(${esc(mud.join(', '))})</span>` : '');
  };
  $('#aud').innerHTML = (regs || []).length ? `<div class="tw"><table><thead><tr><th>Quando</th><th>Quem</th><th>Ação</th><th>O quê</th><th>Detalhe</th></tr></thead><tbody>${regs.map(r => `
    <tr><td class="num" style="white-space:nowrap">${dataHora(r.em)}</td><td>${esc(quem(r.user_id))}</td><td><span class="pill ${r.acao === 'delete' ? 'p-bad' : r.acao === 'insert' ? 'p-ok' : 'p-neu'}">${ACOES[r.acao] || r.acao}</span></td><td>${TABELAS[r.tabela] || esc(r.tabela)}</td><td>${resumo(r)}</td></tr>`).join('')}</tbody></table></div>
    <p class="muted" style="margin:10px 0 0;font-size:13px">Mostrando os 150 registros mais recentes.</p>` : '<div class="vazio">Nenhum registro ainda.</div>';
}

/* ------------------------------------------------------------------ */
/* minha conta e segurança                                             */
/* ------------------------------------------------------------------ */
async function telaSeguranca(main) {
  const { data: f } = await sb.auth.mfa.listFactors();
  const ativo = f && f.totp && f.totp[0];
  main.innerHTML = cab('Minha conta', esc(S.user.email)) + `<div class="grid">
    <section class="panel c6"><h2>Nome</h2><form class="f" id="f-nome" style="grid-template-columns:1fr">
      <div class="fld"><label for="nn">Nome completo</label><input id="nn" required value="${esc(S.nome)}"></div>
      <div class="fa"><button class="btn pri" type="submit">Salvar</button></div></form></section>
    <section class="panel c6"><h2>Senha</h2><form class="f" id="f-senha" style="grid-template-columns:1fr">
      <div class="fld"><label for="sn">Senha nova</label><input id="sn" type="password" autocomplete="new-password" required minlength="8"></div>
      <div id="msg-s"></div><div class="fa"><button class="btn pri" type="submit">Trocar senha</button></div></form></section>
    <section class="panel c12"><h2>Verificação em duas etapas</h2><div id="mfa">
      ${ativo ? `<div class="linha"><span class="pill p-ok">ativa</span><span class="cresce">Ao entrar, o sistema pede o código do seu aplicativo autenticador.</span><button class="btn sm danger" data-acao="desativar-2fa" data-id="${ativo.id}">Desativar</button></div>`
      : `<p>Protege sua conta mesmo que alguém descubra sua senha. Você vai precisar de um aplicativo autenticador gratuito no celular, como Google Authenticator ou Microsoft Authenticator.</p><button class="btn pri" data-acao="ativar-2fa">Ativar verificação em duas etapas</button>`}
    </div></section>
    <section class="panel c12"><h2>Aplicativo no celular</h2><div id="instalar-conta"></div>
      <p class="muted" style="font-size:13px;margin:10px 0 0">Funciona no Android e no iPhone, sem loja de aplicativos e sem custo. As atualizações chegam sozinhas.</p></section></div>`;
  ligarInstalar(document.getElementById('instalar-conta'), true);

  $('#f-nome').onsubmit = e => {
    e.preventDefault();
    ocupado($('button[type=submit]', e.target), async () => {
      const nome = $('#nn').value.trim();
      const { error } = await sb.from('usuarios').update({ nome }).eq('id', S.user.id);
      if (error) return toast(traduzErro(error));
      await sb.auth.updateUser({ data: { nome } });
      S.nome = nome; toast('Nome salvo.'); render();
    });
  };
  $('#f-senha').onsubmit = e => {
    e.preventDefault();
    ocupado($('button[type=submit]', e.target), async () => {
      const { error } = await sb.auth.updateUser({ password: $('#sn').value });
      if (error) return msgErro($('#msg-s'), error);
      e.target.reset(); toast('Senha alterada.');
    });
  };
  main.onclick = async e => {
    const b = e.target.closest('button[data-acao]'); if (!b) return;
    if (b.dataset.acao === 'ativar-2fa') {
      const { data: todos } = await sb.auth.mfa.listFactors();
      for (const x of ((todos && todos.all) || []).filter(x => x.status === 'unverified')) await sb.auth.mfa.unenroll({ factorId: x.id });
      const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Livres Connect ' + Date.now() });
      if (error) return toast(traduzErro(error));
      $('#mfa').innerHTML = `<div class="grid"><div class="c4"><div class="qr"><img src="${data.totp.qr_code}" alt="QR Code para o aplicativo autenticador"></div></div>
        <div class="c8"><ol style="margin:0 0 12px;padding-left:18px;display:flex;flex-direction:column;gap:6px">
          <li>Abra o aplicativo autenticador no celular e toque em <b>adicionar</b>.</li>
          <li>Aponte a câmera para o QR Code. Se não conseguir, digite esta chave: <code class="seg">${esc(data.totp.secret)}</code></li>
          <li>Digite abaixo o código de 6 dígitos que aparecer.</li></ol>
          <form class="f" id="f-ver" style="grid-template-columns:1fr auto;align-items:end"><div class="fld"><label for="vc">Código</label><input id="vc" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required autocomplete="one-time-code"></div><button class="btn pri" type="submit">Confirmar</button></form>
          <div id="msg-v" style="margin-top:8px"></div></div></div>`;
      $('#f-ver').onsubmit = ev => {
        ev.preventDefault();
        ocupado($('button[type=submit]', ev.target), async () => {
          const { error: er } = await sb.auth.mfa.challengeAndVerify({ factorId: data.id, code: $('#vc').value.trim() });
          if (er) return msgErro($('#msg-v'), er);
          toast('Verificação em duas etapas ativada.'); telaSeguranca(main);
        });
      };
    }
    if (b.dataset.acao === 'desativar-2fa' && confirm('Desativar a verificação em duas etapas? Sua conta fica menos protegida.')) {
      const { error } = await sb.auth.mfa.unenroll({ factorId: b.dataset.id });
      error ? toast(traduzErro(error) + ' Para desativar, entre de novo usando o código.') : (toast('Verificação desativada.'), telaSeguranca(main));
    }
  };
}

/* ------------------------------------------------------------------ */
/* administração da plataforma                                         */
/* ------------------------------------------------------------------ */
async function telaPlataforma(main) {
  main.innerHTML = cab('Plataforma', 'Cadastre igrejas e defina o pastor presidente de cada uma. Você não vê os dados internos das igrejas.') +
    `<section class="panel"><h2>Nova igreja</h2><form class="f" id="f-nova">
      <div class="fld full"><label for="pn">Nome da igreja</label><input id="pn" required minlength="2"></div>
      <div class="fld"><label for="pc">Cidade</label><input id="pc"></div>
      <div class="fld"><label for="pu">UF</label><input id="pu" maxlength="2" placeholder="SC"></div>
      <div class="fld full"><label for="pe">E-mail do pastor presidente</label><input id="pe" type="email" required><span class="dica">Ele recebe o perfil de pastor presidente ao criar a conta com este e-mail.</span></div>
      <div id="msg" class="fld full"></div>
      <div class="fa"><button class="btn pri" type="submit">Cadastrar igreja</button></div></form></section>
    <section class="panel"><h2>Igrejas cadastradas</h2><div id="lista-ig"><div class="carregando">Carregando…</div></div></section>`;
  const { data: igs } = await sb.from('igrejas').select('id,nome,cidade,uf,status,criada_em').order('nome');
  $('#lista-ig').innerHTML = (igs || []).length ? `<div class="tw"><table><thead><tr><th>Igreja</th><th>Cidade</th><th>Desde</th><th>Situação</th><th></th></tr></thead><tbody>${igs.map(i => `
    <tr><td><b style="font-weight:600">${esc(i.nome)}</b></td><td>${esc(i.cidade || '')}${i.uf ? '/' + esc(i.uf) : ''}</td><td class="num">${new Date(i.criada_em).toLocaleDateString('pt-BR')}</td>
    <td>${i.status === 'ativa' ? '<span class="pill p-ok">ativa</span>' : '<span class="pill p-bad">suspensa</span>'}</td>
    <td class="acoes"><button class="btn sm ${i.status === 'ativa' ? 'danger' : ''}" data-ig="${i.id}" data-status="${i.status === 'ativa' ? 'suspensa' : 'ativa'}">${i.status === 'ativa' ? 'Suspender' : 'Reativar'}</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="vazio">Nenhuma igreja cadastrada ainda.</div>';

  $('#f-nova').onsubmit = e => {
    e.preventDefault();
    ocupado($('button[type=submit]', e.target), async () => {
      const { error } = await sb.rpc('criar_igreja', { p_nome: $('#pn').value, p_cidade: $('#pc').value, p_uf: $('#pu').value, p_email_pastor: $('#pe').value });
      if (error) return msgErro($('#msg'), error);
      await carregarContexto();
      toast('Igreja cadastrada. Avise o pastor para criar a conta com o e-mail informado.');
      telaPlataforma(main);
    });
  };
  main.onclick = async e => {
    const b = e.target.closest('button[data-ig]'); if (!b) return;
    if (b.dataset.status === 'suspensa' && !confirm('Suspender esta igreja? Ninguém dela conseguirá acessar até você reativar.')) return;
    const { error } = await sb.from('igrejas').update({ status: b.dataset.status }).eq('id', b.dataset.ig);
    error ? toast(traduzErro(error)) : (toast(b.dataset.status === 'ativa' ? 'Igreja reativada.' : 'Igreja suspensa.'), telaPlataforma(main));
  };
}

/* ------------------------------------------------------------------ */
/* ações globais                                                       */
/* ------------------------------------------------------------------ */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-ir],[data-acao="sair"],[data-acao="recarregar"]');
  if (!b) return;
  if (b.dataset.ir === 'criar') telaCriar();
  if (b.dataset.ir === 'recuperar') telaRecuperar();
  if (b.dataset.ir === 'entrar') telaEntrar();
  if (b.dataset.acao === 'sair') { await sb.auth.signOut(); telaEntrar(); }
  if (b.dataset.acao === 'recarregar') { await aposEntrar(); }
});

Pessoas.instalar({ sb, S, $, esc, toast, pode, lideraMin, igrejaAtual, cab, icon, traduzErro, ocupado, ETAPAS, render });
Estudos.instalar({ sb, S, esc, toast, igrejaAtual, cab, icon, traduzErro, ocupado });
Discipulado.instalar({ sb, S, esc, toast, pode, igrejaAtual, cab, icon, traduzErro, ocupado, ETAPAS });
Cuidado.instalar({ sb, S, esc, toast, pode, igrejaAtual, cab, icon, traduzErro, ocupado });
Comunicacao.instalar({ sb, S, esc, toast, pode, lideraMin, igrejaAtual, cab, icon, traduzErro, ocupado });
Portal.instalar({ sb, S, esc, toast, pode, igrejaAtual, cab, icon, traduzErro, ocupado, ETAPAS });
Comunicacao.registrarPortal(Portal);
Tarefas.instalar({ sb, S, esc, toast, pode, igrejaAtual, traduzErro });
Relatorios.instalar({ sb, S, esc, toast, pode, igrejaAtual, cab, icon, traduzErro, ocupado, ETAPAS });
Escola.instalar({ sb, S, esc, toast, pode, igrejaAtual, cab, icon, traduzErro, ocupado, ETAPAS });
Gestao.instalar({ sb, S, $, esc, toast, pode, lideraMin, igrejaAtual, cab, icon, traduzErro, ocupado, render });

iniciar().catch(err => {
  console.error(err);
  app().innerHTML = `<div class="auth"><div class="auth-card"><h1>Não foi possível carregar</h1><div class="erro">${esc(traduzErro(err))}</div><p>Confira sua internet e recarregue a página.</p></div></div>`;
});
