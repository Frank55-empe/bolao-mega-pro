# 🍀 Bolão da Mega PRO

Sistema completo para administrar bolões da Mega Sena, 100% gratuito:
**React + Vite + Tailwind** no front, **Google Sheets** como banco de dados,
**Google Apps Script** como API, e **GitHub Pages** para hospedar. Sem
Firebase, sem Supabase, sem mensalidade.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS (dark mode por padrão, verde `#16a34a` + dourado `#facc15`)
- React Router (HashRouter — compatível com GitHub Pages)
- Recharts (gráficos do dashboard admin)
- Google Apps Script (backend/API)
- Google Sheets (banco de dados)

## Estrutura do projeto

```
/src
  /components   -> Header, NumberGrid, Toast, ConfirmDialog, Skeleton
  /pages        -> Home, Cadastro, EscolhaNumeros, Pagamento, Consulta, Regulamento
    /admin      -> Login, Dashboard, Concursos, Participantes
  /hooks        -> useRequireAdmin
  /services     -> api.ts (comunicação com o Apps Script)
  /utils        -> helpers.ts, pix.ts (gerador de PIX com CRC16 real)
  /types        -> tipos TypeScript compartilhados
  /context      -> AppContext (fluxo da aposta), ToastContext
/gas-backend
  Code.gs       -> backend completo do Google Apps Script
```

## Passo a passo para colocar no ar

### 1. Backend (Google Apps Script)

1. Crie uma planilha nova no Google Sheets.
2. Extensões → Apps Script.
3. Apague o conteúdo padrão e cole o arquivo `gas-backend/Code.gs`.
4. No topo do editor, selecione a função `configurarSenhaAdmin`, edite a
   senha dentro dela e clique em **Executar** (só uma vez). Isso grava o
   hash da senha na aba CONFIG.
5. Implantar → Nova implantação → tipo **App da Web**.
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
6. Copie a URL gerada (termina em `/exec`).
7. Na primeira chamada feita pelo site, as abas `CONFIG`, `CONCURSOS`,
   `PARTICIPANTES`, `APOSTAS`, `PAGAMENTOS`, `LOGS` e `ESTATISTICAS` são
   criadas automaticamente — não precisa montar planilha na mão.

> Sempre que editar o `Code.gs`, você precisa gerar **uma nova implantação**
> (ou "gerenciar implantações" → editar → nova versão) para as mudanças
> valerem na URL publicada.

### 2. Frontend

```bash
npm install
cp .env.example .env
```

Edite o `.env`:

```
VITE_API_URL=https://script.google.com/macros/s/SEU_ID/exec
VITE_APP_NAME="Bolão da Mega PRO"
```

Edite também em `src/pages/Pagamento.tsx` a sua chave PIX real:

```ts
const CHAVE_PIX = 'seuemail@exemplo.com';
const NOME_RECEBEDOR = 'SEU NOME';
const CIDADE_RECEBEDOR = 'SUA CIDADE';
```

Rodar localmente:

```bash
npm run dev
```

### 3. Deploy no GitHub Pages

1. Crie o repositório no GitHub (ex: `bolao-mega-pro`).
2. Confira em `vite.config.ts` se `base` bate com o nome do repositório
   (`base: '/bolao-mega-pro/'`) — se o nome do repo for diferente, ajuste
   aqui, senão a tela fica em branco no Pages.
3. **Recomendação forte:** use git local, não o upload manual pela interface
   web do GitHub. Upload manual repetido corrompe arquivos com frequência.

```bash
git init
git add .
git commit -m "primeira versão"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/bolao-mega-pro.git
git push -u origin main

npm run deploy
```

O script `deploy` builda e publica a pasta `dist` na branch `gh-pages`
usando o pacote `gh-pages` (já incluso no `package.json`). Depois, em
Settings → Pages do repositório, selecione a branch `gh-pages`.

## Fluxo do apostador

Início → Cadastro → Escolha dos números (6 a 15) → Pagamento (PIX com QR
Code real, chave copia-e-cola) → confirmação com protocolo único →
"Meus Jogos" (consulta por WhatsApp).

## Painel administrativo

Acesse `/#/admin`, entre com a senha definida em `configurarSenhaAdmin`.

- **Dashboard**: participantes, arrecadação, prêmio líquido, gráficos por
  dia e por cidade.
- **Concursos**: criar, editar, duplicar, encerrar e excluir.
- **Participantes**: lista de apostas com busca, filtro por status,
  alteração de status inline e exportação CSV.

## O que já está implementado

- Escolha de números com contador, "Surpresinha" (sorteio automático) e
  bloqueio de excesso de seleção.
- Geração de PIX "Copia e Cola" real, com checksum CRC16 válido (não é só
  um texto de exemplo).
- Protocolo único por aposta.
- Bloqueio de aposta duplicada (mesmos números, mesmo participante, mesmo
  concurso) e bloqueio automático após a data limite do concurso.
- Sessão de admin via token com expiração (6h), senha nunca trafega em
  texto puro (SHA-256).
- Toasts, loading skeleton, confirmação antes de ações destrutivas,
  paginação e busca na lista de participantes.
- Log de auditoria (aba LOGS) para login, criação/edição de concursos,
  apostas e mudanças de status.

## O que fica como próximo passo (não incluído para manter o escopo enxuto)

- **Upload de comprovante para o Google Drive**: dá pra adicionar com
  `DriveApp.createFile()` no `Code.gs` recebendo a imagem em base64; hoje o
  campo `comprovanteUrl` já existe na aba PAGAMENTOS, só falta a tela de
  upload no frontend.
- **Envio automático de WhatsApp pelo servidor** (hoje é um link `wa.me` que
  o próprio usuário/admin clica): para automatizar de verdade precisa de
  Z-API, CallMeBot ou outro provedor pago/com token.
- **PWA instalável completo** (hoje só tem o manifest.json; falta o service
  worker para funcionar 100% offline).
- **Exportação em Excel/PDF** no admin (hoje só tem CSV, que abre
  perfeitamente no Excel).
- **Rate limiting por IP**: o Apps Script não expõe IP do requisitante de
  forma confiável; o que existe hoje é o bloqueio de aposta duplicada.

## Licença

MIT — veja `LICENSE`.
