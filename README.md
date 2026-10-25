# Livres Connect

Sistema de gestão eclesiástica para várias igrejas: membros, visitantes, Jornada da Alma, financeiro, agenda e escalas.

**No ar:** https://livres-connect.vercel.app

**Situação atual: 1ª etapa completa (Base técnica, Pessoas e Gestão).**

- **Base:** login com verificação em duas etapas, várias igrejas com dados isolados, perfis de acesso, convites, configurações da igreja e auditoria.
- **Pessoas:** membros com foto e carteirinha digital, visitantes com ficha pública por QR Code (encaminhada automaticamente a um líder), Jornada da Alma em quadro com atividades por etapa, histórico de contatos e anotações pastorais restritas.
- **Gestão:** financeiro (lançamentos, contas a pagar e receber, comprovantes, campanhas, planilha e relatório para imprimir), agenda com eventos semanais e escalas com lembrete pelo WhatsApp e confirmação do voluntário por link, sem login.

---

## Como colocar o sistema no ar (passo a passo)

São dois serviços com plano gratuito:

- **Supabase:** guarda os dados e cuida do login
- **Vercel:** publica o site na internet

Leva cerca de 30 minutos. Os nomes dos botões podem mudar um pouco com o tempo; se algo estiver diferente, procure o termo mais parecido.

### Passo 1 · Criar o projeto no Supabase

1. Entre em **supabase.com** e clique em **Start your project**.
2. Escolha **Continue with GitHub** e use a mesma conta do GitHub onde está este código.
3. Clique em **New project** e preencha:
   - **Name:** `livres-connect`
   - **Database Password:** clique em **Generate a password** e **guarde essa senha** num lugar seguro
   - **Region:** escolha **South America (São Paulo)**
4. Clique em **Create new project** e aguarde uns 2 minutos até o projeto ficar pronto.

### Passo 2 · Criar o banco de dados

1. Aqui no GitHub, abra a pasta `supabase/migrations` e depois o arquivo `0001_base.sql`.
2. Clique no botão **Copy raw file**, o ícone de duas folhas no canto direito, acima do texto.
3. No Supabase, no menu da esquerda, clique em **SQL Editor**.
4. Cole o texto (Ctrl+V, ou Cmd+V no Mac) e clique em **Run**.
5. Deve aparecer **Success. No rows returned**. Rode esse arquivo uma única vez.

### Passo 3 · Ligar o site ao banco

1. No Supabase, abra **Project Settings** (a engrenagem no menu da esquerda).
2. Em **Data API**, copie a **Project URL**, que é parecida com `https://abcd1234.supabase.co`.
3. Em **API Keys**, copie a **Publishable key**, que começa com `sb_publishable_`.
   **Nunca** copie a *secret key* nem a *service_role key*.
4. Aqui no GitHub, abra `web/config.js` e clique no **lápis** (Edit this file).
5. Troque `COLE_AQUI_A_PROJECT_URL` pela Project URL e `COLE_AQUI_A_PUBLISHABLE_KEY` pela Publishable key. Mantenha as aspas simples.
6. Clique em **Commit changes** e confirme.

### Passo 4 · Publicar o site na Vercel

1. Entre em **vercel.com**, clique em **Sign Up** e escolha **Continue with GitHub**.
2. Clique em **Add New…** e depois em **Project**.
3. Ao lado de `livres-connect`, clique em **Import**. Se o repositório não aparecer, clique em **Adjust GitHub App Permissions** e libere o acesso a ele.
4. Na tela de configuração:
   - **Framework Preset:** `Other`
   - **Root Directory:** clique em **Edit**, escolha a pasta **web** e confirme
5. Clique em **Deploy**. Em cerca de 1 minuto aparece o endereço do site, algo como `livres-connect.vercel.app`. **Copie esse endereço.**

### Passo 5 · Avisar o Supabase sobre o endereço do site

1. No Supabase, vá em **Authentication** e depois em **URL Configuration**.
2. Em **Site URL**, cole o endereço da Vercel com `https://` na frente (exemplo: `https://livres-connect.vercel.app`) e salve.
3. Em **Redirect URLs**, clique em **Add URL**, cole o mesmo endereço e salve.

Sem isso, os links de confirmação de e-mail e de troca de senha não funcionam.

### Passo 6 · Criar a sua conta

1. Abra o endereço do site e clique em **Criar minha conta**.
2. Preencha nome, e-mail e senha.
3. Abra o e-mail de confirmação que o Supabase enviar e clique no link. Confira o spam.
4. A tela vai mostrar "Aguardando convite". Isso é esperado.

### Passo 7 · Tornar-se administrador da plataforma

