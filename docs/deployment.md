# Deploying Quill to Vercel

Quill is a Bun + Turborepo monorepo with the Next.js app in `apps/web`. The
deployed app talks to MongoDB Atlas, which is already a replica set, so the
transactions used by the post/follow mutations work without any Atlas setup.

## 1. Prepare Atlas

Use a database URL that includes the database name and an explicit auth source:

```env
DATABASE_URL="mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/quill?retryWrites=true&w=majority&authSource=admin&maxPoolSize=5"
```

- `/quill` is the database Prisma reads and writes.
- `authSource=admin` is required because Atlas password users authenticate
  against `admin`.
- `maxPoolSize=5` keeps each serverless function instance from opening a large
  pool. Free clusters allow up to 500 connections.
- Percent-encode special characters in the password.

Before the first deployment, run the schema push and seed locally against that
Atlas database:

```bash
bun run db:push
bun run db:seed
```

`db:push` creates collections and indexes. `db:seed` wipes the connected
database first, so never run it against a database you want to keep.

For the initial Vercel deployment, add the current Atlas IP access list entry
`0.0.0.0/0` under **Database & Network Access → IP Access List**. Vercel
Functions use dynamic egress IPs on most plans. For a production deployment,
use Vercel Static IPs or PrivateLink instead and allowlist only those addresses.
Atlas Free clusters do not support private endpoints.

## 2. Import the repository

In Vercel:

1. **Add New → Project**.
2. Import the GitHub repository.
3. Set **Root Directory** to `apps/web`.
4. Keep the framework preset as **Next.js**.
5. Make sure **Include source files outside of the Root Directory** is enabled.
6. Set the production environment variables below before the first deploy.

`apps/web/vercel.json` already sets the build command:

```bash
cd ../.. && bun run env:generate && bun run db:generate && bun run build --filter=web
```

That command:

- generates `apps/web/src/env.ts` and `packages/db/src/env.ts` with Varlock
- regenerates Prisma Client for the Vercel runtime
- builds only the `web` workspace with Turbo

Vercel detects Bun from `bun.lock` and runs `bun install` automatically. The
install step also runs the root `postinstall` Varlock codegen; the explicit
`env:generate` in the build command is a safety net for cached installs.

## 3. Set environment variables

Set these in **Project Settings → Environment Variables** for **Production**:

```env
DATABASE_URL=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/quill?retryWrites=true&w=majority&authSource=admin&maxPoolSize=5
BETTER_AUTH_SECRET=replace-with-at-least-32-random-characters
BETTER_AUTH_URL=https://your-project.vercel.app
```

Generate the secret with:

```bash
openssl rand -base64 32
```

`BETTER_AUTH_URL` must be the exact public origin, including `https://` and
without a trailing slash. If you use a custom domain, use that domain instead
of the `vercel.app` URL.

Do not expose `BETTER_AUTH_SECRET` or `DATABASE_URL` to the browser. They are
server-only.

## 4. Choose the function region

Set the Vercel Functions region to the same region as the Atlas cluster when
possible. For example, an Atlas AWS `us-east-1` cluster works well with
Vercel's `iad1` region. This reduces request latency and database round trips.

## 5. Deploy and finish auth setup

Deploy the project. Once Vercel gives you the production URL, confirm that
`BETTER_AUTH_URL` matches it exactly, then redeploy if you had used a
placeholder.

Open the deployed URL and check:

- `/explore` loads posts
- `/login` works with the seeded demo account
- a like, repost, follow and reply update the database
- `/post/[id]` shows replies

## Preview deployments

Better Auth uses a single `BETTER_AUTH_URL`. A preview deployment has a
different hostname, so production auth will not work on preview URLs unless
you give the preview its own matching `BETTER_AUTH_URL` and redeploy it.

For the first deployment, it is simpler to deploy **Production** only. If you
need preview auth, use a separate Vercel project or a custom environment with
its own `BETTER_AUTH_URL` and database. Do not point previews at the production
database unless you are comfortable with preview data changing production.

## Database changes after deployment

MongoDB uses `prisma db push`, not migrations. To change the schema:

```bash
# From your machine, with DATABASE_URL set to the production Atlas database
bun run db:push
```

Do not run `db:push` or `db:seed` as part of the Vercel build. Builds should
not mutate the production database.

## Troubleshooting

| Symptom                            | Check                                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| `P1013` / database must be defined | Add `/quill` before the `?` in `DATABASE_URL`                                           |
| `P1000` authentication failed      | Add `authSource=admin`, encode the password, and confirm the Atlas user                 |
| Connection timeout                 | Add the Vercel egress IPs, or `0.0.0.0/0` for the first deployment                      |
| Prisma engine file missing         | Confirm `bun run db:generate` runs in the build and that Next traces from the repo root |
| Too many Atlas connections         | Keep `maxPoolSize=5` and check the Atlas connection metrics                             |
| Auth redirects to the wrong host   | Make `BETTER_AUTH_URL` match the deployed origin exactly                                |
| Preview login fails                | Give the preview its own `BETTER_AUTH_URL`; production auth is origin-bound             |

## References

- [Vercel Turborepo deployments](https://vercel.com/docs/monorepos/turborepo)
- [Vercel Bun package manager support](https://vercel.com/docs/package-managers)
- [Vercel monorepo root directory](https://vercel.com/docs/monorepos)
- [Prisma deployment to Vercel](https://www.prisma.io/docs/orm/v6/prisma-client/deployment/serverless/deploy-to-vercel)
- [Prisma MongoDB connector](https://www.prisma.io/docs/orm/v6/overview/databases/mongodb)
- [Atlas IP access list](https://www.mongodb.com/docs/atlas/security/ip-access-list/)
- [Vercel Static IPs](https://vercel.com/docs/networking/static-ips)
