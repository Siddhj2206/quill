import type { Database } from "@quill/db";

import { asPipeline, asRawDocs, dateFilter, rawNumber, rawString } from "../lib/raw";
import type { TrendTag } from "../lib/types";

/**
 * Question: Which hashtags were used most in the last 24 hours?
 * Screen: Explore page, trending hashtags list.
 */
export function trendingHashtagsPipeline(
  options: {
    limit?: number;
    since?: Date;
  } = {},
): Record<string, unknown>[] {
  const since = options.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  return [
    { $match: { deletedAt: null, createdAt: { $gte: dateFilter(since) } } },
    { $unwind: "$hashtags" },
    { $group: { _id: "$hashtags", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: options.limit ?? 10 },
    { $project: { _id: 0, tag: "$_id", count: 1 } },
  ];
}

export async function trendingHashtags(
  db: Database,
  options: { limit?: number; since?: Date } = {},
): Promise<TrendTag[]> {
  const raw = await db.post.aggregateRaw({
    pipeline: asPipeline(trendingHashtagsPipeline(options)),
  });

  return asRawDocs(raw).map((doc) => ({
    tag: rawString(doc.tag),
    count: rawNumber(doc.count),
  }));
}
