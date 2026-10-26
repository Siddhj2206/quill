import { faker } from "@faker-js/faker";

import { createAuth } from "@quill/auth";
import { createPrismaClient } from "@quill/db";

const db = createPrismaClient({ DATABASE_URL: process.env.DATABASE_URL ?? "" });
const auth = createAuth(
  {
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "",
  },
  db,
);

const PASSWORD = "quill12345";
const USER_COUNT = 50;
const POST_COUNT = 500;
const FOLLOW_COUNT = 300;
const LIKE_COUNT = 1500;

faker.seed(20260101);

const HANDLES = [
  "demo",
  "mira",
  "jonas",
  "tess",
  "amara",
  "leo",
  "priya",
  "noah",
  "ines",
  "kai",
  "sofia",
  "elias",
  "nadia",
  "marcus",
  "yuki",
  "rosa",
  "theo",
  "lena",
  "omar",
  "clara",
  "finn",
  "zoe",
  "ivan",
  "maya",
  "hugo",
  "sara",
  "dmitri",
  "ella",
  "ravi",
  "nora",
  "pablo",
  "ada",
  "luca",
  "freya",
  "samir",
  "iris",
  "ben",
  "anya",
  "kim",
  "otto",
  "lila",
  "jules",
  "mona",
  "rory",
  "tara",
  "emi",
  "vlad",
  "nina",
  "juno",
  "max",
].map((handle) => handle.replace(/_+$/, "").toLowerCase());

const BIOS = [
  "Backend engineer. Mostly databases.",
  "Writing about small teams and software.",
  "Frontend, design systems, and too much coffee.",
  "Data person. Charts are the fun part.",
  "Building tools for people who write.",
  "Computer science student.",
  "Product manager by day, reader by night.",
  "Distributed systems and long walks.",
  "Freelance developer.",
  "I test things until they break.",
  "Open source maintainer.",
  "Infrastructure, mostly.",
  "Learning in public.",
  "Designer who codes.",
  "Researcher. Ask me about query planners.",
  "Mobile developer.",
  "Just here for the timelines.",
  "Platform engineering.",
  "Technical writer.",
  "Security engineer.",
];

const TOPICS = [
  "the query planner",
  "our deploy pipeline",
  "the new index",
  "this aggregation",
  "the test suite",
  "a small side project",
  "the auth flow",
  "the schema change",
  "the cache layer",
  "a stubborn bug",
  "the onboarding docs",
  "the search endpoint",
  "the notification queue",
  "the profile page",
  "the pagination cursor",
  "the database migration",
  "the seed script",
  "the build output",
  "the error message",
  "the empty state",
];

const POST_TEMPLATES = [
  "spent the morning on {topic}. the fix was two lines.",
  "still thinking about {topic} from yesterday.",
  "wrote up what we learned from {topic}.",
  "{topic} is finally behaving.",
  "anyone else hit weird behaviour with {topic}?",
  "reading the docs for {topic} again.",
  "small win: {topic} is faster now.",
  "removed a workaround around {topic}. feels good.",
  "the tradeoffs around {topic} are more interesting than they look.",
  "spent an hour reading {topic} source. worth it.",
  "not sure {topic} is the right place for this logic yet.",
  "{topic} needed a test before it needed a rewrite.",
  "three people asked about {topic} this week, so here is a short note.",
  "I keep coming back to {topic}. there is something there.",
  "finally documented {topic}.",
  "the hard part of {topic} is naming things.",
];

const HASHTAGS = [
  "buildinpublic",
  "typescript",
  "mongodb",
  "webdev",
  "prisma",
  "nextjs",
  "databases",
  "opensource",
  "design",
  "testing",
  "career",
  "learning",
  "javascript",
  "react",
  "backend",
  "frontend",
  "performance",
  "security",
  "devtools",
  "productivity",
  "writing",
  "reading",
  "startups",
  "remotework",
  "ux",
] as const;

// Weighted so that a handful of tags dominate the 24 hour trend query.
const HASHTAG_WEIGHTS = [
  36, 24, 18, 14, 12, 11, 9, 8, 7, 7, 6, 6, 5, 5, 4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 2,
];

const EVENING_WEIGHTS = [1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 6, 5, 5, 5, 5, 5, 6, 8, 10, 11, 10, 7, 4];

