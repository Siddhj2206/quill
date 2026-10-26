import type { Database } from "@quill/db";

import { hydratePosts, postInclude } from "../lib/dto";
import type { PostDto } from "../lib/types";

/**
 * Question: What are the ten most recent original posts from everyone?
 * Screen: Explore page, latest posts section.
 *
 * Repost and reply rows are excluded so the Explore feed is not a wall of the
 * same original post. Reposts still appear in the home timeline.
 */
export async function tenMostRecentPosts(
  db: Database,
  options: { viewerId?: string | null; limit?: number } = {},
): Promise<PostDto[]> {
  const posts = await db.post.findMany({
    where: { deletedAt: null, repostOfId: null, replyToId: null },
    include: postInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: options.limit ?? 10,
  });
  return hydratePosts(db, posts, options.viewerId);
}
