# LeadFlow - Architecture

## Current Repository State

The project currently contains empty folders:

- `backend/`
- `frontend/`
- `docs/`

No frontend or backend framework is configured yet. No package manager, lockfile, Docker configuration, database schema, or application code was found.

## Proposed Repository Structure

```text
leadflow/
  backend/
    src/
      app.module.ts
      main.ts
      common/
      config/
      database/
      modules/
        auth/
        companies/
        users/
        flows/
        questions/
        leads/
        public-flows/
    test/
  frontend/
    app/
    components/
    features/
      auth/
      flows/
      leads/
      public-flow/
    lib/
    styles/
  docs/
  docker-compose.yml
  AGENTS.md
```

## Backend Stack

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- Docker Compose for local infrastructure

The ORM/migration tool still needs to be decided before implementation.

## Backend Layering

Use a consistent layered structure:

```text
Controller -> Service -> Repository -> Database
```

Controllers should handle HTTP concerns only. Business rules belong in services. Repositories encapsulate persistence access. DTOs must be used for request and response boundaries.

## Proposed Backend Modules

### `auth`

- Login.
- Password handling.
- JWT/session strategy.
- Auth guards.

### `companies`

- Company lifecycle.
- Tenant metadata.
- WhatsApp phone configuration.

### `users`

- Company users.
- User roles and status.

### `flows`

- Authenticated flow management.
- Publish/unpublish.
- Slug management.

### `questions`

- Flow questions.
- Question ordering.
- Question options.
- Question type validation.

### `public-flows`

- Public flow lookup by slug.
- Public answer submission.
- Public DTO validation.

### `leads`

- Lead inbox.
- Lead details.
- Lead summary generation.
- WhatsApp message/link generation.

### `common`

- Error filters.
- Validation pipes.
- Shared decorators.
- Shared guards.
- Pagination helpers.

### `database`

- Database connection.
- Migrations.
- Repository providers.

## Multi-Tenancy Rule

`Company` is the tenant boundary. Private routes must always derive `companyId` from the authenticated user/session, never from client-provided input.

All tenant-owned data must be scoped by `companyId`, including:

- users;
- flows;
- questions through flows;
- question options through questions;
- leads;
- lead answers through leads.

Public flow routes may resolve a company through a published flow slug, but they must expose only public-safe data.

## Frontend Organization

Use Next.js with feature-oriented folders:

```text
frontend/
  app/
    login/
    dashboard/
    flows/
    leads/
    c/[slug]/
  components/
    ui/
    layout/
  features/
    auth/
    flows/
    leads/
    public-flow/
  lib/
    api/
    auth/
    formatting/
  styles/
```

Keep API access centralized in `lib/api`. Keep page components thin and move domain UI into `features/*`.

## Security Baseline

- Validate all DTOs.
- Centralize error handling.
- Keep credentials in environment variables.
- Do not version secrets.
- Protect private routes with authentication.
- Enforce tenant isolation in services/repositories.
- Validate public submissions by flow and question definitions.
- Avoid exposing internal database models directly.

## Decisions Needed Before Implementation

- Package manager: npm, pnpm, or yarn.
- ORM/migration tool: Prisma or TypeORM are the likely candidates.
- Auth approach: JWT in httpOnly cookies, server sessions, or another strategy.
- Monorepo tooling: simple separate apps first, or workspace tooling.
- UI library/design system: custom components, shadcn/ui, or another option.
- Deployment shape for the first VPS: single Docker Compose stack with frontend, backend, PostgreSQL, and later Nginx.
