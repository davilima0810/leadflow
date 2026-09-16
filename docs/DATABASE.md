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

The implemented schema currently contains:

- `companies`;
- `users`;
- `UserRole`;
- `UserStatus`.
- `flows`;
- `questions`;
- `question_options`;
- `FlowStatus`;
- `QuestionType`;
- `QuestionSemanticType`;
- `leads`;
- `lead_answers`.

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
- `description`
- `status`
- `created_at`
- `updated_at`

Suggested statuses:

- `DRAFT`
- `PUBLISHED`

`flows.slug` is unique per Company through `company_id + slug`, not globally unique.

### questions

- `id`
- `flow_id`
- `label`
- `type`
- `semantic_type`
- `required`
- `position`
- `placeholder`
- `help_text`
- `created_at`
- `updated_at`

Questions are returned ordered by `position`. Reorder is performed through an atomic update scoped to the parent Flow and Company.

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

`questions.type` defines the technical answer format. `questions.semantic_type` defines what the answer represents for business use.

Initial semantic types:

- `NONE`
- `CONTACT_NAME`
- `CONTACT_PHONE`
- `CONTACT_EMAIL`

Compatibility rules:

- `CONTACT_NAME` requires `TEXT`;
- `CONTACT_PHONE` requires `PHONE`;
- `CONTACT_EMAIL` requires `EMAIL`;
- `NONE` is valid for any question type.

For the MVP, each Flow can have at most one question for each contact semantic type. Future semantic types may include examples such as budget, service, location, or company name, but they are intentionally not implemented yet.

### question_options

- `id`
- `question_id`
- `label`
- `value`
- `position`
- `created_at`
- `updated_at`

QuestionOptions are returned ordered by `position` and are deleted by cascade when their parent Question is deleted.

### leads

- `id`
- `company_id`
- `flow_id`
- `created_at`
- `updated_at`

`Lead` is the submission envelope. It intentionally does not store duplicated fixed semantic fields such as `name`, `email`, or `phone`. Those values are derived from `LeadAnswer` plus `Question.semanticType` when needed.

### lead_answers

- `id`
- `lead_id`
- `question_id`
- `value`
- `created_at`

`value` is stored as JSON to support all MVP question answer shapes with a simple model:

- strings for text, textarea, phone, email, date, time, and single choice;
- numbers for number questions;
- booleans for boolean questions;
- string arrays for multiple choice questions.

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
- unique `flows(company_id, slug)`.

Recommended indexes:

- `users.company_id`;
- `flows.company_id`;
- `questions.flow_id`;
- `question_options.question_id`;
- `leads.company_id`;
- `leads.flow_id`;
- `lead_answers.lead_id`;
- `lead_answers.question_id`.