function weightedPick<T>(items: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = faker.number.int({ min: 1, max: total });
  for (const [index, item] of items.entries()) {
    roll -= weights[index] ?? 1;
    if (roll <= 0) return item;
  }
  return items[items.length - 1] as T;
}

function postDate(now: Date): Date {
  // Skew days toward the present so the last 24 hours have enough posts for
  // the trending and timeline screens to look real.
  const dayWeights = Array.from({ length: 30 }, (_, index) => Math.max(1, 12 - index));
  const dayOffset = weightedPick([...Array(30).keys()], dayWeights);
  const hour = weightedPick([...Array(24).keys()], EVENING_WEIGHTS);
  // Store and group hours in UTC so the activity chart matches the seed
  // weighting regardless of the machine's timezone.
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - dayOffset);
  date.setUTCHours(
    hour,
    faker.number.int({ min: 0, max: 59 }),
    faker.number.int({ min: 0, max: 59 }),
    0,
  );
  if (date.getTime() > now.getTime()) {
    date.setUTCDate(date.getUTCDate() - 1);
  }
  return date;
}

function makeText(hashtags: string[], mentions: string[]): string {
  let text = faker.helpers
    .arrayElement(POST_TEMPLATES)
    .replace("{topic}", faker.helpers.arrayElement(TOPICS));
  if (mentions.length > 0) {
    text = `${mentions.map((mention) => `@${mention}`).join(" ")} ${text}`;
  }
  if (hashtags.length > 0) {
    text = `${text} ${hashtags.map((tag) => `#${tag}`).join(" ")}`;
  }
  return text.slice(0, 280);
}

function makeBio(): string {
  return faker.helpers.arrayElement(BIOS);
}

async function wipe() {
  await db.notification.deleteMany({});
  await db.like.deleteMany({});
  await db.follow.deleteMany({});
  // Self-relations block a plain deleteMany, so detach replies and reposts first.
  await db.post.updateMany({ data: { replyToId: null, repostOfId: null } });
  await db.post.deleteMany({});
  await db.session.deleteMany({});
  await db.account.deleteMany({});
  await db.verification.deleteMany({});
  await db.user.deleteMany({});
}

type SeededUser = { id: string; handle: string; weight: number };

async function seedUsers(): Promise<SeededUser[]> {
  const users: SeededUser[] = [];
  for (const [index, handle] of HANDLES.entries()) {
    const isDemo = handle === "demo";
    const name = isDemo ? "Demo User" : faker.person.fullName();
    const email = `${handle}@quill.dev`;
    const result = await auth.api.signUpEmail({
      body: { email, password: PASSWORD, name, handle },
    });
    await db.user.update({
      where: { id: result.user.id },
      data: { bio: isDemo ? "Testing the Quill timeline." : makeBio() },
    });
    users.push({ id: result.user.id, handle, weight: Math.max(1, 12 - index) });
  }
  return users;
}

async function seedPosts(users: SeededUser[]) {
  const now = new Date();
  const baseCount = Math.round(POST_COUNT * 0.9);

  // Build dates first so replies can point at posts that already exist.
  const postDates = Array.from({ length: baseCount }, () => postDate(now)).sort(
    (a, b) => a.getTime() - b.getTime(),
  );

  const created: { id: string; authorId: string; createdAt: Date }[] = [];

  for (const [index, createdAt] of postDates.entries()) {
    const author =
      index < 8
        ? (users[0] as SeededUser)
        : weightedPick(
            users,
            users.map((user) => user.weight),
          );
    const isReply = index > 5 && faker.number.float() < 0.15;
    const replyTo = isReply ? faker.helpers.arrayElement(created) : null;
    const tagCount = faker.number.float() < 0.4 ? faker.number.int({ min: 1, max: 3 }) : 0;
    const hashtags = Array.from(
      new Set(Array.from({ length: tagCount }, () => weightedPick(HASHTAGS, HASHTAG_WEIGHTS))),
    );
    const mentionCount = faker.number.float() < 0.2 ? faker.number.int({ min: 1, max: 2 }) : 0;
    const mentions = Array.from(
      new Set(
        Array.from({ length: mentionCount }, () => faker.helpers.arrayElement(users).handle).filter(
          (handle) => handle !== author.handle,
        ),
      ),
    );

    const post = await db.post.create({
      data: {
        authorId: author.id,
        text: makeText(hashtags, mentions),
        hashtags,
        mentions,
        replyToId: replyTo?.id ?? null,
        repostOfId: null,
        deletedAt: null,
        createdAt,
      },
    });
    created.push({ id: post.id, authorId: author.id, createdAt });
  }

  // Reposts point at an existing post and carry no text of their own.
  const repostCount = POST_COUNT - baseCount;
  for (let index = 0; index < repostCount; index += 1) {
    const author = weightedPick(
      users,
      users.map((user) => user.weight),
    );
    const original = faker.helpers.arrayElement(created);
    const createdAt = new Date(
      Math.min(
        now.getTime(),
        original.createdAt.getTime() + faker.number.int({ min: 60_000, max: 3 * 86_400_000 }),
      ),
    );
    await db.post.create({
      data: {
        authorId: author.id,
        text: "",
        hashtags: [],
        mentions: [],
        replyToId: null,
        repostOfId: original.id,
        deletedAt: null,
        createdAt,
      },
    });
  }

  return created;
}

