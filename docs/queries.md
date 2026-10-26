# Case-study queries

Every query below is a real function in `packages/api/src/queries/`, one file per
query, and is called by the screen listed under "Screen". Run all of them against
the seeded database with:

```bash
bun run queries
```

The mongosh snippets assume the database from `DATABASE_URL` is selected
(`use quill` if you used the compose file). Replace the demo handle if you seeded
different data. `$oid`/`$date` are Prisma's extended-JSON spelling; the snippets
below use `ObjectId(...)` and `new Date(...)`, which is what mongosh expects.

## S1 — Posts by a user

**Question:** What has this user posted, newest first, excluding replies?
**Screen:** Profile page, Posts tab.
**Code:** `packages/api/src/queries/s1-posts-by-user.ts`

```js
const user = db.user.findOne({ handle: "demo" });

db.post
  .find({
    authorId: user._id,
    replyToId: null,
    deletedAt: null,
  })
  .sort({ createdAt: -1, _id: -1 })
  .limit(20);
```

Prisma version: `db.post.findMany({ where: { authorId, deletedAt: null, replyToId: null }, include: ..., orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 21, cursor, skip: 1 })`.

## S2 — Posts for a hashtag

**Question:** Which posts carry this hashtag, newest first?
**Screen:** Hashtag page and Explore search results.
**Code:** `packages/api/src/queries/s2-posts-by-hashtag.ts`

```js
db.post
  .find({
    hashtags: "typescript",
    deletedAt: null,
  })
  .sort({ createdAt: -1, _id: -1 })
  .limit(20);
```

## S3 — Ten most recent posts

**Question:** What are the ten most recent posts from everyone?
**Screen:** Explore page, latest posts.
**Code:** `packages/api/src/queries/s3-ten-most-recent-posts.ts`

```js
db.post.find({ deletedAt: null }).sort({ createdAt: -1, _id: -1 }).limit(10);
```

## S4 — Followers of a user

**Question:** Who follows this user?
**Screen:** Profile page, followers dialog.
**Code:** `packages/api/src/queries/s4-followers-of-user.ts`

```js
const user = db.user.findOne({ handle: "demo" });

db.follow.aggregate([
  { $match: { followingId: user._id } },
  { $sort: { createdAt: -1 } },
  { $limit: 100 },
  { $lookup: { from: "user", localField: "followerId", foreignField: "_id", as: "follower" } },
  { $unwind: "$follower" },
  { $replaceRoot: { newRoot: "$follower" } },
]);
```

## S5 — A user's post, follower and following counts

**Question:** How many posts, followers and following does this user have?
**Screen:** Profile page header.
**Code:** `packages/api/src/queries/s5-user-counts.ts`

```js
db.user.findOne({ handle: "demo" }, { postCount: 1, followerCount: 1, followingCount: 1 });
```

The counters live on the user document. They are maintained in the same
transaction as the write, so this is one document read.

## C1 — Home timeline from the follow graph

**Question:** What did the people this user follows (and the user) post, newest
first, one page at a time?
**Screen:** Home page, infinite scroll.
**Code:** `packages/api/src/queries/c1-home-timeline.ts`

```js
const viewer = db.user.findOne({ handle: "demo" });
const following = db.follow
  .find({ followerId: viewer._id })
  .toArray()
  .map((follow) => follow.followingId);
const authorIds = [viewer._id, ...following];
const limit = 20;

db.post.aggregate([
  {
    $match: {
      deletedAt: null,
      authorId: { $in: authorIds },
      // Omit this $or on the first page. On later pages the cursor is
      // { createdAt, _id } of the last post already shown.
      // $or: [
      //   { createdAt: { $lt: cursorDate } },
      //   { createdAt: cursorDate, _id: { $lt: cursorId } },
      // ],
    },
  },
  { $sort: { createdAt: -1, _id: -1 } },
  { $limit: limit + 1 },
  { $lookup: { from: "user", localField: "authorId", foreignField: "_id", as: "author" } },
  { $unwind: "$author" },
  {
    $lookup: {
      from: "post",
      localField: "replyToId",
      foreignField: "_id",
      as: "replyToDoc",
    },
  },
  { $unwind: { path: "$replyToDoc", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "user",
      localField: "replyToDoc.authorId",
      foreignField: "_id",
      as: "replyToAuthor",
    },
  },
  { $unwind: { path: "$replyToAuthor", preserveNullAndEmptyArrays: true } },
]);
```

