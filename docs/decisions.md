# Decisions

One line per decision, kept in the order they were made.

- Handles use Better Auth `user.additionalFields` with a Zod validator and a unique Prisma index, not the username plugin, so the stored field is `handle` as the brief asks.
- Better Auth's generated ids are replaced with 24-character ObjectId strings, because every Prisma MongoDB model uses `@db.ObjectId`.
- Reposts are `Post` rows with `repostOfId` set and empty text, so repost counts and feed entries share one collection.
- Followers and following are shown in dialogs from the profile header instead of extra routes, keeping the route list from the brief.
- Seed timestamps and the activity chart both use UTC hours, so the seeded evening curve matches `$hour` grouping.
- The seed includes a `demo@quill.dev` account (password `quill12345`) that follows popular seed accounts, so the home timeline is populated on first login.
- Turbo's `db:push` task is non-interactive, so `bun run db:push` also works in a non-TTY shell.
- The app shell is a single root layout with the shadcn sidebar; auth pages render inside the same shell so logged-out visitors see the Explore/Log in/Sign up sidebar.
- Composing is a global dialog provided by a client context, so the sidebar Post button and every reply button share one form.
- Post creates always write `replyToId`, `repostOfId` and `deletedAt` explicitly (null when empty), because Prisma's MongoDB `null` filter does not match absent fields.
