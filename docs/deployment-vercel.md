# Deploying HR Platform to Vercel

Deploy the Next.js frontend to Vercel and run the Express API as a Node.js
container on a host that accepts large request bodies. Both use the same Git
repository and a managed PostgreSQL database:

| Project | Root directory | Runtime |
| --- | --- | --- |
| Frontend | `apps/frontend` | Vercel / Next.js |
| Backend | `apps/backend` | Node.js container (`apps/backend/Dockerfile`) |

The backend runs outside Vercel Functions so the import endpoint can accept
files up to 100 MiB. Standard Vercel Functions and Dockerfile-backed Vercel
Functions both retain the 4.5 MB request-body limit. The frontend's `/api`
rewrite proxies to the backend's public HTTPS origin and has a 120-second
timeout. The Vercel deployment needs source files outside the frontend root
because `packages/shared` is a workspace dependency. Use the repository
`package-lock.json` and npm workspaces.

## Build configuration

Configure the Vercel frontend project with these settings:

- Root Directory: `apps/frontend`
- Framework Preset: Next.js
- Enable **Include source files outside of the Root Directory in the Build Step** so the app can resolve the root npm workspace and `packages/shared` source.
- Keep the default npm install and Next.js build commands. The shared package exports TypeScript source and is transpiled through `transpilePackages`, so it does not need a separate build step.

Build the backend container from the repository root, not from the frontend project directory:

```sh
docker build -f apps/backend/Dockerfile -t hr-platform-backend .
```

The image uses Node.js 22 and installs only production dependencies for the
backend workspace. Apply database migrations from the repository root before
routing traffic to it:

```sh
npm run db:migrate
```

Run that command against the same managed database configured for the backend.
Do not point Vercel at the local `.local-postgres` database or seed demo data
into production.

## Environment variables

Set these in the backend container runtime for Preview and Production:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Managed PostgreSQL connection string with migrations applied |
| `BETTER_AUTH_SECRET` | Random secret of at least 32 characters |
| `BETTER_AUTH_URL` | Public backend URL, e.g. `https://<backend-domain>` |
| `FRONTEND_URL` | Frontend origin allowed by Better Auth and CORS |
| `BETTER_AUTH_IP_ADDRESS_HEADERS` | Client IP header supplied by the trusted ingress, normally `x-forwarded-for` |
| `RESEND_API_KEY` | Resend key, required for password reset email |
| `RESEND_FROM` | Verified sender address used for password reset email |

Set this in the Vercel **frontend** project for Preview and Production:

| Variable | Purpose |
| --- | --- |
| `BACKEND_URL` | Public backend URL; Next.js uses it for API rewrites and session lookup |

The browser auth client uses same-origin API requests, so leave
`NEXT_PUBLIC_BETTER_AUTH_URL` unset when the frontend `/api` rewrite is used.
If setting it, use the frontend origin so browser requests still pass through
the rewrite. Never expose `BETTER_AUTH_SECRET`, database credentials, or email
provider keys through a `NEXT_PUBLIC_` variable.

Set `FRONTEND_URL` to the actual frontend origin for each environment. Preview
deployments use a different origin per deployment; use a stable Preview domain
or update this variable when testing a new preview. Do not use a wildcard
trusted origin. Verify login, employee CRUD, and password recovery against the
preview database before promoting a deployment.

## Employee import size limit

The frontend and backend both accept import files up to 100 MiB. Vercel
Functions cap request and response bodies at 4.5 MB, including Functions built
from a Dockerfile, so the Express API must not be deployed as a Vercel Function
while imports use the current request flow. Vercel can proxy API rewrites to an
external origin; proxied requests have a 120-second timeout. Verify imports
larger than 4.5 MB against the deployed preview before production, including
processing time for large spreadsheets.

An all-Vercel alternative would need a different upload flow: the browser uploads
the file directly to private Vercel Blob storage, then the backend processes it
by blob pathname. The token-generation route must authenticate and authorize
the user, and the backend must fetch and clean up the private blob. This flow
has not been implemented or verified. See [Vercel Blob client uploads](https://vercel.com/docs/vercel-blob/client-upload)
and [private storage](https://vercel.com/docs/vercel-blob/private-storage).

## Current deployment blockers

- Vercel CLI is not installed globally and `npx vercel whoami` reports that no
  Vercel account is logged in.
- The repository only has a local development database; it has no database
  URL suitable for a Vercel runtime.
- Deploying requires a managed database, applying migrations, deploying the
  backend container, setting the environment values above, and linking the
  frontend Vercel project.
- The Vercel frontend project must include source files outside its Root
  Directory so the npm workspace dependency `packages/shared` is available.
- A deployed preview must verify an import above 4.5 MB and within 120 seconds
  through the external rewrite before the full import capability is confirmed.
- Deploying the API as a Dockerfile-backed Vercel Function does not remove the
  4.5 MB request-body limit. An all-Vercel API needs the unimplemented direct
  private-Blob upload flow described above.

The local production build currently succeeds with `npm run build`.
