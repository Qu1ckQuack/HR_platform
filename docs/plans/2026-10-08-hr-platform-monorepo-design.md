# HR Platform Monorepo Design

## Approved scope

- Move the Next.js 16 application to `apps/frontend`.
- Add an independently runnable Express + TypeScript API at `apps/backend`.
- Keep PostgreSQL and Drizzle; share API contracts through `packages/shared`.
- Preserve the existing UI and in-progress CSV/XLSX import work.

## Backend boundaries

- Express owns Better Auth, employee APIs, database access, migrations, and authorization.
- The frontend calls the API using credentialed HTTP-only session cookies.
- CORS and Better Auth trusted origins use explicit frontend origins from environment settings.
- Employee APIs remain restricted to HR/Super Admin.
- Account security includes optional TOTP enrollment and a TOTP-only password reset.
- No backup codes or in-app Super Admin TOTP reset flow. Unenrolled or locked-out accounts
  require out-of-band operator recovery.

## Employee data

- `Employees`, `Contract`, and `PersonalData` receive UUID internal primary keys.
- Existing `EMP`/`CNT`/`PDT` values remain stable, unique public IDs used by the UI/API.
- All internal foreign keys and SQL functions migrate to UUIDs.
- CSV/XLSX import creates new employee records, validates rows on the server, rejects
  duplicates with row-level reasons, and can import other valid rows from the same file.
- Import does not provision login accounts.
- National ID and bank account are omitted from general employee responses and fetched
  through a dedicated HR-only endpoint when revealed in the employee drawer.

## Password reset and TOTP

- Users may enroll an authenticator later in account settings while signed in.
- Enrollment stores an encrypted TOTP secret and requires a valid code before activation.
- Reset uses account email, current TOTP, and a new password; it revokes existing sessions.
- Users without TOTP enrollment cannot self-service reset. Lost devices have no in-app
  recovery path by design.

## Verification

- Run ESLint, production builds for both apps, and TypeScript checks for frontend/backend.
- Preserve pre-existing changes and report any blocker caused by workspace permissions.
# 2026-10-17 approved revision

The current product direction supersedes the TOTP password recovery design below:

- Remove Authenticator/TOTP enrollment, recovery prompts, account settings links, and stored TOTP fields with a forward migration.
- Send email recovery OTPs through Resend. Requests accept a business/personal email or registered phone for an active HR employee; responses do not reveal whether an account exists. OTP verification returns a short-lived server token, then the user sets and confirms a new password.
- Persist the five-attempt login rate limit per client IP in PostgreSQL so it survives browser refreshes and service restarts.
- Protect employee pages by requiring a backend session. Employee import accepts CSV/XLSX up to 100 MiB and offers failed rows for edit or dismissal. Employee export expands names, department/position, and contract/probation dates into separate worksheet columns.
- Add emergency contact name to employee personal data and validate business email and phone formats at the API boundary.

Runtime configuration for email recovery requires `RESEND_API_KEY` and `RESEND_FROM` in the backend environment.
