# Verification: HR platform authentication and employee backend

**Date:** 2026-10-17  
**Request:** Diagnose and fix the Better Auth client-IP warning and PostgreSQL-backed login rate-limit failure.

## Findings

- The supplied nested error, `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`, means node-postgres received a non-string password while opening its PostgreSQL connection. The `INSERT` or readiness `SELECT` did not fail due to SQL syntax, table permissions, or a missing table; the connection failed before PostgreSQL could execute those statements.
- The deployed process's revision and injected environment are unavailable, so the exact source of its invalid password setting cannot be identified. The repository now requires a non-empty `DATABASE_URL` at backend startup and reports a credential-safe hint for this SCRAM failure.
- The Better Auth warning is a separate configuration issue: the request did not provide a client IP that Better Auth could trust. Production now requires `BETTER_AUTH_IP_ADDRESS_HEADERS`; the real production ingress/header chain still needs deployment-side verification.

## Changes in the workspace

- Added startup checks for `DATABASE_URL`, `AuthRateLimits` visibility, and SELECT/INSERT/UPDATE privileges before the backend listens.
- Added persistent rate-limit storage and safer retry timing for concurrent requests. Migration `0011_email_recovery_employee_fields_and_login_limits.sql` creates the required table.
- Added production trusted-IP configuration checks and a development entrypoint that enables the documented localhost fallback.
- Added credential-safe database connection diagnostics and operational guidance in `docs/backend-auth-operations.md`.

## Verification evidence

- Local PostgreSQL 18 was created as an isolated cluster on `127.0.0.1:5433`, using an ignored `.env.local` connection string and ignored `.local-postgres` data directory. The existing PostgreSQL service on port 5432 was left untouched.
- `npm run db:setup` created `hr_platform_dev` and applied all migrations. Backend startup passed the `AuthRateLimits` readiness check, and `GET /health` returned `{"status":"ok"}`.
- The Postman CLI smoke harness asserted HTTP 200 and verified that `user.email` in the response matched the temporary test address for both signup and sign-in; its recorded summary marked both assertions as passed. It created the account, then signed in with the same password. The successful sign-in response shows Better Auth accepted the stored credential. The sign-in rate-limit bucket was 0 before that request and 1 afterward.
- A fresh review caught that the first cleanup missed the signup rate-limit bucket. That bucket was removed; a final database aggregate confirmed zero temporary users, employees, or rate-limit rows. No auth token or secret was included in the recorded output.
- Before the final documentation-only edits, workspace lint, typecheck, production build, 23 backend tests, and `git diff --check` passed. The earlier trusted-proxy IP probe also passed. The current edits only update documentation and work logs.

## Remaining deployment check

The local development flow is verified. The original runtime remains unverified because its environment and ingress are not available. Confirm that deployment supplies a valid string password through `DATABASE_URL` (or the configured PostgreSQL password source), that migrations are applied, and that `BETTER_AUTH_IP_ADDRESS_HEADERS` matches a client-IP header forwarded by the trusted ingress. Never log the connection URL or credentials.

## Runtime state after verification

- The backend test server was stopped.
- The isolated PostgreSQL cluster remains running on `127.0.0.1:5433` for local development.
- The temporary signup-smoke account and its rows were removed before the later local admin setup.

## Local admin login setup follow-up

- The isolated `hr_platform_dev` database was empty before setup. The demo reset script was not used because it truncates the database and is restricted to a different database name.
- Added one demo HR department, HR Manager position, and active demo employee with its fixture personal data, contract, and position history. The employee uses the configured seed-admin company email; no production database was touched.
- Ran the existing `seed:auth` workflow to create the password account and verify the email. The command output was captured and reduced to a success flag; the password, database URL, and auth token were not printed.
- Postman CLI sent one login request to `http://127.0.0.1:4199/api/auth/sign-in/email`. The HTTP 200 assertion passed, the response user email matched the configured account, and the sign-in rate-limit count changed from 0 to 1. Postman exited with code 0.
- The backend was stopped after verification. The seed admin and one demo HR employee remain in the isolated local database for future login.
