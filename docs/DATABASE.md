# LeadFlow - Initial Database Model

## Principles

- `company_id` is the tenant boundary for company-owned records.
- Private queries must always be scoped by authenticated `company_id`.
- Public routes must only expose published flow data required to answer a flow.
- Use Prisma migrations from the beginning.
- Prefer simple relational modeling before adding advanced workflow abstractions.
- Prisma is the official ORM for the LeadFlow API.
- Repositories encapsulate Prisma access.
- For the MVP, `users.email` is globally unique across all companies.
- Passwords are stored only as Argon2 hashes in `users.password_hash`.

## Current Implemented Schema

The first implemented migration contains only:

- `companies`;
- `users`;
- `UserRole`;
- `UserStatus`.

Flow, Question, Lead, and related tables are still planned, but not implemented yet.

## Initial Entities

### companies

- `id`
- `name`
- `slug`
- `whatsapp_phone`
- `created_at`
- `updated_at`

### users

- `id`
- `company_id`
- `name`
- `email`
- `password_hash`
- `role`
- `status`
- `created_at`
- `updated_at`

`password_hash` must never be returned by API responses.

Suggested roles:

- `ADMIN`
- `MEMBER`

Suggested statuses:

- `ACTIVE`
- `INACTIVE`

### flows

- `id`
- `company_id`
- `name`
- `slug`
- `status`
- `created_at`
- `updated_at`

Suggested statuses:

- `DRAFT`
- `PUBLISHED`
- `ARCHIVED`

### questions

- `id`
- `flow_id`
- `label`
- `type`
- `required`
- `position`
- `placeholder`
- `help_text`
- `created_at`
- `updated_at`

Suggested types:

- `TEXT`
- `TEXTAREA`
- `NUMBER`
- `PHONE`
- `EMAIL`
- `DATE`
- `TIME`
- `BOOLEAN`
- `SINGLE_CHOICE`
- `MULTIPLE_CHOICE`

### question_options

- `id`
- `question_id`
- `label`
- `value`
- `position`
- `created_at`
- `updated_at`

### leads

- `id`
- `company_id`
- `flow_id`
- `name`
- `phone`
- `email`
- `summary`
- `source`
- `created_at`
- `updated_at`

`name`, `phone`, and `email` may be derived from answers when the flow contains matching question types.

### lead_answers

- `id`
- `lead_id`
- `question_id`
- `question_label`
- `answer_value`
- `created_at`

Store `question_label` as a snapshot so historical leads remain readable if a question label changes later.

## Conceptual Relationships

```text
Company
  has many Users
  has many Flows
  has many Leads

Flow
  belongs to Company
  has many Questions
  has many Leads

Question
  belongs to Flow
  has many QuestionOptions
  has many LeadAnswers

Lead
  belongs to Company
  belongs to Flow
  has many LeadAnswers
```

## Future Conditional Logic

Do not implement conditional branching in the MVP unless needed by the first customer. To avoid blocking future evolution, keep question ordering explicit and avoid hardcoding linear logic in persistence.

Future conditional rules could be modeled separately:

```text
question_conditions
  id
  flow_id
  source_question_id
  operator
  expected_value
  target_question_id
```

This should be added only when the product needs it.

## Indexes And Constraints

Recommended initial constraints:

- unique `companies.slug`;
- unique `users.email`;
- unique `flows.slug`;
- unique `questions(flow_id, position)`;
- unique `question_options(question_id, position)`.

Recommended indexes:

- `users.company_id`;
- `flows.company_id`;
- `questions.flow_id`;
- `question_options.question_id`;
- `leads.company_id`;
- `leads.flow_id`;
- `lead_answers.lead_id`;
- `lead_answers.question_id`.

If public URLs use `leadflow.com/c/:slug`, `flows.slug` should be globally unique. If URLs later include company slug and flow slug, uniqueness can become `company_id + slug`.
