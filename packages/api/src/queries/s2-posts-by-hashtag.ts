import type { Database } from "@quill/db";

import { hydratePosts, paginate, postInclude } from "../lib/dto";
import type { Page, PostDto } from "../lib/types";

/**
 * Question: Which posts carry this hashtag, newest first?
 * Screen: Hashtag page and Explore search results.
 */
export async function postsByHashtag(
  db: Database,
  tag: string,
  options: { cursor?: string | null; viewerId?: string | null; limit?: number } = {},
): Promise<Page<PostDto>> {
  const limit = options.limit ?? 20;
  const normalized = tag.toLowerCase().replace(/^#/, "");
  const posts = await db.post.findMany({
    where: { hashtags: { has: normalized }, deletedAt: null },
    include: postInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  });

  const page = paginate(posts, limit, (post) => post.id);
  return { ...page, items: await hydratePosts(db, page.items, options.viewerId) };
}
