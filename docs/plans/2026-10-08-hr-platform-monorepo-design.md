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
