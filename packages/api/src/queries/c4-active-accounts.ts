import type { Database } from "@quill/db";

import { asPipeline, asRawDocs, rawNumber, rawObjectId, rawString } from "../lib/raw";
import type { ActiveAccount } from "../lib/types";

/**
 * Question: Which users get the most engagement (likes + reposts + replies) per
 * post, counting only users with at least a minimum number of posts?
 * Screen: Explore page, active accounts list.
 */
export function activeAccountsPipeline(
  options: {
    limit?: number;
    minimumPosts?: number;
  } = {},
): Record<string, unknown>[] {
  const minimumPosts = options.minimumPosts ?? 3;
  return [
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
    { $match: { postCount: { $gte: minimumPosts } } },
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
    { $limit: options.limit ?? 5 },
    { $lookup: { from: "user", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
  ];
}

export async function activeAccounts(
  db: Database,
  options: { limit?: number; minimumPosts?: number } = {},
): Promise<ActiveAccount[]> {
  const raw = await db.post.aggregateRaw({
    pipeline: asPipeline(activeAccountsPipeline(options)),
  });

  return asRawDocs(raw).map((doc) => {
    const user = doc.user as Record<string, unknown>;
    return {
      user: {
        id: rawObjectId(user._id) ?? rawObjectId(doc._id) ?? "",
        handle: rawString(user.handle),
        name: rawString(user.name),
        image: typeof user.image === "string" ? user.image : null,
        bio: rawString(user.bio),
      },
      postCount: rawNumber(doc.postCount),
      totalEngagement: rawNumber(doc.totalEngagement),
      engagementRate: rawNumber(doc.engagementRate),
    };
  });
}
