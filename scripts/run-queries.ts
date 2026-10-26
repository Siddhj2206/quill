/**
 * Runs every case-study query against the seeded database and prints the
 * question, a mongosh-ready form of the pipeline or query, and the result.
 *
 *   bun run queries
 */
import { createPrismaClient } from "@quill/db";

import {
  activeAccounts,
  activeAccountsPipeline,
  followersOfUser,
  homeTimeline,
  homeTimelinePipeline,
  postingActivityByHour,
  postingActivityPipeline,
  postsByHashtag,
  postsByUser,
  suggestedAccounts,
  suggestedAccountsPipeline,
  tenMostRecentPosts,
  trendingHashtags,
  trendingHashtagsPipeline,
  userCounts,
} from "../packages/api/src/queries";

const db = createPrismaClient({ DATABASE_URL: process.env.DATABASE_URL ?? "" });

function toMongosh(value: unknown, depth = 0): string {
  const pad = "  ".repeat(depth);
  const padInner = "  ".repeat(depth + 1);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value.map((item) => `${padInner}${toMongosh(item, depth + 1)}`).join(",\n")}\n${pad}]`;
  }

  if (value instanceof Date) return `ISODate("${value.toISOString()}")`;

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 1) {
      const [key, inner] = entries[0] ?? [];
      if (key === "$oid" && typeof inner === "string") return `ObjectId("${inner}")`;
      if (key === "$date" && typeof inner === "string") return `ISODate("${inner}")`;
    }
    if (entries.length === 0) return "{}";
    return `{\n${entries
      .map(([key, inner]) => `${padInner}${JSON.stringify(key)}: ${toMongosh(inner, depth + 1)}`)
      .join(",\n")}\n${pad}}`;
  }

  return JSON.stringify(value);
}

function show(name: string, question: string, screen: string, source: string, result: unknown) {
  console.log("");
  console.log("=".repeat(78));
  console.log(`${name} — ${question}`);
  console.log(`Screen: ${screen}`);
  console.log("-".repeat(78));
  console.log(source);
  console.log("-".repeat(78));
  console.log("Result:");
  console.log(JSON.stringify(result, null, 2));
}

function pipeline(collection: string, stages: Record<string, unknown>[]) {
  return `db.${collection}.aggregate(${toMongosh(stages)})`;
}

async function main() {
  const demo = await db.user.findUnique({ where: { handle: "demo" } });
  if (!demo) throw new Error("Seed the database first: bun run db:seed");

  const samplePost = await db.post.findFirst({
    where: { authorId: demo.id, replyToId: null, deletedAt: null, repostOfId: null },
    orderBy: { createdAt: "desc" },
  });
  const sampleTag = "typescript";
  const followed = await db.follow.findMany({
    where: { followerId: demo.id },
    select: { followingId: true },
  });
  const followedIds = followed.map((follow) => follow.followingId);
  const authorIds = [demo.id, ...followedIds];

  show(
    "S1",
    "What has this user posted, newest first, excluding replies?",
    "Profile page, Posts tab",
    `db.post.find({
  authorId: ObjectId("${demo.id}"),
  replyToId: null,
  deletedAt: null,
}).sort({ createdAt: -1, _id: -1 }).limit(3)`,
    (await postsByUser(db, demo.id, { limit: 3 })).items.map((post) => ({
      id: post.id,
      text: post.text,
      createdAt: post.createdAt,
    })),
  );

  show(
    "S2",
    "Which posts carry this hashtag, newest first?",
    "Hashtag page and Explore search results",
    `db.post.find({
  hashtags: "${sampleTag}",
  deletedAt: null,
}).sort({ createdAt: -1, _id: -1 }).limit(3)`,
    (await postsByHashtag(db, sampleTag, { limit: 3 })).items.map((post) => ({
      id: post.id,
      hashtags: post.hashtags,
      createdAt: post.createdAt,
    })),
  );

  show(
    "S3",
    "What are the ten most recent posts from everyone?",
    "Explore page, latest posts",
    `db.post.find({ deletedAt: null })
  .sort({ createdAt: -1, _id: -1 })
  .limit(10)`,
    (await tenMostRecentPosts(db)).map((post) => ({
      id: post.id,
      author: `@${post.author.handle}`,
      createdAt: post.createdAt,
    })),
  );

  show(
    "S4",
    "Who follows this user?",
    "Profile page, followers dialog",
    `db.follow.aggregate([
  { $match: { followingId: ObjectId("${demo.id}") } },
  { $limit: 5 },
  { $lookup: { from: "user", localField: "followerId", foreignField: "_id", as: "follower" } },
  { $unwind: "$follower" },
])`,
    (await followersOfUser(db, demo.id, 5)).map((user) => `@${user.handle}`),
  );

  show(
    "S5",
    "How many posts, followers and following does this user have?",
    "Profile page header",
    `db.user.findOne(
  { _id: ObjectId("${demo.id}") },
  { postCount: 1, followerCount: 1, followingCount: 1 },
)`,
    await userCounts(db, demo.id),
  );

  const home = await homeTimeline(db, demo.id, { limit: 3 });
  show(
    "C1",
    "What did the people this user follows (and the user) post, newest first?",
    "Home page, infinite scroll",
    pipeline("post", homeTimelinePipeline(authorIds, { limit: 3 })),
    {
      nextCursor: home.nextCursor,
      items: home.items.map((post) => ({
        id: post.id,
        author: `@${post.author.handle}`,
        createdAt: post.createdAt,
      })),
    },
  );

  show(
    "C2",
    "Which hashtags were used most in the last 24 hours?",
    "Explore page, trending hashtags",
    pipeline("post", trendingHashtagsPipeline()),
    await trendingHashtags(db),
  );

  show(
    "C3",
    "Which accounts do the people this user follows follow, ranked by mutual follows?",
    "Explore page, who to follow",
    pipeline("follow", suggestedAccountsPipeline(demo.id, followedIds, 5)),
    (await suggestedAccounts(db, demo.id, 5)).map((entry) => ({
      handle: `@${entry.user.handle}`,
      mutualCount: entry.mutualCount,
    })),
  );

  show(
    "C4",
    "Which users get the most engagement per post, with at least three posts?",
    "Explore page, active accounts",
    pipeline("post", activeAccountsPipeline()),
    (await activeAccounts(db)).map((entry) => ({
      handle: `@${entry.user.handle}`,
      postCount: entry.postCount,
      totalEngagement: entry.totalEngagement,
      engagementRate: Number(entry.engagementRate.toFixed(2)),
    })),
  );

  show(
    "C5",
    "How many posts were created in each hour of the day for this user?",
    "Profile page, posting activity chart",
    pipeline("post", postingActivityPipeline(demo.id)),
    await postingActivityByHour(db, { userId: demo.id }),
  );

  if (samplePost) {
    console.log("");
    console.log(`(Sample post for S2/C1 checks: ${samplePost.id})`);
  }
}

await main();
await db.$disconnect();
