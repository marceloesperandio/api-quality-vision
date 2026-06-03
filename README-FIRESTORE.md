# Firestore completo - Quality Vision

## Arquivos incluídos
- `firestore.rules`
- `firestore.indexes.json`
- `firebase.json`
- `firebase/seed/*.json`
- `firebase/importSeed.mjs`

## Coleções
- `ens`
- `bugs`
- `logs`
- `settings`

## Modelo recomendado

### ens/{id}
```json
{
  "desc": "Validação do fluxo de contratação digital",
  "status": "Finalizado",
  "squad": "Core Fibra",
  "project": "Portal Comercial B2C",
  "owner": "Marcelo",
  "week": "S1",
  "bug": "BUG-342",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "createdBy": "Marcelo",
  "updatedBy": "Marcelo"
}
```

### bugs/{id}
```json
{
  "desc": "Timeout na consulta de elegibilidade",
  "status": "Em análise",
  "owner": "Backend",
  "squad": "Core Fibra",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "createdBy": "Marcelo",
  "updatedBy": "Marcelo"
}
```

### logs/{id}
```json
{
  "message": "Execução regressiva concluída no ambiente de homologação.",
  "createdAt": "timestamp",
  "createdBy": "Marcelo"
}
```

### settings/qualityVision
```json
{
  "successRateTarget": 85,
  "slaDays": 3,
  "logoPath": "./assets/logo-vtal.png",
  "projectName": "Portal Comercial B2C",
  "squadName": "Core Fibra",
  "managerName": "Juliana Martins",
  "qaName": "Marcelo",
  "updatedAt": "timestamp",
  "updatedBy": "Marcelo"
}
```

## Papéis esperados nas regras
As regras esperam usuários autenticados com um destes papéis em custom claims:
- `viewer`
- `editor`
- `qa_editor`
- `qa_admin`

`admin` e `qa_admin` podem excluir registros e alterar `settings`.

## Como publicar regras e índices
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## Como importar os dados iniciais
1. copie `.env.example` para `.env`
2. instale as dependências do projeto
3. rode:

```bash
node firebase/importSeed.mjs
```

## Observação
As regras foram feitas para um dashboard interno autenticado. Se você quiser, no próximo passo eu posso te entregar também:
- autenticação Firebase
- tela de login
- controle de perfil por papel
- script para definir custom claims no Admin SDK
