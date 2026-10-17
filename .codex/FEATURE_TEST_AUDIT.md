# Feature test audit

Date: 2026-10-17

## Codebase map

- `apps/frontend`: Next.js App Router UI. Routes are `/login` and `/employees`; employee screens, import/export, drawers, modals, filtering, and notifications live in `src/components` and `src/hooks`.
- `apps/backend`: Express API. Better Auth and password recovery are in `src/modules/auth`; employee routes/controllers/services/repositories are in `src/modules/employees`. Drizzle schema and migrations are under `src/db` and `drizzle`.
- `packages/shared`: employee contracts/types and shared Thai-name/date helpers.
- API startup checks database URL, trusted client IP configuration, and rate-limit table readiness before listening. Employee routes require an HR session. Frontend `/api` calls are proxied to the backend.

## Verification run

| Check | Result | What it establishes |
| --- | --- | --- |
| Workspace tests | Passed: frontend 4, backend 36, shared 4 | Frontend config and backend auth/config/recovery/sensitive-value cases pass; recovery includes employee-code and User ID parsing. |
| `node --import tsx --test packages/shared/src/lib/employment-dates.test.ts` | Passed: 4 | Bangkok date boundary, 120-day probation calculation, invalid date rejection, and Buddhist-year formatting pass. |
| `npm.cmd run typecheck --workspaces --if-present` | Passed | All three workspaces typecheck. |
| `npm.cmd run lint --workspaces --if-present` | Passed | All three workspaces lint. |
| `npm.cmd run build` | Passed | Shared and backend TypeScript builds and Next.js production build complete. |
| Read-only recovery identity lookup | Passed | Temporarily started the isolated database on `127.0.0.1:5433`; both the configured User ID and employee code resolved to the same eligible account. Database was stopped afterward. No OTP request or email was sent. |

The result is 44 passing automated tests. This is not end-to-end coverage of every feature.

## Feature coverage and remaining cases

| Feature area | Evidence in current tests | Edge cases still needing integration or focused tests |
| --- | --- | --- |
| Frontend/backend URL and runtime configuration | URL normalization, malformed origin, production URL requirements; auth runtime and database config | Run frontend against a live backend and test proxy/auth cookie behavior. |
| HR authorization and client IP/rate-limit configuration | Role guard, forwarded header/CIDR parsing, production fail-closed config, retry window math | Authenticated and unauthorized HTTP requests; PostgreSQL persistence, concurrent requests, and actual proxy headers. |
| Password recovery request and email delivery | Generic anti-enumeration response, malformed contact, request errors, body size/JSON errors, OTP persistence and cleanup, delivery failure, request limits, employee-code/User ID parsing and live DB identity resolution | OTP verification expiry/replay; reset-token expiry/replay; password mismatch/length limits; session revocation; Resend delivery against a test inbox. |
| Employee sensitive data | Masking, blank/exact-mask preservation, malformed mask input, national-ID normalization | Verify HTTP authorization and that create/update/list/reveal persist and return the expected private values. |
| Employee list, search, filters, pagination | Code inspection only | Empty results, whitespace/multi-term search, combinations of filters, invalid/out-of-range page, page boundaries, and count consistency. |
| Employee create/edit and form options | Code inspection only | Required/optional fields, Thai-name validation, invalid/duplicate identifiers/emails, salary limits, date boundaries, department-position mismatch, supervisor self-reference, and DB uniqueness conflicts. |
| Contract lifecycle and notifications/history | Code inspection only | Probation approve/reject, renew date boundary, due-date expiry, invalid transitions, contract deletion/locking, notifications/history after each transition. |
| Employee soft delete/trash/restore | Code inspection only | Self-delete denial, active/fixed-term eligibility, seven-day restore boundary, repeated restore/delete, and pruning behavior. |
| CSV/XLSX import and failed-row repair | Code inspection only | Empty/malformed files, header-only and duplicate headers, unknown columns, CSV/XLSX parity, 100 MiB exact/over limit, partial failure, and edited/dismissed draft persistence. |
| XLSX export | Code inspection only | Filtered all-record result, selected/empty columns, sensitive/action exclusion, no matching records, and download error handling. |
| Login and employee UI flows | Production build and code inspection only; no browser test suite is configured | Login failure/loading/reset navigation; unauthenticated redirect; modal/drawer keyboard use; network errors; overlapping search requests and stale responses. |
| Migrations, seed, and deployment startup | Build only; no live database check | Apply all migrations to a disposable PostgreSQL instance and smoke-test startup, health, auth, and employee endpoints. |

## Limits

Password recovery now accepts the account User ID and employee code as well as email/phone, and verification preserves mixed-case User IDs. No database rows were modified and no email was sent. Full HTTP recovery, browser interactions, and real email delivery remain unverified.
