// Livres Connect · instalar como aplicativo no celular (Android e iPhone)
let pedido = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pedido = e; document.dispatchEvent(new Event('lc-instalavel')); });
window.addEventListener('appinstalled', () => { pedido = null; document.dispatchEvent(new Event('lc-instalavel')); });

export const instalado = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const ehCelular = () => ehIOS() || /android/i.test(navigator.userAgent);
const lerOculto = () => { try { return localStorage.getItem('lc-instalar-oculto') === '1'; } catch (e) { return false; } };
const ocultar = () => { try { localStorage.setItem('lc-instalar-oculto', '1'); } catch (e) { /* */ } };

// Instruções conforme o aparelho. completo = sempre mostrar (tela Minha conta)
export function blocoInstalar(completo = false) {
  if (instalado()) return completo ? '<div class="instalar ok"><b class="titulo">Você já está usando o aplicativo.</b> 👍</div>' : '';
  if (!completo && (lerOculto() || (!ehCelular() && !pedido))) return '';
  const passos = ehIOS()
    ? `<ol><li>Toque no botão <b>Compartilhar</b> <span class="ico-ios">⬆</span> na barra do Safari.</li><li>Role e escolha <b>Adicionar à Tela de Início</b>.</li><li>Toque em <b>Adicionar</b>. O ícone aparece junto com os seus aplicativos.</li></ol>`
    : pedido ? '<p>Toque no botão abaixo. O ícone aparece junto com os seus aplicativos.</p>'
    : `<ol><li>No Chrome, toque no menu <b>⋮</b> (canto de cima).</li><li>Escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</li><li>Confirme. O ícone aparece junto com os seus aplicativos.</li></ol>`;
  return `<div class="instalar"><img src="icones/icone-192.png" alt="" width="44" height="44">
    <div class="cresce"><b class="titulo">Instale o aplicativo no celular</b>${passos}
    <div class="acts">${pedido ? '<button class="btn pri sm" data-instalar>Instalar aplicativo</button>' : ''}${completo ? '' : '<button class="btn sm ghost" data-instalar-nao>Agora não</button>'}</div></div></div>`;
}

// Liga os botões e redesenha quando o Chrome avisar que dá para instalar
export function ligarInstalar(caixa, completo = false) {
  if (!caixa) return;
  const desenhar = () => {
    caixa.innerHTML = blocoInstalar(completo);
    const b = caixa.querySelector('[data-instalar]');
    if (b) b.onclick = async () => { if (!pedido) return; pedido.prompt(); await pedido.userChoice; pedido = null; desenhar(); };
    const n = caixa.querySelector('[data-instalar-nao]');
    if (n) n.onclick = () => { ocultar(); caixa.innerHTML = ''; };
  };
  desenhar();
  document.addEventListener('lc-instalavel', desenhar);
}
