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
- The sidebar Post button opens a compose dialog that reuses the inline `PostComposerForm`; Home and reply sections use the same form inline.
- Post deletion is a soft delete; it removes the post's notifications and decrements the same counters in one transaction.
- Notifications support per-item read state and an unread badge; the badge polls every 30 seconds for changes from other sessions.
- Seed content is deterministic; set `SEED_NOW` to freeze timestamps and use deterministic ObjectIds for a byte-identical fixture.
- `postCount` includes replies, so the profile labels the counter "posts and replies" to match the Posts and Replies tabs.
- Post creates always write `replyToId`, `repostOfId` and `deletedAt` explicitly (null when empty), because Prisma's MongoDB `null` filter does not match absent fields.
- `BETTER_AUTH_URL` defaults to `http://localhost:3001` in the env schema, so a clean clone only needs a database URL and a secret.
- The active-accounts pipeline counts original posts only, so repost rows do not lower a user's engagement rate.
- The Explore latest query excludes repost and reply rows, so a burst of either cannot fill the whole feed; reposts remain in the home timeline.
- Desktop uses a three-column shell: left navigation, a full-width main feed, and a right sidebar for search, trending and suggestions.
- Search is a launcher in the right sidebar on desktop and at the top of Explore on mobile; it navigates to `/explore?q=...`.
- Logged-out auth entry points sit in the sidebar footer, leaving Explore as the only navigation item.
- Post rows fill the main column; the readable text measure is capped with `max-w-prose` rather than wrapping the feed in a card.
- Clicking a post row opens its `/post/[id]` page; links, buttons and menus inside the row keep their own behavior.
- The composer is an inline `PostComposerForm` (avatar, textarea, count, submit) shared by Home, the reply section and the compose dialog instead of a button that only opens a dialog.
- The right sidebar is 24rem wide (`w-96`) so names, follow buttons and discovery actions have room.
- Handle validation is one Zod schema in `packages/auth/src/handle.ts`, reused by Better Auth, the users router and the sign-up form.
- Notification types come from Prisma's `NotificationType`; the API does not redeclare the union.
- Counter updates use Prisma `increment`/`decrement` (with a `gt: 0` guard on decrements) instead of read-modify-write.
- Prisma uses `prisma-client-js` with its default output inside `@prisma/client`, so Next.js externalizes the client and the native query engine keeps a real `__dirname` on Vercel.
