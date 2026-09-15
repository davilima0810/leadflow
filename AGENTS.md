# LeadFlow - Codex Working Guide

## Product Direction

LeadFlow is a B2B SaaS for generic conversational lead qualification. The priority is reaching the first paying customer quickly, without overengineering.

## Current Rule

Work incrementally. Do not implement broad product areas unless the task explicitly asks for them.

## Stack

- Monorepo: pnpm workspaces.
- Frontend app: `apps/web`, Next.js, TypeScript, App Router.
- Backend app: `apps/api`, NestJS, Node.js, TypeScript.
- Database: PostgreSQL.
- Local infrastructure: Docker and Docker Compose.
- Future production: VPS and Nginx.

Avoid Nx, Turborepo, Kubernetes, microservices, Kafka, RabbitMQ, Elasticsearch, WebSocket, Redis, AI, billing, and advanced automation until there is a concrete need.

## Repository Layout

- `apps/web`: the only frontend application.
- `apps/api`: the only backend application.
- `packages`: reserved for truly shared code created only when there is a concrete need.
- `docs`: product and technical documentation.

Do not place application code outside `apps/web` or `apps/api`.

## Backend Guidelines

- Follow `Controller -> Service -> Repository -> Database`.
- Keep business rules out of controllers.
- Use DTOs for input and output.
- Do not expose internal entities directly through API responses.
- Validate all request DTOs.
- Keep tenant isolation as a first-class requirement.
- Derive private `companyId` from authenticated context, not request bodies.
- Keep modules focused and cohesive.

## Frontend Guidelines

- Use feature-oriented organization.
- Keep pages thin.
- Centralize API calls.
- Build the actual app experience before marketing pages.
- Prefer simple, practical UI for repeated business workflows.

## Multi-Tenancy

`Company` is the tenant. Every private read/write for tenant-owned data must be scoped to the authenticated user's company.

Never allow a user from one company to access another company's flows, questions, leads, or answers.

## Documentation

Before significant implementation, keep these docs aligned:

- `docs/PRODUCT.md`
- `docs/MVP.md`
- `docs/ARCHITECTURE.md`
- `docs/DATABASE.md`

## Task Workflow

For each task:

1. Inspect existing code first.
2. State briefly what will change.
3. Keep edits scoped to the request.
4. Avoid unrelated refactors.
5. Justify new dependencies.
6. Run available lint, test, or build commands.
7. Report files changed, decisions made, and remaining risks.

## First MVP Bias

Prefer simple, shippable paths:

- `wa.me` links over official WhatsApp integrations.
- Linear flows before conditional branching.
- Basic lead inbox before CRM features.
- Docker Compose before complex infrastructure.
- pnpm workspaces without additional monorepo tooling.