`limit + 1` tells the API whether another page exists. The cursor is
`createdAt` plus `_id`, so posts created in the same millisecond are neither
repeated nor skipped.

## C2 — Trending hashtags in the last 24 hours

**Question:** Which hashtags were used most in the last 24 hours?
**Screen:** Explore page, trending hashtags.
**Code:** `packages/api/src/queries/c2-trending-hashtags.ts`

```js
db.post.aggregate([
  {
    $match: {
      deletedAt: null,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  },
  { $unwind: "$hashtags" },
  { $group: { _id: "$hashtags", count: { $sum: 1 } } },
  { $sort: { count: -1, _id: 1 } },
  { $limit: 10 },
  { $project: { _id: 0, tag: "$_id", count: 1 } },
]);
```

## C3 — Suggested accounts

**Question:** Which accounts do the people this user follows follow, ranked by
how many mutual follows they share, excluding the user and accounts the user
already follows?
**Screen:** Explore page, who to follow.
**Code:** `packages/api/src/queries/c3-suggested-accounts.ts`

```js
const viewer = db.user.findOne({ handle: "demo" });
const following = db.follow
  .find({ followerId: viewer._id })
  .toArray()
  .map((follow) => follow.followingId);

db.follow.aggregate([
  { $match: { followerId: { $in: following } } },
  { $group: { _id: "$followingId", mutualCount: { $sum: 1 } } },
  { $match: { _id: { $nin: [viewer._id, ...following] } } },
  { $sort: { mutualCount: -1, _id: 1 } },
  { $limit: 5 },
  { $lookup: { from: "user", localField: "_id", foreignField: "_id", as: "user" } },
  { $unwind: "$user" },
]);
```

## C4 — Top users by engagement rate

**Question:** Which users get the most engagement (likes + reposts + replies) per
post, counting only users with at least three posts?
**Screen:** Explore page, active accounts.
**Code:** `packages/api/src/queries/c4-active-accounts.ts`

```js
db.post.aggregate([
  { $match: { deletedAt: null, repostOfId: null } },
  {
    $group: {
      _id: "$authorId",
      postCount: { $sum: 1 },
      likes: { $sum: "$likeCount" },
      reposts: { $sum: "$repostCount" },
      replies: { $sum: "$replyCount" },
    },
  },
  { $match: { postCount: { $gte: 3 } } },
  {
    $project: {
      postCount: 1,
      totalEngagement: { $add: ["$likes", "$reposts", "$replies"] },
      engagementRate: {
        $divide: [{ $add: ["$likes", "$reposts", "$replies"] }, "$postCount"],
      },
    },
  },
  { $sort: { engagementRate: -1, totalEngagement: -1, _id: 1 } },
  { $limit: 5 },
  { $lookup: { from: "user", localField: "_id", foreignField: "_id", as: "user" } },
  { $unwind: "$user" },
]);
```

## C5 — Posting activity by hour of day

**Question:** How many posts were created in each hour of the day, for one user
or for everyone?
**Screen:** Profile page, posting activity chart.
**Code:** `packages/api/src/queries/c5-posting-activity.ts`

```js
const user = db.user.findOne({ handle: "demo" });

db.post.aggregate([
  { $match: { authorId: user._id, deletedAt: null } },
  { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
  { $sort: { _id: 1 } },
]);
```

Drop the `authorId` condition for the global version. `$hour` returns the UTC
hour unless a `timezone` is supplied; the seed data and the app both use UTC.
The function returns all 24 hours, filling empty hours with zero, because the
chart should show the full day.
