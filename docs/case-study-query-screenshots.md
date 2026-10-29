# Case-study query screenshots

The local MongoDB is running and seeded with 50 users, 500 posts, 300 follows,
1,500 likes and 7 notifications.

## Connect

```bash
mongosh "mongodb://localhost:27017/quill?replicaSet=rs0"
```

Inside the shell:

```js
use quill
```

The demo user id is deterministic:

```js
const demo = db.user.findOne({ handle: "demo" });
demo._id; // ObjectId("000000000000000000000001")
```

## Take the screenshots

Use a Ghostty window so the text is large and readable:

```bash
ghostty --font-size=16 -e mongosh "mongodb://localhost:27017/quill?replicaSet=rs0"
```

Then:

1. Run one query below.
2. Keep the query and the result visible.
3. Take the focused window:

```bash
niri msg action screenshot-window
```

That saves a PNG in `~/Pictures/Screenshots/` and copies it to the clipboard.
To choose the path explicitly:

```bash
niri msg action screenshot-window --path ~/Pictures/case-study/s1.png
```

For long pipelines, take two screenshots: one showing the query, one showing
the result. For long result sets, add `.limit(5)` so the output fits.

Suggested file names:

```text
s1-posts-by-user.png
s2-hashtag.png
s3-latest.png
s4-followers.png
s5-counts.png
c1-home-timeline.png
c2-trending.png
c3-suggested.png
c4-engagement.png
c5-activity.png
```

---

## S1 — Posts by a user

**Question:** What has `demo` posted, newest first, excluding replies and reposts?

```js
const demo = db.user.findOne({ handle: "demo" });

db.post
  .find({
    authorId: demo._id,
    replyToId: null,
    repostOfId: null,
    deletedAt: null,
  })
  .sort({ createdAt: -1, _id: -1 })
  .limit(5);
```

---

## S2 — Posts by hashtag

**Question:** Which posts carry `#typescript`, newest first?

```js
db.post
  .find({
    hashtags: "typescript",
    deletedAt: null,
  })
  .sort({ createdAt: -1, _id: -1 })
  .limit(5);
```

---

## S3 — Ten most recent original posts

**Question:** What are the ten most recent original posts from everyone?

```js
db.post
  .find({
    deletedAt: null,
    repostOfId: null,
    replyToId: null,
  })
  .sort({ createdAt: -1, _id: -1 })
  .limit(10);
```

---

## S4 — Followers of a user

**Question:** Who follows `demo`?

```js
const demo = db.user.findOne({ handle: "demo" });

db.follow.aggregate([
  { $match: { followingId: demo._id } },
  { $sort: { createdAt: -1 } },
  { $limit: 5 },
  {
    $lookup: {
      from: "user",
      localField: "followerId",
      foreignField: "_id",
      as: "follower",
    },
  },
  { $unwind: "$follower" },
  {
    $project: {
      _id: 0,
      handle: "$follower.handle",
      name: "$follower.name",
    },
  },
]);
```

---

## S5 — A user's post, follower and following counts

**Question:** How many posts, followers and following does `demo` have?

```js
db.user.findOne({ handle: "demo" }, { postCount: 1, followerCount: 1, followingCount: 1 });
```

---

## C1 — Home timeline from the follow graph

**Question:** What did the people `demo` follows, plus `demo`, post newest
first?

This screenshot version omits repost rows; the app hydrates repost originals
separately, and empty repost rows make the raw pipeline harder to read.

```js
const demo = db.user.findOne({ handle: "demo" });
const following = db.follow
  .find({ followerId: demo._id })
  .toArray()
  .map((follow) => follow.followingId);

db.post.aggregate([
  {
    $match: {
      deletedAt: null,
      repostOfId: null,
      authorId: { $in: [demo._id, ...following] },
    },
  },
  { $sort: { createdAt: -1, _id: -1 } },
  { $limit: 5 },
  {
    $lookup: {
      from: "user",
      localField: "authorId",
      foreignField: "_id",
      as: "author",
    },
  },
  { $unwind: "$author" },
  {
    $project: {
      _id: 1,
      text: 1,
      createdAt: 1,
      author: "$author.handle",
    },
  },
]);
```

---

## C2 — Trending hashtags in the last 24 hours

**Question:** Which hashtags were used most in the last 24 hours?

```js
db.post.aggregate([
  {
    $match: {
      deletedAt: null,
      createdAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  },
  { $unwind: "$hashtags" },
  { $group: { _id: "$hashtags", count: { $sum: 1 } } },
  { $sort: { count: -1, _id: 1 } },
  { $limit: 10 },
  { $project: { _id: 0, tag: "$_id", count: 1 } },
]);
```

---

## C3 — Suggested accounts

**Question:** Which accounts do the people `demo` follows follow, ranked by
mutual follows?

```js
const demo = db.user.findOne({ handle: "demo" });
const following = db.follow
  .find({ followerId: demo._id })
  .toArray()
  .map((follow) => follow.followingId);

db.follow.aggregate([
  { $match: { followerId: { $in: following } } },
  { $group: { _id: "$followingId", mutualCount: { $sum: 1 } } },
  { $match: { _id: { $nin: [demo._id, ...following] } } },
  { $sort: { mutualCount: -1, _id: 1 } },
  { $limit: 5 },
  {
    $lookup: {
      from: "user",
      localField: "_id",
      foreignField: "_id",
      as: "user",
    },
  },
  { $unwind: "$user" },
  {
    $project: {
      _id: 0,
      handle: "$user.handle",
      mutualCount: 1,
    },
  },
]);
```

---

## C4 — Top users by engagement rate

**Question:** Which users get the most likes + reposts + replies per post,
counting only users with at least three posts?

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
      totalEngagement: { $toInt: { $add: ["$likes", "$reposts", "$replies"] } },
      engagementRate: {
        $round: [{ $divide: [{ $add: ["$likes", "$reposts", "$replies"] }, "$postCount"] }, 2],
      },
    },
  },
  { $sort: { engagementRate: -1, totalEngagement: -1, _id: 1 } },
  { $limit: 5 },
  {
    $lookup: {
      from: "user",
      localField: "_id",
      foreignField: "_id",
      as: "user",
    },
  },
  { $unwind: "$user" },
  {
    $project: {
      _id: 0,
      handle: "$user.handle",
      postCount: 1,
      totalEngagement: 1,
      engagementRate: 1,
    },
  },
]);
```

---

## C5 — Posting activity by hour of day

**Question:** How many posts did `demo` create in each hour of the day?

```js
const demo = db.user.findOne({ handle: "demo" });

db.post.aggregate([
  { $match: { authorId: demo._id, deletedAt: null } },
  { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
  { $sort: { _id: 1 } },
]);
```

For the global version, remove the `authorId` condition:

```js
db.post.aggregate([
  { $match: { deletedAt: null } },
  { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
  { $sort: { _id: 1 } },
]);
```

---

## Quick check

To see every query and result in one run:

```bash
bun run queries
```

That is useful for checking the data, but the submitted screenshots should show
the query being executed in `mongosh` or MongoDB Compass.
