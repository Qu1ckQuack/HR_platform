# Work log

## 2026-09-24 - Aligning illustration text with feature labels

- Added a shared inner width for the company branding, descriptive text, and
  feature-circle row.
- Removed the fixed left padding so each text line starts on the same vertical
  axis as the first label below the circles.
- Verification: source diagnostics passed.

## 2026-09-24 - Centering the login illustration card

- Extended the translucent white border to contain the full illustration
  content, including the feature circles and labels.
- Replaced the fixed card height with content-driven sizing and centered the
  card within the desktop left section.
- Verification: source diagnostics passed.

## 2026-09-24 - Adding translucent gradient to login content card

- Added a white translucent gradient inside the `InvCard` border so the
  office background remains visible through the card.
- Added a light border, shadow, and minimal backdrop blur to preserve text
  readability without hiding the image.
- Verification: source-only styling adjustment.

## 2026-09-24 - Layering office background on login panel

- Added `public/office.png` as a full-cover background image for the desktop
  login panel.
- Added a translucent overlay and placed `InvCard` in a positioned content
  layer above the background.
- Used `fill`, `priority`, and responsive `sizes` so the LCP image remains
  dimensioned and loads as the background layer.
- Verification: source diagnostics, `npm run lint`, and `npm run build` pass.

## 2026-09-24 - Labeling login feature circles

- Added visible text labels below each round feature icon on the login
  illustration: employees, working time, payroll, and performance.
- Structured each icon/label as a vertical group so labels remain directly
  underneath their corresponding circle.
- Verification: source-only UI change; diagnostics and lint/build should be
  run before release.

## 2026-09-24 - Sizing and fading office login image

- Made the desktop office-image section and image wrapper use full height and
  width.
- Applied `opacity-60` to the office image while preserving eager LCP loading.
- Verification: source-only styling change; diagnostics and lint/build should
  be run before release.

## 2026-09-24 - Fixing office image import

- Fixed the login office image by using the supported static `public` URL
  `/office.png` instead of the invalid `@/public/office.png` alias.
- Added explicit image dimensions and layout classes to reserve space and
  prevent image layout shift.
- Verification: build validation completed below.

## 2026-09-24 - Restructuring source by feature

- Moved employee UI into `src/features/employees` and auth UI into
  `src/features/auth`.
- Added shared `Skeleton`, `StatusBadge`, and `InfoSection` components under
  `src/shared/components`.
- Extracted the employee model into the feature-level `types.ts` file and
  kept App Router pages as thin route entrypoints.
- Verification: source diagnostics pass; lint/build validation completed below.

## 2026-09-24 - Adding employee table skeleton loading

- Replaced the single loading message row with ten table-shaped skeleton rows
  that preserve the final table structure and reserved height.
- Added a reduced-motion fallback for the skeleton pulse animation.
- Verification: source-only UI change; diagnostics and lint/build should be run
  before release.

## 2026-09-25 - Updating Thai and logo typography

- Switched the shared document font to IBM Plex Sans Thai with Inter reserved
  for the GH logo mark.
- Added a reusable white WebKit text outline to both login-page GH marks.
- Verification: `npm run lint` and `npm run build`.

## 2026-09-25 - Limiting logo outline to G

- Split the GH mark into individual letters so the white WebKit outline applies
  only to G while H remains unoutlined.
- Verification: `npm run lint`.

## 2026-09-24 - Preventing employee page layout shifts

- Identified the primary shifts as font metric changes from the Latin-only
  Geist font falling back for Thai text, plus table height changes when the
  loading row is replaced by ten database rows.
- Switched the global UI font to a stable system Thai-capable stack and set
  the document language to Thai.
- Reserved the employee table viewport height while data/search/filter requests
  are loading.
- Verification: source-only layout stabilization; diagnostics and lint should
  be run before release.

## 2026-09-24 - Stabilizing Font Awesome icon dimensions

- Assigned explicit width and height utilities to every `FontAwesomeIcon` in
  the employee page.
- Replaced icon padding-based spacing with fixed dimensions and margins where
  needed, preventing layout shifts during reload.
- Verification: source-only styling adjustment.

## 2026-09-24 - Adding employee search and status filters

- Connected the status pills and search field to `GET /api/employees` query
  parameters, so filtering searches all database records before pagination.
- Search covers employee ID, Thai name, company email, department, position,
  and employment type.
- Replaced employee initials avatars with a consistent person silhouette icon
  in both the table and detail drawer.
- Verification: source diagnostics and lint/build validation completed.

## 2026-09-24 - Aligning employee table action icons

- Right-aligned the four employee action icons and preserved the table padding
  so the final icon has the same desktop edge spacing as the employee ID
  column.
- Verification: source-only UI adjustment; no behavior changes.

## 2026-09-24 - Adding employee pagination

