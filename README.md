# LeadFlow

LeadFlow is a B2B SaaS for conversational lead qualification. Companies will publish public flows that collect answers, create structured leads, and prepare WhatsApp messages for sales teams.

## Architecture

LeadFlow uses a simple pnpm workspace monorepo:

```text
leadflow/
  apps/
    web/      # Next.js frontend
    api/      # NestJS backend
  packages/  # reserved for future shared code
  docs/
```

No Nx or Turborepo is used initially.

## Stack

- Node.js
- pnpm workspaces
- Next.js with TypeScript and App Router
- NestJS with TypeScript
- PostgreSQL 17 through Docker Compose

## Requirements

- Node.js 22 or newer
- pnpm
- Docker and Docker Compose

## Install pnpm

With Node.js installed, enable pnpm through Corepack:

```sh
corepack enable
corepack prepare pnpm@10.15.1 --activate
```

Confirm it is available:

```sh
pnpm --version
```

## Install Dependencies

```sh
pnpm install
```

## Environment

Create a local `.env` from the example:

```sh
cp .env.example .env
```

Development variables:

```env
POSTGRES_DB=leadflow
POSTGRES_USER=leadflow
POSTGRES_PASSWORD=leadflow_dev_password
DATABASE_URL=postgresql://leadflow:leadflow_dev_password@localhost:5432/leadflow
```

Do not commit real secrets.

## Start PostgreSQL

```sh
docker compose --env-file .env up -d postgres
```

Check the container health:

```sh
docker compose ps
```

## Run The Project

Start web and api together:

```sh
pnpm dev
```

Or run them separately:

```sh
pnpm dev:web
pnpm dev:api
```

Local URLs:

- Web: http://localhost:3000
- API health: http://localhost:3001/api/health
- PostgreSQL: localhost:5432

## Scripts

```sh
pnpm dev       # starts web and api together
pnpm dev:web   # starts apps/web on port 3000
pnpm dev:api   # starts apps/api on port 3001
pnpm build     # builds all workspace apps
pnpm lint      # lints all workspace apps
pnpm test      # runs workspace tests
```

## Current Scope

This repository currently contains only the technical foundation. Product features such as authentication, flows, leads, WhatsApp links, ORM models, and migrations are intentionally not implemented yet.
