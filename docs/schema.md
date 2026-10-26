# Schema

Quill uses Prisma's MongoDB provider. The schema is split across
`packages/db/prisma/schema/auth.prisma` (Better Auth's models plus Quill's user
fields) and `packages/db/prisma/schema/quill.prisma` (posts, follows, likes and
notifications). MongoDB has no migrations here: `bun run db:push` syncs
collections, indexes and constraints.

## User

`User` keeps every Better Auth field (`id`, `name`, `email`, `emailVerified`,
`image`, `createdAt`, `updatedAt`) and adds:

| Field            | Type             | Purpose                                                              |
| ---------------- | ---------------- | -------------------------------------------------------------------- |
| `handle`         | `String @unique` | Public name. 3–15 letters, numbers or underscores; stored lowercase. |
| `bio`            | `String`         | Short profile line.                                                  |
| `followerCount`  | `Int`            | Denormalized follower total.                                         |
| `followingCount` | `Int`            | Denormalized following total.                                        |
| `postCount`      | `Int`            | Total posts including replies; repost rows do not count.             |

Better Auth generates opaque ids by default. Its `advanced.database.generateId`
hook is replaced with a 24-character hex ObjectId generator in
`packages/auth/src/index.ts`, because every Prisma model uses
`String @id @default(auto()) @map("_id") @db.ObjectId`.

`handle` is an `additionalFields` entry rather than the username plugin: the
username plugin stores a field called `username`, and the brief asks for
`handle`. The additional field carries a Zod validator and relies on the Prisma
unique index. The sign-up form also checks availability first so the common
duplicate is reported as a normal error instead of a database error.

## Post

A post is one document:

```text
id, authorId, text, hashtags[], mentions[], replyToId?, repostOfId?,
likeCount, replyCount, repostCount, createdAt, deletedAt?
```

- **Hashtags and mentions are embedded arrays.** They are read with the post
  and are only used for filtering (`hashtags: "tag"`), counting trends, and
  linking handles. A separate collection would add a join to every feed read
  without giving the app anything it needs.
- **Replies are posts with `replyToId`.** The detail page reads one post and
  its replies by `replyToId`, and a reply can itself be replied to to any depth.
  Embedding comments would cap depth and make pagination awkward.
- **Reposts are posts with `repostOfId` and empty text.** One collection keeps
  home timeline and hashtag reads from needing to merge two shapes. The profile
  Posts tab excludes repost rows so it stays aligned with `postCount`; reposts
  remain in the home timeline.
- **Soft delete.** `deletedAt` is set on delete. Reads filter it out, and the
  post's notifications are removed, so likes that point at the post remain valid
  without leaving a stale notification. A repost whose original is deleted is
  filtered out while hydrating the feed.
- **Counts are denormalized.** `likeCount`, `replyCount` and `repostCount` are
  updated in the same `$transaction` as the like/follow/reply/repost write. The
  feed never counts child documents per row.
- **UTC hours.** The seeded timestamps and the `$hour` activity query both use
  UTC, so the chart is stable across machines.

## Follow and Like

Both are separate collections with compound unique indexes:

- `Follow`: unique `(followerId, followingId)`, indexed on each side.
- `Like`: unique `(userId, postId)`, indexed on `postId` and `(userId, createdAt)`.

They are unbounded many-to-many edges. Embedding follower ids or liker ids in
user/post documents would grow without limit and would not support the
"who liked this" / "who follows whom" reads. Keeping them separate also makes
the home timeline and suggested-accounts pipelines simple `$lookup`s.

## Notification

`Notification` references `recipientId`, `actorId` and an optional `postId`, and
stores `type` (`LIKE`, `REPOST`, `REPLY`, `FOLLOW`, `MENTION`), `readAt` and
`createdAt`. It is its own collection because it is written by every interaction
and read as a separate screen. The unread badge is a count on `recipientId` filtered by
`readAt: null`, served by the recipient index.

## Indexes

Declared with `@@index` / `@@unique` and created by `prisma db push`:

| Collection   | Index                               | Used by                      |
| ------------ | ----------------------------------- | ---------------------------- |
| Post         | `(authorId, createdAt desc)`        | profile posts, S1            |
| Post         | `(hashtags, createdAt desc)`        | hashtag page, S2, trending   |
| Post         | `(createdAt desc)`                  | Explore latest, S3           |
| Post         | `(replyToId, createdAt)`            | post detail replies          |
| Follow       | `(followerId)`                      | home timeline follow ids, C1 |
| Follow       | `(followingId)`                     | followers list, S4           |
| Follow       | unique `(followerId, followingId)`  | follow/unfollow              |
| Like         | `(postId)`                          | like counts and viewer state |
| Like         | `(userId, createdAt desc)`          | profile Likes tab            |
| Like         | unique `(userId, postId)`           | like/unlike                  |
| Notification | `(recipientId, createdAt desc)`     | notification list            |
| User         | unique `(handle)`, unique `(email)` | profile lookup, auth         |

Prisma's MongoDB connector distinguishes an absent optional field from an
explicit `null`: `field: null` matches only documents where the field is stored
as `null`. Post creates therefore write `replyToId`, `repostOfId` and `deletedAt`
explicitly, including `null` for the empty case. That makes `deletedAt: null`
mean "not deleted" in Prisma queries and makes the same filter work in
aggregation pipelines, where MongoDB also treats `null` as matching a missing
field.
