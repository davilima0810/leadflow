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
cp .env.example apps/api/.env
```

Development variables:

```env
POSTGRES_DB=leadflow
POSTGRES_USER=leadflow
POSTGRES_PASSWORD=leadflow_dev_password
DATABASE_URL=postgresql://leadflow:leadflow_dev_password@localhost:5432/leadflow
JWT_SECRET=change-me-in-development
JWT_EXPIRES_IN=1h
PORT=3001
API_HOST=127.0.0.1
WEB_URL=http://localhost:3000
PUBLIC_SUBMISSION_RATE_LIMIT_WINDOW_MS=60000
PUBLIC_SUBMISSION_RATE_LIMIT_MAX=20
NEXT_PUBLIC_API_URL=http://localhost:3001/api
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

Run database migrations:

```sh
pnpm --filter @leadflow/api exec prisma migrate dev --schema prisma/schema.prisma
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
- API auth register: POST http://localhost:3001/api/auth/register
- API auth login: POST http://localhost:3001/api/auth/login
- API auth me: GET http://localhost:3001/api/auth/me
- API flows: http://localhost:3001/api/flows
- API public flow: GET http://localhost:3001/api/public-flows/:companySlug/:flowSlug
- API public submission: POST http://localhost:3001/api/public-flows/:companySlug/:flowSlug/submissions
- API leads: http://localhost:3001/api/leads
- Login: http://localhost:3000/login
- Lead Inbox: http://localhost:3000/leads
- Public frontend URL: http://localhost:3000/c/:companySlug/:flowSlug
- PostgreSQL: localhost:5432

## Scripts

```sh
pnpm dev       # starts web and api together
pnpm dev:web   # starts apps/web on port 3000
pnpm dev:api   # starts apps/api on port 3001
pnpm build     # builds all workspace apps
pnpm start     # starts built web and api apps
pnpm start:web # starts the built Next.js app
pnpm start:api # starts the built NestJS API
pnpm lint      # lints all workspace apps
pnpm test      # runs workspace tests
```

For a production-like local check:

```sh
pnpm build
pnpm start:api
pnpm start:web
```

Production requirements:

- set a strong `JWT_SECRET`;
- set `WEB_URL` to the deployed frontend origin for CORS;
- set `NEXT_PUBLIC_API_URL` to the deployed API `/api` URL;
- run Prisma migrations before serving traffic;
- keep `.env` files out of version control.

## Current Scope

This repository currently contains the technical foundation, the Prisma schema for Company/User/Flow/Question/QuestionOption/Lead/LeadAnswer, API authentication through Argon2 password hashing and JWT Bearer access tokens, private tenant-scoped Flow/Question management endpoints, public flow lookup/submission, a minimal Flow Builder, and a private Lead Inbox.

The private frontend currently uses a small browser-side token helper with localStorage for the MVP pilot. Review this before public production hardening.

`Question.type` defines the answer format. `Question.semanticType` defines contact meaning and currently supports `NONE`, `CONTACT_NAME`, `CONTACT_PHONE`, and `CONTACT_EMAIL`.

Lead detail derives contact fields from LeadAnswers and their Question semantic types. It generates a deterministic summary and exposes a `wa.me` link when the Lead has a `CONTACT_PHONE` answer. Phone normalization keeps only digits and does not add a country code automatically.

The public submission endpoint has a simple in-memory rate limit for the first pilot. It is not a distributed limiter and should be revisited before scaling horizontally.

Refresh tokens, cookies, password reset, public signup UI, official WhatsApp Business API integration, and advanced CRM features are intentionally not implemented yet.
