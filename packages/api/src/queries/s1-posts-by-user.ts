import type { Database } from "@quill/db";

import { findPostPage } from "../lib/post-page";
import type { Page, PostDto } from "../lib/types";

/**
 * Question: What has this user posted, newest first, excluding replies and
 * reposts?
 * Screen: Profile page, Posts tab.
 */
export async function postsByUser(
  db: Database,
  userId: string,
  options: { cursor?: string | null; viewerId?: string | null; limit?: number } = {},
): Promise<Page<PostDto>> {
  return findPostPage(db, { authorId: userId, replyToId: null, repostOfId: null }, options);
}
