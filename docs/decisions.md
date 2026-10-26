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
- `BETTER_AUTH_URL` defaults to `http://localhost:3001` in the env schema, so a clean clone only needs a database URL and a secret.
- The active-accounts pipeline counts original posts only, so repost rows do not lower a user's engagement rate.
- The Explore latest query excludes repost rows, so a burst of reposts cannot fill the whole feed; reposts remain in home and profiles.
- Desktop uses a three-column shell: left navigation, a full-width main feed, and a right sidebar for search, trending and suggestions.
- Search is a launcher in the right sidebar on desktop and at the top of Explore on mobile; it navigates to `/explore?q=...`.
- Logged-out auth entry points sit in the sidebar footer, leaving Explore as the only navigation item.
- Post rows fill the main column; the readable text measure is capped with `max-w-prose` rather than wrapping the feed in a card.
- Clicking a post row opens its `/post/[id]` page; links, buttons and menus inside the row keep their own behavior.
- The composer is an inline `PostComposerForm` (avatar, textarea, count, submit) shared by Home, the reply section and the compose dialog instead of a button that only opens a dialog.
- The right sidebar is 24rem wide (`w-96`) so names, follow buttons and discovery actions have room.
