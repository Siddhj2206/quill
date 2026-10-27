# Quill

A small Twitter-style microblogging app built on the Better-T-Stack scaffold:
Next.js, tRPC, Better Auth, Prisma with MongoDB, bun and Turborepo. The data
layer is also a NoSQL case study: the ten queries in `packages/api/src/queries`
are real code used by the screens, and the schema decisions are written down in
[`docs/schema.md`](docs/schema.md) and [`docs/queries.md`](docs/queries.md).

## Requirements

- [bun](https://bun.sh) 1.4+
- Docker (for the local MongoDB replica set)
- A MongoDB database with a replica set (Atlas clusters are replica sets by
  default). Quill uses transactions for counter updates, so a standalone
  `mongod` will not work.

## Setup

```bash
bun install
```

Start MongoDB as a single-node replica set:

```bash
docker compose up -d --wait
docker exec quill-mongo mongosh --quiet --eval 'try { rs.status() } catch (e) { rs.initiate({_id: "rs0", members: [{_id: 0, host: "localhost:27017"}]}) }'
```

The replica set advertises `localhost:27017`, which is the address the app uses.
If port 27017 is already taken, change the port in `docker-compose.yml` and in
`DATABASE_URL`, and update the host in `rs.initiate`.

Create the environment file:

```bash
cp apps/web/.env.example apps/web/.env
```

Set `BETTER_AUTH_SECRET` to at least 32 characters, e.g.
`openssl rand -base64 32`.

Apply the schema and seed data:

```bash
bun run db:push
bun run db:seed
```

`db:seed` wipes the database first, then recreates it. It is safe to run again.
The seed content is deterministic and uses deterministic ids. Set `SEED_NOW` to
freeze timestamps too, for a byte-identical fixture:

```bash
SEED_NOW=2026-10-26T20:00:00Z bun run db:seed
```

Without `SEED_NOW`, dates are relative to the current time so the "last 24
hours" trending cards stay populated.

All seeded accounts share the password `quill12345`; sign in as
`demo@quill.dev` to see a populated home timeline. Other accounts use
`<handle>@quill.dev`, for example `mira@quill.dev`.

Run the app:

```bash
bun run dev
```

Open <http://localhost:3001>.

### Clean-clone check

With MongoDB running and `apps/web/.env` containing `DATABASE_URL`,
`BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`, this is the whole flow:

```bash
bun install
bun run db:push
bun run db:seed
bun run dev
```

## Deployment

See [`docs/deployment.md`](docs/deployment.md) for the Vercel + MongoDB Atlas
setup, environment variables, build command, and production checks.

## Commands

| Command               | What it does                                                  |
| --------------------- | ------------------------------------------------------------- |
| `bun run dev`         | Start the Next.js app on port 3001                            |
| `bun run build`       | Production build                                              |
| `bun run lint`        | Oxlint                                                        |
| `bun run check-types` | TypeScript across all packages                                |
| `bun run check`       | Oxlint plus Oxfmt                                             |
| `bun run db:push`     | Push the Prisma schema and indexes (no migrations on MongoDB) |
| `bun run db:generate` | Regenerate the Prisma client                                  |
| `bun run db:seed`     | Wipe and recreate the seed data                               |
| `bun run queries`     | Run all 10 case-study queries and print pipelines + results   |
| `bun run db:studio`   | Prisma Studio                                                 |

## Database notes

- MongoDB uses `prisma db push`; there are no migration files.
- Transactions require a replica set. The compose setup starts one.
- Better Auth's ids are generated as 24-character ObjectIds because every
  Prisma model uses `@db.ObjectId`.
- `prisma db push` creates the collections and indexes declared in
  `packages/db/prisma/schema`.
- `bun run auth:generate` regenerates `auth.prisma` from the Better Auth config.
  The committed file is hand-extended with `handle`, `bio`, counters and
  relations, so review that command's output before accepting it.
- To inspect the created indexes:
  `docker exec quill-mongo mongosh quill --eval 'db.post.getIndexes()'`.

## Project layout

```
apps/web/                 Next.js app (App Router, tRPC client, sidebar shell)
packages/api/             tRPC routers, query functions, DTO helpers
  src/queries/            one file per case-study query
packages/auth/            Better Auth config (handle field, ObjectId ids)
packages/db/              Prisma schema (client generated into node_modules)
packages/ui/              shared shadcn/ui components and theme
scripts/seed.ts           deterministic seed data
scripts/run-queries.ts    case-study query runner
docs/schema.md            model and index rationale
docs/queries.md           each query with a mongosh version and screen
docs/decisions.md         one-line implementation decisions
docs/deployment.md        Vercel + MongoDB Atlas deployment notes
```

## Screens

The app shell is three columns on desktop: the navigation sidebar, the post
feed, and a right sidebar with search and discovery cards. The right sidebar is
hidden on smaller screens, where search moves to the top of Explore and the
discovery cards move below it.

- `/home` — posts from people you follow plus your own, with the composer and
  refresh action. The sidebar Post button opens the same composer in a dialog
- `/explore` — latest original posts (S3); search lives in the right sidebar on
  desktop and at the top of the page on mobile. The right sidebar also carries
  trending (C2), who to follow (C3) and active accounts (C4)
- `/notifications` — likes, reposts, replies, follows and mentions; mark one or
  all read. The unread badge refreshes every 30 seconds
- `/[handle]` — profile header with counts (S5), follow button, Posts (S1),
  Replies and Likes tabs, posting activity chart (C5)
- `/post/[id]` — a post and its replies
- `/hashtag/[tag]` — posts for one hashtag (S2)
- `/login`, `/signup` — Better Auth email/password; the logged-out sidebar puts
  Log in and Sign up in the footer

Posts can be deleted by their author. Deletion is a soft delete; replies that
point at the post remain readable, and the post's notifications are removed.

## Case-study queries

Simple queries use Prisma model calls. The complex five use
`aggregateRaw` pipelines so the raw stages are visible and can be copied into
mongosh or Compass. Each function has a doc comment with its plain-English
question and the screen that uses it. See [`docs/queries.md`](docs/queries.md)
and run `bun run queries` for the full output.