async function seedFollows(users: SeededUser[]) {
  const pairs = new Set<string>();
  const follows: { followerId: string; followingId: string; createdAt: Date }[] = [];
  const demo = users[0] as SeededUser;
  const popular = users.slice(1, 6);

  // The demo account follows a mix of people so the home timeline is populated.
  for (const target of popular) {
    pairs.add(`${demo.id}:${target.id}`);
    follows.push({
      followerId: demo.id,
      followingId: target.id,
      createdAt: faker.date.recent({ days: 20 }),
    });
  }

  for (const target of popular) {
    const followerCount = faker.number.int({ min: 18, max: 30 });
    for (let index = 0; index < followerCount; index += 1) {
      const follower = faker.helpers.arrayElement(users);
      if (follower.id === target.id) continue;
      const key = `${follower.id}:${target.id}`;
      if (pairs.has(key)) continue;
      pairs.add(key);
      follows.push({
        followerId: follower.id,
        followingId: target.id,
        createdAt: faker.date.recent({ days: 30 }),
      });
    }
  }

  // Clustered follows: most edges stay inside a group of ten users.
  while (follows.length < FOLLOW_COUNT) {
    const group = faker.number.int({ min: 0, max: 4 });
    const fromGroup = faker.number.float() < 0.65;
    const follower = users[
      faker.number.int({ min: group * 10, max: group * 10 + 9 })
    ] as SeededUser;
    const following = fromGroup
      ? (users[faker.number.int({ min: group * 10, max: group * 10 + 9 })] as SeededUser)
      : faker.helpers.arrayElement(users);
    if (follower.id === following.id) continue;
    const key = `${follower.id}:${following.id}`;
    if (pairs.has(key)) continue;
    pairs.add(key);
    follows.push({
      followerId: follower.id,
      followingId: following.id,
      createdAt: faker.date.recent({ days: 30 }),
    });
  }

  await db.follow.createMany({ data: follows });
  return follows;
}

async function seedLikes(users: SeededUser[], posts: { id: string; authorId: string }[]) {
  const authorWeight = new Map(users.map((user) => [user.id, user.weight]));
  const weightedPosts = posts.map((post) => ({
    post,
    weight: authorWeight.get(post.authorId) ?? 1,
  }));
  const pairs = new Set<string>();
  const likes: { userId: string; postId: string; createdAt: Date }[] = [];

  while (likes.length < LIKE_COUNT) {
    const user = weightedPick(
      users,
      users.map((entry) => entry.weight),
    );
    const { post } = weightedPick(
      weightedPosts,
      weightedPosts.map((entry) => entry.weight),
    );
    if (post.authorId === user.id) continue;
    const key = `${user.id}:${post.id}`;
    if (pairs.has(key)) continue;
    pairs.add(key);
    likes.push({
      userId: user.id,
      postId: post.id,
      createdAt: faker.date.recent({ days: 30 }),
    });
  }

  await db.like.createMany({ data: likes });
  return likes;
}

async function seedNotifications(users: SeededUser[], posts: { id: string; authorId: string }[]) {
  const demo = users[0] as SeededUser;
  const demoPosts = posts.filter((post) => post.authorId === demo.id).slice(0, 6);
  const actors = users.slice(1, 8);
  const types = ["LIKE", "REPLY", "FOLLOW", "REPOST", "MENTION"] as const;

  for (const [index, actor] of actors.entries()) {
    const type = types[index % types.length] ?? "LIKE";
    await db.notification.create({
      data: {
        recipientId: demo.id,
        actorId: actor.id,
        type,
        postId: demoPosts[index % Math.max(1, demoPosts.length)]?.id ?? null,
        readAt: index < 3 ? faker.date.recent({ days: 2 }) : null,
        createdAt: faker.date.recent({ days: 3 }),
      },
    });
  }
}

