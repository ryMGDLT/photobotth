# AGENTS.md

This document defines the engineering standards that all AI agents must follow inside `cmth_policiesv2`.

## Core Principles

- Build using a feature-based architecture.
- Keep business logic out of UI components.
- Prefer server-side execution for sensitive logic, database access, and privileged operations.
- Use strict TypeScript. Avoid `any`.
- Keep functions small, composable, and testable.
- Favor clarity over cleverness.
- Do not introduce duplicate logic across features. Extract shared code only when it is truly shared.
- Validate all external input at the boundary.
- Prisma is the only database access layer.
- PostgreSQL is the target database and schema design should follow relational best practices.

## Required Stack

- Framework: Next.js with App Router
- Language: TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Validation: Zod
- API Style: Next.js Route Handlers
- Authentication and authorization:
  Follow the project-approved auth approach, and enforce authorization in the server layer.

## Feature-Based Folder Structure

All domain code must live under `features/`. The project follows standard Next.js structure with domain features at the root level alongside `app/`, `components/`, `lib/`, and `prisma/`.

```text
cmth_policiesv2/
  prisma/
    schema.prisma
    migrations/
    seed.ts
  app/
    api/
      health/route.ts
      docs/route.ts
      policies/route.ts
    (dashboard)/
    layout.tsx
    page.tsx
    login/
    policy/
    profile/
    register/
  features/
    policy/
      components/
        add-policy-dialog.tsx
        policy-app.tsx
      controllers/
        policy.controller.ts
      dto/
        create-policy.dto.ts
        update-policy.dto.ts
        policy-response.dto.ts
      repositories/
        policy.repository.ts
      routes/
        policy.route.ts
      services/
        policy.service.ts
      schemas/
        policy.schema.ts
      types/
        policy.types.ts
      utils/
        policy.mapper.ts
      __tests__/
        policy.service.test.ts
    system/
      components/
        SwaggerUi.tsx
      controllers/
        health.controller.ts
        docs.controller.ts
      dto/
        health-response.dto.ts
      routes/
        health.route.ts
        docs.route.ts
      services/
        health.service.ts
        swagger.service.ts
  components/
    mode-toggle.tsx
    notification-bell.tsx
    policy-image-viewer.tsx
    theme-provider.tsx
    ui/
      (shadcn/ui components)
  hooks/
    use-idle-timer.tsx
    use-media-query.ts
  lib/
    prisma.ts
    logger.ts
    asset-auth.ts
    swagger.ts
    utils.ts
  middleware.ts
```

## Layer Responsibilities

### `routes/`

- Define HTTP entry points for a feature.
- Connect Next.js route handlers to controllers.
- Do not place business logic here.
- Do not query Prisma directly here.

### `controllers/`

- Accept request context from route handlers.
- Parse and pass validated input to services.
- Translate service results into HTTP responses.
- Handle expected errors using the shared error format.

### `services/`

- Own business logic and use-case orchestration.
- Coordinate repositories, authorization rules, and domain workflows.
- Must not depend on UI code.
- Must not return raw Prisma models directly if a DTO or mapper is needed.

### `repositories/`

- Encapsulate all Prisma database access.
- One repository per aggregate or feature area when practical.
- Keep queries explicit, typed, and minimal.
- No HTTP objects or `NextRequest` usage here.

### `dto/`

- Define request and response contracts.
- DTOs should shape data for transport, not persistence.
- Keep DTO names explicit and feature-scoped.

### `middleware/`

- Feature-specific guards, permission checks, request preprocessing, or reusable route-level concerns.
- Global cross-cutting middleware belongs in root `middleware.ts`.

### `schemas/`

- Zod schemas for validation.
- Request validation must happen before controller logic proceeds.
- Reuse schemas as the single source of truth for DTO inference when possible.

## Dependency Direction

Allowed direction:

`route -> controller -> service -> repository -> prisma`

Rules:

- Controllers may call services only.
- Services may call repositories and shared libraries.
- Repositories may call Prisma only.
- Repositories must not call services.
- UI components must never import repositories directly.
- Route handlers must never contain business rules beyond simple request wiring.

## Next.js Standards

- Use the App Router.
- Prefer Server Components by default.
- Use Client Components only when browser APIs, local state, or interactive behavior require them.
- Keep `page.tsx` and `layout.tsx` thin.
- Fetch data on the server whenever possible.
- Mutations should go through route handlers or approved server-side action patterns used by the project.
- Do not expose secrets, Prisma access, or sensitive business rules to the client.
- Use route groups and nested layouts intentionally, not excessively.
- Co-locate feature UI near the feature when it is domain-specific. Place generic UI in `components/`.

## API and Route Handler Standards

- Every route handler must validate input.
- Return consistent JSON response shapes.
- Use proper HTTP status codes.
- Never leak raw database errors to clients.
- Keep route files minimal and delegate to feature routes/controllers.
- Prefer one route file per resource path.

Example flow:

```ts
// app/api/policies/route.ts
import {
  createPolicyHandler,
  listPoliciesHandler,
} from "@/features/policy/routes/policy.route";

export const GET = listPoliciesHandler;
export const POST = createPolicyHandler;
```

## Prisma and PostgreSQL Standards

- Use a single Prisma client instance from `lib/prisma.ts`.
- Never instantiate PrismaClient in multiple files.
- Model relations explicitly and index columns used for filtering, joins, and sorting.
- Use transactions for multi-step writes that must succeed or fail together.
- Select only the fields needed.
- Avoid unbounded queries. Always paginate list endpoints.
- Use soft deletes only when the domain requires audit retention.
- Store timestamps consistently with `createdAt` and `updatedAt`.
- Prefer UUIDs or project-approved identifiers for primary keys.
- Keep Prisma schema names aligned with the domain language.
- Run schema changes through Prisma migrations only.

Example Prisma singleton:

```ts
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

## Validation Rules

- Use Zod for request params, query params, and body validation.
- Validate at the boundary before invoking service logic.
- Infer TypeScript types from Zod schemas where practical.
- Sanitize and normalize user input when needed.

Example:

```ts
import { z } from "zod";

export const createPolicySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  isActive: z.boolean().optional(),
});