1. No Supabase, abra o **SQL Editor** e clique em **New query**.
2. Cole o texto abaixo, **trocando o e-mail pelo seu**:

   ```sql
   insert into public.admins_plataforma (user_id)
   select id from auth.users where email = 'seu-email@exemplo.com';
   ```

3. Clique em **Run**. Deve aparecer **Success. 1 row affected**.

### Passo 8 · Cadastrar a primeira igreja

1. No site, clique em **Já recebi o convite** (ou saia e entre de novo).
2. No menu, abra **Plataforma**.
3. Cadastre a **Comunidade Cristã Livres em Cristo**. Em *E-mail do pastor presidente*, use o seu e-mail se você for o pastor; se não for, use o e-mail dele.
4. Saia e entre de novo. A igreja aparece com o perfil de pastor presidente. Pronto.

A partir daqui, o pastor convida a equipe em **Usuários e perfis**. O botão **Copiar mensagem** gera um texto pronto para enviar pelo WhatsApp.

### Passo 9 (recomendado) · Verificação em duas etapas

Em **Minha conta**, ative a verificação em duas etapas. Você vai precisar de um aplicativo autenticador gratuito no celular, como o Google Authenticator. O sistema mostra um aviso para pastor e tesouraria até que ela seja ativada.

---

## Antes de usar com muitas pessoas

- **E-mails:** o envio de e-mails embutido no Supabase serve para testes e manda poucos e-mails por hora. Antes do piloto, configure um serviço de e-mail próprio (por exemplo, Resend) em **Authentication → Emails → SMTP Settings**. Faremos isso juntos na fase do piloto.
- **Backup:** o plano gratuito do Supabase não guarda cópias de segurança diárias. Para o uso real, avalie o plano pago ou uma rotina de exportação.
- **Endereço próprio:** dá para usar um domínio como `app.livresconnect.com.br` na Vercel, em **Settings → Domains**.

---

## Para desenvolvedores

**Como está organizado**

| Pasta | O que tem |
| --- | --- |
| `supabase/migrations/0001_base.sql` | Todas as tabelas da 1ª etapa, regras de acesso (RLS) por igreja e perfil, auditoria, convites e a função `criar_igreja` |
| `supabase/migrations/0002_restringir_funcoes.sql` | Fecha as funções internas para a API pública |
| `supabase/migrations/0003_fase_pessoas.sql` | Ficha pública do visitante (`registrar_visitante`), `mudar_etapa`, `equipe_acompanhamento` |
| `supabase/migrations/0004_fotos.sql` | Pasta privada de fotos no Storage, separada por igreja |
| `supabase/migrations/0005_fase_gestao.sql` | Forma de pagamento, séries de eventos, escala com link (`escala_do_evento`, `voluntarios`, `escala_publica`, `responder_escala`) |
| `supabase/migrations/0006_comprovantes.sql` | Pasta privada de comprovantes financeiros |
| `supabase/testes/` | Testes em Postgres puro, com o `auth` do Supabase simulado (81 verificações) |
| `web/` | Site estático, sem etapa de build: `index.html`, `app.js` (base), `pessoas.js` (fase Pessoas), `gestao.js` (fase Gestão), `estilos.css`, `config.js` |
| `vercel.json` | Faz a Vercel servir a pasta `web` na raiz do site |

**Decisões**

- **Toda a segurança mora no banco.** Cada tabela tem `igreja_id` e políticas RLS que usam `tem_perfil()`, `pode_ver_pessoa()` e funções parecidas. O site só esconde o que o banco já bloqueia.
- **Chaves estrangeiras compostas** (`(pessoa_id, igreja_id)` → `pessoas(id, igreja_id)`) impedem que um registro de uma igreja aponte para outra.
- **Convites:** o pastor registra um convite por e-mail. Quando a conta com esse e-mail é confirmada (gatilho em `auth.users`), o vínculo é criado. Por isso o site não precisa da *service_role key*.
- **Auditoria:** um gatilho genérico registra antes e depois de cada alteração. O texto das anotações pastorais nunca é copiado.
- **Sem build:** a biblioteca `supabase-js` vem por CDN (jsDelivr, versão fixa). É simples de manter. Se a interface crescer muito, podemos migrar para Next.js sem mudar nada no banco.

**Rodar os testes do banco**

```bash
# com um Postgres 15+ local
cd supabase/testes
PGHOST=localhost PGUSER=postgres ./rodar_testes.sh
```

**Próximas fases**

1. ~~**Pessoas**: membros, ficha pública por QR Code, Jornada da Alma, carteirinha~~ (concluída)
2. ~~**Gestão**: financeiro com comprovantes, agenda, escalas com lembretes~~ (concluída)
3. **Piloto** (semanas 14 a 16): SMTP próprio, backup, treinamento e ajustes
