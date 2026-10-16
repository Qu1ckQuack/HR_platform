# Backend authentication operations

## Database-backed login limits

Set `DATABASE_URL` in the repository-root `.env.local` for local development,
or in the backend runtime environment. It must point to the PostgreSQL database
used by both the backend and migrations. If a password contains reserved URL
characters, percent-encode them. `PGPASSWORD` is also supported by node-postgres.
The backend fails before opening a pool when `DATABASE_URL` is missing and gives
a credential-safe hint when PostgreSQL requires SCRAM but receives no string
password.

The backend stores Better Auth rate limits in `AuthRateLimits`, created by
migration `0011_email_recovery_employee_fields_and_login_limits`. Apply pending
migrations to the same database configured as the backend's `DATABASE_URL`
before deploying or starting the backend:

```sh
npm run db:migrate
```

The backend checks that the table and the required `SELECT`, `INSERT`, and
`UPDATE` permissions are available before it starts listening. It does not
automatically run migrations at startup.

## Client IP behind a reverse proxy

Better Auth reads `x-forwarded-for` by default. Configure a different header or
the proxy addresses in the backend environment when the runtime uses another
header or sends a multi-hop forwarded chain:

```dotenv
BETTER_AUTH_IP_ADDRESS_HEADERS=x-forwarded-for
BETTER_AUTH_TRUSTED_PROXIES=10.0.0.10,10.0.1.0/24
```

Production startup requires `BETTER_AUTH_IP_ADDRESS_HEADERS`. If a request
still arrives without a resolvable client IP, the backend rejects the
rate-limit operation instead of placing every client in one shared bucket.

Use the actual proxy addresses or CIDRs. Configure the proxy to replace or
append forwarded headers correctly, and prevent clients from reaching the
backend origin directly. Do not trust broad private-network ranges unless they
contain only controlled proxies. If the platform supplies a single canonical
client-IP header, name that header in `BETTER_AUTH_IP_ADDRESS_HEADERS`.

## Local PostgreSQL on this development host

A private PostgreSQL 18 cluster is initialized under the ignored `.local-postgres/data` directory and listens only on `127.0.0.1:5433`. Its generated credentials are stored in the ignored repository-root `.env.local`; do not commit or share that file. Database `hr_platform_dev` has the project migrations applied.

Start the cluster after a Windows restart:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D .local-postgres/data -l .local-postgres/postgres.log -o '-h 127.0.0.1 -p 5433' -w start
```

Stop it when needed:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D .local-postgres/data -m fast -w stop
```

The pre-existing PostgreSQL Windows service on port 5432 was left unchanged.
