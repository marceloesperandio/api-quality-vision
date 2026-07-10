# Release Notes

## Refatoração técnica — v1.42.0

- Revisada a estrutura do projeto.
- Refatorado `App.jsx`, extraindo constantes, utilitários e componentes reutilizáveis.
- Criado `src/constants.js`.
- Criado `src/utils.js`.
- Criado `src/components/ui.jsx`.
- Otimizado o build com separação de chunks no Vite.
- Adicionado `.env.example` com variáveis Firebase esperadas.
- Atualizado `.gitignore` para evitar envio de artefatos locais.
- Build validado com sucesso usando `npm run build`.

## v1.43.0

- Ajustada a altura do campo de busca principal para `h-16`, alinhando visualmente com os cards de status do cabeçalho, como `Mock local` e `Success Rate`.
- Mantido o padrão visual minimalista com bordas arredondadas, fundo escuro e foco em azul.

