# Code Review — Quality Vision

## Resumo

Foi realizada uma revisão estrutural no projeto React + Vite, com foco em organização, manutenibilidade, performance de build e preservação do layout atual.

## Pontos identificados

1. O arquivo `src/App.jsx` concentrava constantes, utilitários, componentes visuais e regra de negócio em um único arquivo com mais de 600 linhas.
2. As configurações visuais, como status, cores, versão e abas, estavam misturadas com a tela principal.
3. Componentes reutilizáveis como `Button`, `Card`, `RecordCard`, `ConfigList`, `SelectField` e `StatCard` estavam acoplados ao `App.jsx`.
4. Utilitários como `cx`, `uniq` e `normalizeDate` estavam no mesmo arquivo da tela principal.
5. O build gerava um bundle JavaScript grande, principalmente pela combinação de React, Chart.js e Firebase no mesmo chunk.
6. O pacote enviado continha artefatos que não devem ir para versionamento/pacote final, como `node_modules`, `dist`, `.vite`, `.DS_Store` e `.git`.

## Refatorações aplicadas

- Criado `src/constants.js` para centralizar:
  - nome da aplicação;
  - versão;
  - copyright;
  - abas;
  - status;
  - cores dos status;
  - estilos dos indicadores.

- Criado `src/utils.js` para centralizar funções utilitárias:
  - `cx`;
  - `normalizeDate`;
  - `uniq`.

- Criado `src/components/ui.jsx` com componentes reutilizáveis:
  - `Button`;
  - `Card`;
  - `SectionTitle`;
  - `Field`;
  - `StatusPill`;
  - `StatCard`;
  - `SelectField`;
  - `EmptyState`;
  - `RecordCard`;
  - `ConfigList`;
  - `LimitSelect`;
  - `LogSection`.

- Reduzido o `src/App.jsx` de 615 linhas para aproximadamente 427 linhas.
- Mantida a regra de negócio principal dentro do `App.jsx`, sem alterar comportamento funcional.
- Atualizado `vite.config.js` com `manualChunks` para separar:
  - React;
  - gráficos;
  - Firebase;
  - código da aplicação.

## Resultado do build

Build executado com sucesso:

```bash
npm run build
```

Resultado após code splitting:

- `index`: ~28 KB
- `react`: ~134 KB
- `charts`: ~171 KB
- `firebase`: ~345 KB

## Próximos passos recomendados

1. Separar regras de estado e CRUD em hooks, por exemplo `useQualityVisionData`.
2. Dividir abas em páginas/componentes independentes:
   - `DashboardTab`;
   - `EvolutionTab`;
   - `BugHistoryTab`;
   - `SettingsTab`.
3. Criar camada de services para Firebase:
   - `enService`;
   - `bugService`;
   - `logService`.
4. Adicionar ESLint e Prettier para padronização automática.
5. Adicionar testes unitários para filtros, cálculos de status e métricas.
6. Avaliar lazy loading das abas com `React.lazy` para reduzir ainda mais o bundle inicial.