async function recomputeCounts() {
  const users = await db.user.findMany({ select: { id: true } });
  for (const user of users) {
    const [followerCount, followingCount, postCount] = await Promise.all([
      db.follow.count({ where: { followingId: user.id } }),
      db.follow.count({ where: { followerId: user.id } }),
      db.post.count({
        where: { authorId: user.id, repostOfId: null, deletedAt: null },
      }),
    ]);
    await db.user.update({
      where: { id: user.id },
      data: { followerCount, followingCount, postCount },
    });
  }

  const posts = await db.post.findMany({ select: { id: true } });
  for (const post of posts) {
    const [likeCount, replyCount, repostCount] = await Promise.all([
      db.like.count({ where: { postId: post.id } }),
      db.post.count({ where: { replyToId: post.id, deletedAt: null } }),
      db.post.count({ where: { repostOfId: post.id, deletedAt: null } }),
    ]);
    await db.post.update({
      where: { id: post.id },
      data: { likeCount, replyCount, repostCount },
    });
  }
}

async function verifyCounts() {
  const [users, posts] = await Promise.all([
    db.user.findMany({
      select: {
        id: true,
        handle: true,
        followerCount: true,
        followingCount: true,
        postCount: true,
      },
    }),
    db.post.findMany({
      select: { id: true, likeCount: true, replyCount: true, repostCount: true },
    }),
  ]);

  const problems: string[] = [];

  for (const user of users) {
    const [followerCount, followingCount, postCount] = await Promise.all([
      db.follow.count({ where: { followingId: user.id } }),
      db.follow.count({ where: { followerId: user.id } }),
      db.post.count({
        where: { authorId: user.id, repostOfId: null, deletedAt: null },
      }),
    ]);
    if (user.followerCount !== followerCount) {
      problems.push(`@${user.handle}: followerCount ${user.followerCount} != ${followerCount}`);
    }
    if (user.followingCount !== followingCount) {
      problems.push(`@${user.handle}: followingCount ${user.followingCount} != ${followingCount}`);
    }
    if (user.postCount !== postCount) {
      problems.push(`@${user.handle}: postCount ${user.postCount} != ${postCount}`);
    }
  }

  for (const post of posts) {
    const [likeCount, replyCount, repostCount] = await Promise.all([
      db.like.count({ where: { postId: post.id } }),
      db.post.count({ where: { replyToId: post.id, deletedAt: null } }),
      db.post.count({ where: { repostOfId: post.id, deletedAt: null } }),
    ]);
    if (
      post.likeCount !== likeCount ||
      post.replyCount !== replyCount ||
      post.repostCount !== repostCount
    ) {
      problems.push(
        `post ${post.id}: counts ${post.likeCount}/${post.replyCount}/${post.repostCount} != ${likeCount}/${replyCount}/${repostCount}`,
      );
    }
  }

  if (problems.length > 0) {
    console.error("Count check failed:");
    for (const problem of problems.slice(0, 20)) console.error(`  ${problem}`);
    throw new Error(`${problems.length} denormalized count(s) do not match the collections`);
  }
  console.log(`Count check passed for ${users.length} users and ${posts.length} posts.`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Run this through varlock or export it first.");
  }
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET is not set.");
  }

  console.log("Wiping existing data...");
  await wipe();

  console.log(`Creating ${USER_COUNT} users through Better Auth...`);
  const users = await seedUsers();

  console.log("Creating posts...");
  const postRefs = await seedPosts(users);

  const posts = await db.post.findMany({ select: { id: true, authorId: true } });
  console.log("Creating follows...");
  await seedFollows(users);
  console.log("Creating likes...");
  await seedLikes(users, posts);
  console.log("Creating notifications...");
  await seedNotifications(users, posts);

  console.log("Recomputing denormalized counts...");
  await recomputeCounts();
  await verifyCounts();

  console.log("");
  console.log(
    `Seeded ${users.length} users, ${posts.length} posts (${postRefs.length} originals).`,
  );
  console.log(`All seeded accounts use the password: ${PASSWORD}`);
  console.log("Sign in as demo@quill.dev to see a populated home feed.");
}

await main();
await db.$disconnect();
