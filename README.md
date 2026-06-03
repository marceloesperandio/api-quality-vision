# api-quality-vision v1.42.0

Aplicação React + Vite para acompanhamento de indicadores de qualidade, evolução de ENs, histórico de bugs e configurações operacionais.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Estrutura principal

```text
src/
  App.jsx
  constants.js
  utils.js
  firebase.js
  mockData.js
  components/
    ui.jsx
  assets/
```

## Configuração Firebase

Copie `.env.example` para `.env` e preencha as variáveis `VITE_FIREBASE_*`.

Sem Firebase configurado, a aplicação usa dados mockados locais.

## Code review

Consulte `CODE_REVIEW.md` para ver os pontos analisados, melhorias aplicadas e próximos passos recomendados.
