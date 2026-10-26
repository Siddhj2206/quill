import type { Database } from "@quill/db";

import { hydratePosts, paginate, postInclude } from "../lib/dto";
import type { Page, PostDto } from "../lib/types";

/**
 * Question: What has this user posted, newest first, excluding replies?
 * Screen: Profile page, Posts tab.
 */
export async function postsByUser(
  db: Database,
  userId: string,
  options: { cursor?: string | null; viewerId?: string | null; limit?: number } = {},
): Promise<Page<PostDto>> {
  const limit = options.limit ?? 20;
  const posts = await db.post.findMany({
    where: { authorId: userId, deletedAt: { isSet: false }, replyToId: null },
    include: postInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  });

  const page = paginate(posts, limit, (post) => post.id);
  return { ...page, items: await hydratePosts(db, page.items, options.viewerId) };
}
