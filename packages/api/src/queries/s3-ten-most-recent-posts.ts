import type { Database } from "@quill/db";

import { hydratePosts, postInclude } from "../lib/dto";
import type { PostDto } from "../lib/types";

/**
 * Question: What are the ten most recent posts from everyone?
 * Screen: Explore page, latest posts section.
 */
export async function tenMostRecentPosts(
  db: Database,
  options: { viewerId?: string | null; limit?: number } = {},
): Promise<PostDto[]> {
  const posts = await db.post.findMany({
    where: { deletedAt: null },
    include: postInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: options.limit ?? 10,
  });
  return hydratePosts(db, posts, options.viewerId);
}
