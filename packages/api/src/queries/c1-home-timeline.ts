import type { Database } from "@quill/db";

import { decodeCursor, encodeCursor } from "../lib/cursor";
import { hydratePosts, postInclude, type PostWithRelations } from "../lib/dto";
import {
  asPipeline,
  asRawDocs,
  dateFilter,
  objectIdFilter,
  rawDate,
  rawNumber,
  rawObjectId,
  rawString,
  rawStringArray,
  type RawDoc,
} from "../lib/raw";
import type { Page, PostDto, PublicUser } from "../lib/types";

/**
 * Question: What did the people this user follows (and the user) post, newest
 * first, one page at a time?
 * Screen: Home page, infinite scroll.
 *
 * The follow ids are fetched first so the aggregation pipeline stays readable.
 * The pipeline then matches those authors, sorts, applies the compound
 * createdAt/_id cursor, and looks up the author for every post.
 */
export function homeTimelinePipeline(
  authorIds: string[],
  options: { cursor?: string | null; limit?: number } = {},
): Record<string, unknown>[] {
  const limit = options.limit ?? 20;
  const match: Record<string, unknown> = {
    deletedAt: null,
    authorId: { $in: authorIds.map(objectIdFilter) },
  };

  const decoded = options.cursor ? decodeCursor(options.cursor) : null;
  if (decoded) {
    match.$or = [
      { createdAt: { $lt: dateFilter(decoded.createdAt) } },
      { createdAt: dateFilter(decoded.createdAt), _id: { $lt: objectIdFilter(decoded.id) } },
    ];
  }

  return [
    { $match: match },
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
  ];
}

export async function homeTimeline(
  db: Database,
  viewerId: string,
  options: { cursor?: string | null; limit?: number } = {},
): Promise<Page<PostDto>> {
  const limit = options.limit ?? 20;
  const followed = await db.follow.findMany({
    where: { followerId: viewerId },
    select: { followingId: true },
  });
  const authorIds = [viewerId, ...followed.map((follow) => follow.followingId)];

  const raw = await db.post.aggregateRaw({
    pipeline: asPipeline(homeTimelinePipeline(authorIds, options)),
  });

  const docs = asRawDocs(raw);
  const hasMore = docs.length > limit;
  const pageDocs = hasMore ? docs.slice(0, limit) : docs;

  const posts: PostWithRelations[] = pageDocs.map((doc) => {
    const author = toRawUser(doc.author);
    const replyToDoc = isDoc(doc.replyToDoc) ? doc.replyToDoc : null;
    const replyToAuthor = isDoc(doc.replyToAuthor) ? doc.replyToAuthor : null;
    return {
      id: rawObjectId(doc._id) ?? "",
      authorId: rawObjectId(doc.authorId) ?? "",
      text: rawString(doc.text),
      hashtags: rawStringArray(doc.hashtags),
      mentions: rawStringArray(doc.mentions),
      replyToId: rawObjectId(doc.replyToId),
      repostOfId: rawObjectId(doc.repostOfId),
      likeCount: rawNumber(doc.likeCount),
      replyCount: rawNumber(doc.replyCount),
      repostCount: rawNumber(doc.repostCount),
      createdAt: rawDate(doc.createdAt),
      deletedAt: null,
      author,
      replyTo:
        replyToDoc && replyToAuthor
          ? {
              id: rawObjectId(replyToDoc._id) ?? "",
              author: { handle: rawString(replyToAuthor.handle) },
            }
          : null,
      repostOf: null,
    } as PostWithRelations;
  });

  const repostIds = [
    ...new Set(posts.map((post) => post.repostOfId).filter((id): id is string => !!id)),
  ];
  const originals =
    repostIds.length > 0
      ? await db.post.findMany({ where: { id: { in: repostIds } }, include: postInclude })
      : [];
  const originalsById = new Map(originals.map((post) => [post.id, post]));
  for (const post of posts) {
    post.repostOf = (post.repostOfId ? originalsById.get(post.repostOfId) : null) ?? null;
  }

  const last = posts[posts.length - 1];
  return {
    items: await hydratePosts(db, posts, viewerId),
    nextCursor: hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
  };
}

function isDoc(value: unknown): value is RawDoc {
  return !!value && typeof value === "object";
}

function toRawUser(value: unknown): PublicUser {
  const doc = isDoc(value) ? value : {};
  return {
    id: rawObjectId(doc._id) ?? "",
    handle: rawString(doc.handle),
    name: rawString(doc.name),
    image: typeof doc.image === "string" ? doc.image : null,
    bio: rawString(doc.bio),
  };
}
