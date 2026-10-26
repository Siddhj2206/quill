import type { Database, Prisma } from "@quill/db";

import type { Page, PostDto } from "./types";
import { hydratePosts, paginate, postInclude } from "./dto";

/**
 * Reads one paginated post list with the shared include, ordering and cursor.
 * Callers supply only the extra filter; deleted posts are always excluded.
 */
export async function findPostPage(
  db: Database,
  where: Prisma.PostWhereInput,
  options: { cursor?: string | null; viewerId?: string | null; limit?: number } = {},
): Promise<Page<PostDto>> {
  const limit = options.limit ?? 20;
  const posts = await db.post.findMany({
    where: { ...where, deletedAt: null },
    include: postInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
  });

  const page = paginate(posts, limit, (post) => post.id);
  return { ...page, items: await hydratePosts(db, page.items, options.viewerId) };
}
