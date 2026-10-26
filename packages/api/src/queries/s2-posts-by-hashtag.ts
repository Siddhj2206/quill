import type { Database } from "@quill/db";

import { findPostPage } from "../lib/post-page";
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
  const normalized = tag.toLowerCase().replace(/^#/, "");
  return findPostPage(db, { hashtags: { has: normalized } }, options);
}
