# Verification: master

**Date**: 2026-10-17
**Original request**: Diagnose the OTP failure shown in backend logs and verify the backend logging/fix.

## Criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Identify where the logged request fails. | ✅ | User log: `accountFound:true`, then `errorMessage:"BETTER_AUTH_SECRET is not configured"`, then HTTP 503. The account lookup completed before failure. |
| 2 | Use one secret source for Better Auth and OTP recovery hashing in local development. | ✅ | `auth.ts` and `password-reset-crypto.ts` both call `getBetterAuthSecret()`; resolver and crypto fallback tests passed. |
| 3 | Keep production secret configuration explicit. | ✅ | Resolver test confirms production without `BETTER_AUTH_SECRET` throws; production build phase has a build-only value. |
| 4 | Verify backend logging and prevent regressions without sending a real OTP. | ✅ | Backend suite passed 52/52, including logger/request lifecycle tests and recovery error tests. Restart log showed env injection and `backend_listening`; `GET /health` returned `{"status":"ok"}`. A malformed-email request through the frontend rewrite returned 400 and was logged by the backend. No live OTP request was made. |

## Regression Check

- [x] Backend test suite: `npm.cmd run test --workspace @hr-platform/backend` — 52 passed, 0 failed.
- [x] Typecheck: `npm.cmd run typecheck --workspace @hr-platform/backend` — passed.
- [x] Lint: `npm.cmd run lint --workspace @hr-platform/backend` — passed.
- [x] `git diff --check` — passed.
- [x] Reviewed the changed secret resolver and both call sites; existing unrelated working-tree files were left untouched.

## Side Effects

- [x] No environment secret values were printed or changed.
- [x] No OTP email was sent and no database rows were changed during verification.
- [ ] Live OTP delivery was not exercised; provider/runtime behavior remains unverified.

## Challenge

**VERDICT: CONFIRMED** for the bounded claim that local recovery hashing uses the same development fallback as Better Auth, while production still requires a configured secret.

- Failure scenario checked: if the backend runs with `NODE_ENV=production` and no `BETTER_AUTH_SECRET`, it still throws by design. The production deployment must configure the secret and restart.
- Runtime check: the stale backend listener was restarted after adding the secret; the new process loaded the root env files and passed `GET /health`. No real OTP request was used to test email delivery.
- Sources checked: `apps/backend/src/lib/auth-secret.ts`, `apps/backend/src/lib/auth.ts`, `apps/backend/src/modules/auth/services/password-reset-crypto.ts`, and the corresponding resolver/crypto tests.

## Verdict

**FUNCTIONALLY RESOLVED for local development code path** — shared secret resolution is covered by passing tests, and the restarted local backend loads the environment and passes its health check. Production must provide `BETTER_AUTH_SECRET`; live OTP delivery remains unverified because testing it could send a real email.

## Follow-up: OTP delivery reference `7270654e-09b3-48ba-8f62-b24f98b6c5c3`

- The backend stdout contained the matching request ID and `password_recovery.email_delivery_failed` at error level. The API returns a safe Thai message and reference; raw provider diagnostics belong in backend logs, not the UI response.
- Account lookup and OTP persistence succeeded; cleanup also succeeded after delivery failed.
- Resend SDK source catches fetch failures and maps them to `application_error` with no HTTP status. Outbound TCP 443 failed from the sandbox and succeeded outside it.
- Restarted the backend with outbound network access. `GET /health` returned `{"status":"ok"}`.
- No OTP email was sent by the agent. Actual delivery after the restart awaits a user-triggered retry; Resend key scope/sender acceptance is not proven until that request succeeds.
