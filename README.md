# 🍀 Bolão da Mega PRO

Sistema completo pra administrar bolões da Mega Sena: React + Vite + Tailwind
no front, Google Sheets como banco, Google Apps Script como API, GitHub Pages
pra hospedar.

## Publicar (resumo)

1. **Backend**: cole `gas-backend/Code.gs` no Apps Script da sua planilha,
   rode `configurarSenhaAdmin` (edite a senha antes), implante como Web App
   ("Qualquer pessoa" tem acesso), copie a URL `/exec`.
2. **Frontend**: `cp .env.example .env`, cole a URL no `VITE_API_URL`.
3. **GitHub**: suba o projeto inteiro (recomendado: GitHub Desktop, não
   arrastar pasta pelo navegador — a pasta oculta `.github/workflows` se
   perde nesse método). Em Settings → Pages, Source = "GitHub Actions".
4. O workflow em `.github/workflows/deploy.yml` builda e publica sozinho a
   cada push na branch `main`.

## Por que JSONP em vez de fetch()

O Apps Script não manda CORS de forma confiável pra sites externos. O
`src/services/api.ts` usa uma tag `<script>` (JSONP) em vez de `fetch()`
pra contornar isso — funciona tanto pra leitura quanto para criar/editar
dados (tudo viaja como GET com os dados dentro do parâmetro `payload`).

## Licença

MIT.