- Added fixed 10-record pagination to `GET /api/employees?page=N`.
- Added pagination metadata including total records, total pages, and status
  counts.
- Connected the employee table footer to previous/next page controls and
  database-backed page counts.
- Verification: source diagnostics, `npm run lint`, and `npm run build` pass.

## 2026-09-23 - Connecting employee page to PostgreSQL API

- Added the dynamic `GET /api/employees` Route Handler with Drizzle joins for
  employees, personal info, contracts, current position history, positions,
  and departments.
- Replaced the employee page mock data with client-side loading from the API,
  including loading, empty, and error states.
- Preserved the existing drawer and edit UI while mapping database contract
  statuses to the page status labels.
- Verification: seeded employees successfully, confirmed `GET /api/employees`
  returns HTTP 200 with database records, and `npm run lint`/`npm run build`
  pass.

## 2026-09-23 - Seeding employee sample data

- Added `scripts/seed-employees.ts` and the `npm run seed:employees` command.
- Seeded 20 employees with departments, positions, contracts, and current
  position histories; exactly one employee is assigned the HR position.
- Linked the HR employee to the existing admin auth user when available,
  respecting the database HR-link trigger.
- Made the seed idempotent and verified a second run creates no duplicates.
- Verification: seed completed, `npm run lint` passed, and PostgreSQL reports
  20 employees, 1 linked account, and 1 current HR employee.

## 2026-09-23 - Adding employee detail drawer fields

- Added slide-in behavior to the employee detail drawer opened by the
  `faEye` action.
- Added personal information fields for employee ID, prefix, nickname, Thai
  name/surname, English name, masked national ID, company email, and phone.
- Added employment information fields for department, position, employment
  type, and start date.
- Verification: source diagnostics, `npm run lint`, and `npm run build` pass.

## 2026-09-23 - Applying rebuilt business schema

- Applied the replacement business schema migration after confirming the
  existing business tables were empty.
- Recreated only `departments`, `positions`, `employees`, `personal_info`,
  `employment_contracts`, and `position_histories`; Better Auth tables and
  records were preserved.
- Verified PostgreSQL now contains the 10 expected tables, preserved
  `auth_users=1`, `account=1`, `session=6`, and the
  `trg_check_hr_before_link` trigger.

## 2026-09-23 - Removing leave and department hierarchy tables

- Removed the `leaves` table and all employee/approver leave relations.
- Removed `parentDepartmentId`, its self-referencing foreign key, and its
  department hierarchy relations.
- Rebuilt the Drizzle baseline migration so it now contains 10 tables and no
  leave or parent-department structures.
- Verification: `npm run db:generate`, `npm run lint`, schema diagnostics, and
  searches for leave/parent-department references pass. Database migration was
  not applied.

## 2026-09-23 - Rebuilding HR schema baseline

- Replaced the previous business schema baseline with the requested normalized
  structure: departments, positions, employees, one-to-one personal info,
  employment contracts, position histories, and leaves.
- Added optional one-to-one `employees.auth_user_id` linkage to Better Auth,
  HR-position metadata, referential actions, indexes, date checks, Drizzle
  relations, and the HR-only account-link trigger.
- Removed the previous migration files from the code baseline and generated
  `drizzle/0000_late_guardian.sql`; no PostgreSQL migration, reset, or data
  deletion was performed.
- Added [docs/employee-schema.md](../docs/employee-schema.md) as the ER
  diagram and relationship documentation.
- Verification: `npm run db:generate`, `npm run lint`, and schema diagnostics
  pass. Full application build remains blocked by existing EmployeePage field
  references unrelated to this schema rebuild.

## 2026-09-23 - Restoring root document tags

- Restored `src/app/layout.tsx` as the Next.js root layout with required
  `<html>` and `<body>` tags, metadata, Geist font variables, and global CSS.
- Verification: root layout diagnostics are clean.

## 2026-09-23 - Separating login and employee routes

- Split the combined root client page into `/login` and `/employees` routes,
  each with its own `page.tsx` and nested `layout.tsx`.
- Moved the client UI into `src/app/components/auth/LoginPage.tsx` and
  `src/app/components/employees/EmployeePage.tsx`; login and logout now
  navigate between routes instead of switching a local screen state.
- Kept `/` as the entry point and made it redirect to `/login`; removed the
  duplicate uppercase `src/app/Layout.tsx`.
- Verification: source diagnostics report no errors; `npm run lint` and
  `npm run build` pass. Next.js reports `/`, `/login`, and `/employees` routes.

## 2026-09-23 - Source and API route exploration

- Reviewed the `src/app`, `src/db`, `src/lib`, and `src/types` structure and traced
  the root layout, login/employee prototype, Better Auth client/server flow, and
  Drizzle PostgreSQL schemas.
- Confirmed that only `src/app/api/auth/[...all]/route.ts` exposes API handlers;
  business entities currently have no API routes.
