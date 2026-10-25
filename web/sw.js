// Livres Connect · service worker
// Deixa o sistema instalável como aplicativo e mostra um aviso amigável
// quando o celular está sem internet. Não guarda dados da igreja no aparelho.
const SEM_INTERNET = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sem internet</title><style>body{margin:0;font-family:system-ui,sans-serif;background:#eef2ef;color:#15211d;display:grid;place-items:center;min-height:100vh;padding:24px;box-sizing:border-box}
div{background:#fff;border-radius:16px;padding:28px 24px;max-width:380px;text-align:center;box-shadow:0 4px 14px rgba(20,40,34,.08)}h1{font-size:22px;margin:0 0 8px}p{color:#596963;margin:0 0 18px}
button{background:#0d6b61;color:#fff;border:0;border-radius:10px;padding:12px 20px;font-size:16px;font-weight:600}</style></head>
<body><div><h1>Sem conexão com a internet</h1><p>O Livres Connect precisa de internet para mostrar as informações da igreja. Confira o Wi-Fi ou os dados móveis.</p><button onclick="location.reload()">Tentar de novo</button></div></body></html>`;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;  // o resto vai direto para a internet
  e.respondWith(fetch(e.request).catch(() => new Response(SEM_INTERNET, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});
