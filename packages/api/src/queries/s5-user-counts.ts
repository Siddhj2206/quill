import type { Database } from "@quill/db";

/**
 * Question: How many posts, followers and following does this user have?
 * Screen: Profile page header.
 *
 * The counters are read from the user document itself. They are maintained in
 * the same transactions as the writes, so this is a single-document read.
 */
export async function userCounts(
  db: Database,
  userId: string,
): Promise<{ postCount: number; followerCount: number; followingCount: number } | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { postCount: true, followerCount: true, followingCount: true },
  });
  return user;
}
