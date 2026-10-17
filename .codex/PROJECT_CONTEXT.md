# Project context

## Current architecture

This repository is an npm-workspaces monorepo for an HR management application:

- `apps/frontend`: Next.js App Router application. Routes and layouts are under `apps/frontend/src/app`; shared UI and employee screens are under `apps/frontend/src/components`.
- `apps/backend`: Express API using Better Auth, Drizzle ORM, and PostgreSQL. Authentication code is under `apps/backend/src/lib` and `apps/backend/src/modules/auth`; employee endpoints and business logic are under `apps/backend/src/modules/employees`.
- `packages/shared`: shared employee types and validation/helpers consumed by frontend and backend.

Database schema and migrations are in `apps/backend/drizzle`. Workspace commands are defined in the root `package.json`; database setup runs through `npm run db:setup`.

For deployment, host the Next.js frontend on Vercel and run the Express API as a Node.js container using `apps/backend/Dockerfile`. The frontend proxies `/api` requests to the backend origin; keeping the API outside Vercel Functions preserves the employee import path beyond the Functions request-body limit. See `docs/deployment-vercel.md` for environment configuration and preview checks.

## Authentication and database notes

- Better Auth is configured in `apps/backend/src/lib/auth.ts`.
- PostgreSQL connection configuration and startup readiness checks are in `apps/backend/src/lib/database-connection-config.ts`, `apps/backend/src/lib/auth-rate-limit-readiness.ts`, and `apps/backend/src/server.ts`.
- Rate-limit persistence and trusted client-IP configuration are in `apps/backend/src/lib/auth-rate-limit-storage.ts` and `apps/backend/src/lib/auth-ip-config.ts`.
- The `AuthRateLimits` table is created by migration `0011_email_recovery_employee_fields_and_login_limits.sql`.
- Keep secrets in ignored environment files; never commit or print database URLs, auth secrets, or access tokens. Production must configure `DATABASE_URL` and the trusted ingress client-IP header as described in `docs/backend-auth-operations.md`.

## Development conventions

- The project uses strict TypeScript. Follow the existing module boundaries and workspace scripts.
- Before changing Next.js code, read the relevant local Next.js guide in `node_modules/next/dist/docs/`, as required by `AGENTS.md`.
- `.agent/PROJECT_CONTEXT.md` contains older single-app history. Use the current monorepo tree and this file for the active architecture; update this context when the architecture changes.
- Append a concise dated entry to `.codex/WORK_LOG.md` after meaningful work. The existing `.agent/WORK_LOG.md` also remains part of the project's recorded history.
