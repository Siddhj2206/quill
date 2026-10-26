import type { Database } from "@quill/db";

import { publicUserSelect, toPublicUser } from "../lib/dto";
import type { PublicUser } from "../lib/types";

/**
 * Question: Who follows this user?
 * Screen: Profile page, followers dialog.
 */
export async function followersOfUser(
  db: Database,
  userId: string,
  limit = 100,
): Promise<PublicUser[]> {
  const follows = await db.follow.findMany({
    where: { followingId: userId },
    include: { follower: { select: publicUserSelect } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return follows.map((follow) => toPublicUser(follow.follower));
}

/**
 * Question: Who does this user follow?
 * Screen: Profile page, following dialog.
 */
export async function followingOfUser(
  db: Database,
  userId: string,
  limit = 100,
): Promise<PublicUser[]> {
  const follows = await db.follow.findMany({
    where: { followerId: userId },
    include: { following: { select: publicUserSelect } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return follows.map((follow) => toPublicUser(follow.following));
}