- Confirmed that `src/app/page.tsx` is deleted in the working tree and
  `LoginPage.tsx` is not imported by any route, so the employee prototype is not
  currently wired to `/`.
- Verification: inspected tracked/untracked source paths and existing Drizzle
  migration without changing application code.

## 2026-09-22 - Tailwind mobile-first responsiveness

- Rebuilt the employee UI with Tailwind responsive utilities only.
- Small screens prioritize essential employee columns, touch-sized controls,
  stacked filters, a compact header, and full-width dialog/drawer layouts.
- `sm:`, `md:`, and `lg:` progressively restore the richer desktop layout.

## 2026-09-22 - Submit event type correction

- Replaced deprecated `FormEvent` with `SubmitEvent<HTMLFormElement>` in the
  login submit handler. Verification: `npm run lint` passes.

## 2026-09-22 - HR UI prototype

- Built the React and Tailwind UI from the supplied login, employee-management,
  edit, and employee-detail references.
- Added a working login-to-dashboard transition, row-specific edit modal, and
  right-side employee-detail drawer. Data is local sample data only; no backend
  is implemented.
- Updated page metadata and the global font stack.
- Verification: `npm run lint` and `npm run build` both pass.

Use this as a concise record of completed work, verification, and open
follow-ups. Add new entries at the top.

## 2026-09-23 - Removing marked business timestamps

- Removed the fields marked `// delete` from `business-schema.ts`:
  department/position creation timestamps, personal-info creation/update
  timestamps, and position-history creation timestamp.
- Generated and applied `drizzle/0001_lowly_hardball.sql`.
- Excluded an unrelated generated `account.id` type change so this migration
  only changes the requested business fields.
- Verification: `npm run db:generate` and `npm run db:migrate` pass.

## 2026-09-22 - Drizzle environment loading and seed diagnostics

- Fixed Drizzle Kit configuration to load `.env.local`/`.env`, allowing
  `npm run db:migrate` to use the configured PostgreSQL URL.
- Improved seed error reporting to include the underlying database cause.
- Applied the migration and verified `npm run seed:auth` successfully created
  `admin@example.com`.

## 2026-09-22 - Database existence check and setup command

- Added `npm run db:ensure`, which loads `.env.local`/`.env`, verifies the
  configured PostgreSQL database, and creates it through `DATABASE_ADMIN_URL`
  or the `postgres` maintenance database only when PostgreSQL reports `3D000`
  (database does not exist).
- Added `npm run db:setup` to run database creation before Drizzle migration.
- Added connection timeout and explicit PostgreSQL pool error logging in the
  application database module, plus `.env.example` documentation.
- The setup script quotes database identifiers safely and reports missing or
  invalid configuration without silently continuing.

## 2026-09-22 - Seed environment loading fix

- Fixed the auth seed command to load `.env.local`/`.env` before importing the
  database-backed auth module and to fail clearly when `DATABASE_URL` is absent.
- Replaced unsupported top-level await in the seed script with an async entry
  point so `tsx` can execute it in this project.
- Verification: `npm run lint` and `npm run build` pass; `npm run seed:auth`
  now reports the missing `DATABASE_URL` directly instead of the misleading
  PostgreSQL `client password must be a string` error.

## 2026-09-22 - Business and isolated auth schemas

- Replaced the initial auth-only migration with a clean PostgreSQL migration
  containing `auth_users`, `account`, `session`, and required `verification`
  tables plus `employees`, `employment_contracts`, `departments`, `positions`,
  and `position_histories`.
- Kept business employee columns independent from Better Auth; auth credentials
  and sessions reference `auth_users`, not `employees`.
- Added employment type/status enums and all requested business foreign keys.
- Verification: `npm run db:generate`, `npm run lint`, and `npm run build`
  pass. Apply the generated migration after configuring `DATABASE_URL`.

## 2026-09-22 - Better Auth sign-in integration

- Added Better Auth with Drizzle PostgreSQL storage, auth route handlers,
  generated migration, environment template, and a repeatable auth seed script.
- Connected the existing Sign in form to email/password authentication with
  loading and error states, remember-me support, and an explicit disabled
  forgot-password state; Sign up remains intentionally out of scope.
- Verification: `npm run lint`, `npm run build`, and `npm run db:generate`
  pass. Configure `DATABASE_URL` and `BETTER_AUTH_SECRET` before running the
  migration and seed commands.

## 2026-09-22 — Workspace initialized

- Reviewed the Next.js template and its local Next.js 16 guidance.
- Added the `.codex` workspace area and linked it from `AGENTS.md` so future
  implementation work reads user instructions and records outcomes here.
- No application code was changed.
- Verification: confirmed the project uses `src/app/`; `src/app/page.tsx` is
  currently empty and the existing root-to-`src/` migration remains untouched.