export type CreatePolicyDto = z.infer<typeof createPolicySchema>;
```

## Error Handling

- Use a shared application error type.
- Services throw typed domain or application errors.
- Controllers convert known errors into stable HTTP responses.
- Do not swallow errors silently.
- Log unexpected server errors with enough context for debugging, without exposing secrets.

Recommended error categories:

- `ValidationError`
- `UnauthorizedError`
- `ForbiddenError`
- `NotFoundError`
- `ConflictError`
- `DatabaseError`
- `InternalServerError`

## Naming Conventions

- Files: kebab-case for folders, `feature.role.ts` for source files where helpful
- Components: PascalCase
- Variables and functions: camelCase
- Types, interfaces, classes, enums: PascalCase
- Constants: UPPER_SNAKE_CASE for true constants, otherwise descriptive camelCase
- DTOs must end with `Dto` only when used as a type name, not necessarily in filenames

Examples:

- `policy.service.ts`
- `policy.repository.ts`
- `create-policy.dto.ts`
- `policy.schema.ts`
- `PolicyTable.tsx`

## Service Design Rules

- One service method per use case.
- Services should express intent clearly: `createPolicy`, `updatePolicyStatus`, `archivePolicy`.
- Do not create god services.
- Extract shared domain helpers when service files grow beyond a reasonable size.
- Keep side effects explicit.

## Repository Rules

- Repositories must be persistence-focused only.
- Keep methods narrow and intention-revealing.
- Do not embed business decisions in query methods unless it is purely persistence-related.

Examples:

- `findById`
- `findBySlug`
- `findManyPaginated`
- `create`
- `updateById`
- `deleteById`

## DTO and Mapping Rules

- Never expose database internals directly if the API contract should be different.
- Use mappers when transforming Prisma results into response DTOs.
- Keep response DTOs stable even if the database shape evolves.

## Middleware Rules

- Use root `middleware.ts` for cross-app concerns like auth redirects, locale, or request-wide checks.
- Use feature middleware for resource-specific guards or reusable policy checks.
- Middleware should stay focused and avoid hidden mutations.

## State and UI Rules

- Keep domain logic out of React components.
- Use server data loading whenever possible.
- Client state should be UI-focused, not business-rule-focused.
- Forms should map to DTOs and validated API contracts.
- Shared presentational components belong in `components/`.

## Security Rules

- Never trust request input.
- Enforce authorization on the server.
- Do not expose stack traces or raw Prisma errors to the client.
- Use environment variables through a validated env module.
- Protect sensitive endpoints against unauthorized access.
- Avoid over-fetching sensitive columns.

## Performance Rules

- Paginate list endpoints.
- Add indexes for frequent query patterns.
- Avoid N+1 query patterns.
- Use selective `select` and `include`.
- Cache only where correctness is preserved.
- Keep bundle size small by limiting client components and heavy client-only libraries.

## Testing Standards

- Unit test service logic.
- Integration test repositories and route handlers where feasible.
- Mock only true external boundaries.
- Cover validation, success cases, authorization failures, and edge cases.

Minimum expectations per feature:

- Service tests for core use cases
- Validation tests for input schemas
- Route or controller tests for major endpoints

## Code Quality Standards

- Use ESLint and Prettier project rules.
- Keep imports clean and ordered.
- Delete dead code.
- Avoid large files when decomposition would improve readability.
- Prefer explicit return types for public functions and exported methods.
- Document non-obvious decisions with short comments only when needed.

## Agent Execution Rules

All AI agents working in this project must:

- Follow the folder boundaries above.
- Add new code to the correct feature instead of a generic dump folder.
- Reuse existing shared utilities before creating new ones.
- Create DTOs, services, repositories, and schemas for new features when applicable.
- Avoid mixing controller, service, and repository responsibilities.
- Update Prisma schema and migrations together for database changes.
- Keep route handlers thin.
- Preserve type safety end to end.
- Add or update tests when changing behavior.
- Avoid broad refactors unless explicitly requested.
- Prefer incremental, reviewable changes.

## Suggested Feature Template

```text
features/<feature-name>/
  components/
    (optional UI components specific to this feature)
  controllers/
    <feature-name>.controller.ts
  dto/
    create-<feature-name>.dto.ts
    update-<feature-name>.dto.ts
    <feature-name>-response.dto.ts
  repositories/
    <feature-name>.repository.ts
  routes/
    <feature-name>.route.ts
  services/
    <feature-name>.service.ts
  schemas/
    <feature-name>.schema.ts
  types/
    <feature-name>.types.ts
  utils/
    <feature-name>.mapper.ts
  __tests__/
    <feature-name>.service.test.ts
```

## Reference Implementation Pattern

```ts
// route -> controller -> service -> repository

// controller
export async function createPolicyController(request: Request) {
  const body = await request.json();
  const dto = createPolicySchema.parse(body);
  const policy = await policyService.createPolicy(dto);

  return Response.json({ data: policy }, { status: 201 });
}
```

```ts
// service
export async function createPolicy(dto: CreatePolicyDto) {
  // business validation and orchestration
  return policyRepository.create(dto);
}
```

```ts
// repository
export async function create(data: CreatePolicyDto) {
  return prisma.policyDocument.create({
    data,
    select: {
      id: true,
      title: true,
      createdAt: true,
    },
  });
}
```

## Final Rule

When there is a conflict between speed and maintainability, choose maintainability.
When there is a conflict between convenience and security, choose security.
When there is a conflict between cleverness and clarity, choose clarity.
