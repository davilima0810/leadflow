# LeadFlow - MVP

## Goal

Build the smallest useful product that lets a company publish a conversational qualification flow and receive structured leads.

## MVP Capabilities

1. Company authentication.
2. Flow creation and configuration.
3. Question creation.
4. Question options for choice-based questions.
5. Flow publishing through a public slug.
6. Public visitor access without authentication.
7. Conversational answer collection.
8. Lead creation.
9. Lead answer persistence.
10. Structured lead summary generation.
11. WhatsApp redirect using `wa.me` with a pre-filled message.
12. Authenticated lead listing for the company.

## Suggested Implementation Phases

### Phase 1 - Foundation

- Create monorepo structure.
- Configure backend with NestJS, TypeScript, validation, and environment handling.
- Configure frontend with Next.js and TypeScript.
- Add PostgreSQL through Docker Compose.
- Define initial database schema and migration tooling.

### Phase 2 - Auth And Tenancy

- Company and user models.
- Login flow.
- Tenant-aware authenticated routes.
- Authorization guard ensuring company isolation.

### Phase 3 - Flow Management

- CRUD for flows.
- CRUD for questions.
- CRUD for question options.
- Publish/unpublish flow.
- Public flow lookup by slug.

### Phase 4 - Public Conversation

- Public conversational UI.
- Answer validation by question type.
- Lead and lead answer creation.
- Summary generation.
- WhatsApp link generation.

### Phase 5 - Lead Inbox

- Authenticated lead list.
- Lead detail view.
- Basic filtering by flow and creation date.

## Non-Goals For MVP

- Conditional questions beyond simple future-proof modeling.
- Official WhatsApp sending.
- Real-time updates.
- Advanced analytics.
- Billing.
- Multi-language UI unless required by the first customer.
