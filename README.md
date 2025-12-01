# DITEC – Sistema de Gestão de Contratos

API backend em Node.js + TypeScript + Express + Prisma para gerir contratos de licitação conforme a especificação em `spec-contratos.md`.

## Pré-requisitos
- Node.js 20+
- Docker e Docker Compose

## Variáveis de ambiente
Copie o exemplo e ajuste conforme seu ambiente:

```bash
cp .env.example .env
```

Edite `DATABASE_URL` se necessário.

## Subir infraestrutura com Docker
Inicie o PostgreSQL (e opcionalmente a API em modo dev) com:

```bash
docker-compose up -d db
```

Para subir a API usando o container `api` (hot reload via `ts-node-dev`):

```bash
docker-compose up api
```

## Instalar dependências
No host ou dentro do container `api`:

```bash
npm install
```

## Migrations do Prisma
Gere e aplique as tabelas no banco configurado:

```bash
npm run prisma:migrate
```

## Execução em desenvolvimento

```bash
npm run dev
```

A API responderá em `http://localhost:3000`.

## Build e execução em produção

```bash
npm run build
npm start
```

## Rotas principais

- `POST /api/contratos` – cria um contrato.
- `GET /api/contratos` – lista contratos com filtros (`page`, `pageSize`, `statusContrato`, `modalidade`, `orgaoResponsavel`, `empresaContratada`, `search`).
- `GET /api/contratos/:id` – busca contrato por ID.
- `PUT /api/contratos/:id` – atualiza dados do contrato.
- `DELETE /api/contratos/:id` – marca o contrato como `ENCERRADO`.
- `POST /api/contratos/:id/pesquisa-precos` – registra fontes de preço e recalcula `valorEstimado` e `diferencaPercentual`.
- `GET /api/contratos/visao-geral` – visão para gestor com dias restantes, alerta e ordenação pelo menor `valorGlobal`.

## Rotina de atualização de status (alerta de 3 meses)
Atualiza `statusContrato` automaticamente com base em `dataFim` (ATIVO / EM_ALERTA / VENCIDO):

```bash
npm run job:atualizar-status
```

## Exemplo de requisição para pesquisa de preços

```bash
POST /api/contratos/:id/pesquisa-precos
[
  {
    "fonte": "Compras.gov.br",
    "url": "https://compras.gov.br/",
    "precoColetado": 150000,
    "dataColeta": "2025-12-01"
  },
  {
    "fonte": "Site de varejo",
    "precoColetado": 140000,
    "dataColeta": "2025-12-02"
  }
]
```

A resposta retorna o contrato atualizado com `valorEstimado` e `diferencaPercentual`.
