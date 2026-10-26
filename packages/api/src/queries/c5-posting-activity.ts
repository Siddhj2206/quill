import type { Database } from "@quill/db";

import { asPipeline, asRawDocs, objectIdFilter, rawNumber } from "../lib/raw";
import type { HourActivity } from "../lib/types";

/**
 * Question: How many posts were created in each hour of the day, for one user
 * or for everyone?
 * Screen: Profile page, posting activity chart.
 */
export function postingActivityPipeline(userId?: string | null): Record<string, unknown>[] {
  const match: Record<string, unknown> = { deletedAt: null };
  if (userId) {
    match.authorId = objectIdFilter(userId);
  }
  return [
    { $match: match },
    { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ];
}

export async function postingActivityByHour(
  db: Database,
  options: { userId?: string | null } = {},
): Promise<HourActivity[]> {
  const raw = await db.post.aggregateRaw({
    pipeline: asPipeline(postingActivityPipeline(options.userId)),
  });

  const counts = new Map<number, number>();
  for (const doc of asRawDocs(raw)) {
    const hour = rawNumber(doc._id, -1);
    if (hour >= 0 && hour <= 23) counts.set(hour, rawNumber(doc.count));
  }

  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: counts.get(hour) ?? 0,
  }));
}
