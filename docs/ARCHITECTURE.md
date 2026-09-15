# LeadFlow - Architecture

## Current Repository State

The project is in foundation mode. The official architecture is a simple monorepo using pnpm workspaces.

The main applications must live only in `apps/web` and `apps/api`.

## Official Repository Structure

```text
leadflow/
  apps/
    web/
      src/
        app/
        components/
        features/
        lib/
        styles/
      public/
    api/
      src/
        main.ts
        app.module.ts
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
  packages/
  docs/
    PRODUCT.md
    MVP.md
    ARCHITECTURE.md
    DATABASE.md
  AGENTS.md
  package.json
  pnpm-workspace.yaml
  docker-compose.yml
  .env.example
  .gitignore
  README.md
```

## Workspace

- Package manager: pnpm.
- Workspace: pnpm workspaces.
- Workspace configuration: `pnpm-workspace.yaml`.
- Workspace packages:
  - `apps/*`
  - `packages/*`
- Additional monorepo tooling: none initially.

Do not add Nx or Turborepo at this stage. The monorepo should stay simple until there is a concrete need for extra tooling.

## Applications

### `apps/web`

The frontend application lives exclusively in `apps/web`.

Stack:

- Next.js;
- TypeScript;
- App Router.

Conceptual structure:

```text
apps/web/
  src/
    app/
    components/
    features/
    lib/
    styles/
  public/
```

Future application areas:

- login;
- dashboard;
- flows;
- leads;
- public flow at `/c/[slug]`.

Pages should stay thin. Domain UI should live under `src/features/*`, shared UI under `src/components/*`, and API/client utilities under `src/lib/*`.

### `apps/api`

The backend application lives exclusively in `apps/api`.

Stack:

- Node.js;
- NestJS;
- TypeScript;
- Prisma ORM;
- PostgreSQL.

Conceptual structure:

```text
apps/api/
  src/
    main.ts
    app.module.ts
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
```

The business modules listed above represent the planned organization. Do not create them before they are needed by an implementation task.

## Packages

The `packages/` directory is reserved for code that is truly shared between applications.

Do not create shared packages prematurely. When there is a concrete need to share types, schemas, validation logic, or configuration between `apps/web` and `apps/api`, create a focused package for that purpose.

## Backend Layering

Use a consistent layered structure:

```text
Controller -> Service -> Repository -> Database
```

Controllers should handle HTTP concerns only. Business rules belong in services. Repositories encapsulate persistence access. DTOs must be used for request and response boundaries.

## Planned Backend Modules

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
- Prisma migrations.
- Repository providers.

Prisma must stay encapsulated in the persistence layer. Controllers must not access Prisma directly. Services should depend on explicit repositories, such as `CompanyRepository` and `UserRepository`, instead of knowing Prisma APIs.

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

For the MVP, user email is globally unique. The same email cannot initially belong to two different companies.

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

- Auth approach: JWT in httpOnly cookies, server sessions, or another strategy.
- UI library/design system: custom components, shadcn/ui, or another option.
- Deployment shape for the first VPS: single Docker Compose stack with `apps/web`, `apps/api`, PostgreSQL, and later Nginx.
