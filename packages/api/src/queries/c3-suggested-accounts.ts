import type { Database } from "@quill/db";

import { publicUserSelect, toPublicUser } from "../lib/dto";
import { asPipeline, asRawDocs, objectIdFilter, rawNumber, rawPublicUser } from "../lib/raw";
import type { SuggestedUser } from "../lib/types";

/**
 * Question: Which accounts do the people this user follows follow, ranked by
 * how many mutual follows they share, excluding the user and accounts the user
 * already follows?
 * Screen: Explore page, who to follow.
 */
export function suggestedAccountsPipeline(
  viewerId: string,
  followedIds: string[],
  limit = 5,
): Record<string, unknown>[] {
  return [
    { $match: { followerId: { $in: followedIds.map(objectIdFilter) } } },
    { $group: { _id: "$followingId", mutualCount: { $sum: 1 } } },
    {
      $match: {
        _id: {
          $nin: [viewerId, ...followedIds].map(objectIdFilter),
        },
      },
    },
    { $sort: { mutualCount: -1, _id: 1 } },
    { $limit: limit },
    { $lookup: { from: "user", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
  ];
}

export async function suggestedAccounts(
  db: Database,
  viewerId: string | null,
  limit = 5,
): Promise<SuggestedUser[]> {
  if (!viewerId) {
    const users = await db.user.findMany({
      select: publicUserSelect,
      orderBy: [{ followerCount: "desc" }, { handle: "asc" }],
      take: limit,
    });
    return users.map((user) => ({ user: toPublicUser(user), mutualCount: 0 }));
  }

  const followed = await db.follow.findMany({
    where: { followerId: viewerId },
    select: { followingId: true },
  });
  const followedIds = followed.map((follow) => follow.followingId);

  if (followedIds.length === 0) {
    const users = await db.user.findMany({
      where: { id: { not: viewerId } },
      select: publicUserSelect,
      orderBy: [{ followerCount: "desc" }, { handle: "asc" }],
      take: limit,
    });
    return users.map((user) => ({ user: toPublicUser(user), mutualCount: 0 }));
  }

  const raw = await db.follow.aggregateRaw({
    pipeline: asPipeline(suggestedAccountsPipeline(viewerId, followedIds, limit)),
  });

  return asRawDocs(raw).map((doc) => {
    return {
      user: rawPublicUser(doc.user, doc._id),
      mutualCount: rawNumber(doc.mutualCount),
    };
  });
}
