import type { Database, Prisma } from "@quill/db";

import type { NotificationDto, Page, PostDto, PublicUser } from "./types";

export const publicUserSelect = {
  id: true,
  handle: true,
  name: true,
  image: true,
  bio: true,
} satisfies Prisma.UserSelect;

export const postInclude = {
  author: { select: publicUserSelect },
  replyTo: { select: { id: true, author: { select: { handle: true } } } },
  repostOf: {
    include: {
      author: { select: publicUserSelect },
      replyTo: { select: { id: true, author: { select: { handle: true } } } },
    },
  },
} satisfies Prisma.PostInclude;

export type PostWithRelations = Prisma.PostGetPayload<{ include: typeof postInclude }>;

export function toPublicUser(user: PublicUser): PublicUser {
  return {
    id: user.id,
    handle: user.handle,
    name: user.name,
    image: user.image,
    bio: user.bio,
  };
}

type FlagSets = {
  liked: Set<string>;
  reposted: Set<string>;
};

function buildPostDto(
  post: PostWithRelations,
  targetId: string,
  flags: FlagSets,
  nested = false,
): PostDto {
  return {
    id: post.id,
    text: post.text,
    hashtags: post.hashtags,
    mentions: post.mentions,
    createdAt: post.createdAt.toISOString(),
    replyToId: post.replyToId,
    repostOfId: post.repostOfId,
    likeCount: post.likeCount,
    replyCount: post.replyCount,
    repostCount: post.repostCount,
    author: toPublicUser(post.author),
    replyTo: post.replyTo ? { id: post.replyTo.id, handle: post.replyTo.author.handle } : null,
    repostOf:
      !nested && post.repostOf
        ? buildPostDto(post.repostOf as PostWithRelations, post.repostOf.id, flags, true)
        : null,
    likedByMe: flags.liked.has(targetId),
    repostedByMe: flags.reposted.has(targetId),
  };
}

/**
 * Adds the viewer-specific state (liked, reposted) to a page of posts. The
 * target of a repost is the original post, so a repost row shows the original
 * counts and the viewer's state on the original.
 */
export async function hydratePosts(
  db: Database,
  posts: PostWithRelations[],
  viewerId?: string | null,
): Promise<PostDto[]> {
  if (posts.length === 0) return [];

  const targetIds = [...new Set(posts.map((post) => post.repostOf?.id ?? post.id))];

  const [likes, reposts] = viewerId
    ? await Promise.all([
        db.like.findMany({
          where: { userId: viewerId, postId: { in: targetIds } },
          select: { postId: true },
        }),
        db.post.findMany({
          where: { authorId: viewerId, repostOfId: { in: targetIds }, deletedAt: { isSet: false } },
          select: { repostOfId: true },
        }),
      ])
    : [[], []];

  const flags: FlagSets = {
    liked: new Set(likes.map((like) => like.postId)),
    reposted: new Set(
      reposts.map((post) => post.repostOfId).filter((id): id is string => typeof id === "string"),
    ),
  };

  return posts.map((post) => buildPostDto(post, post.repostOf?.id ?? post.id, flags));
}

export function paginate<T>(items: T[], limit: number, toCursor: (item: T) => string): Page<T> {
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;
  const last = pageItems[pageItems.length - 1];
  return {
    items: pageItems,
    nextCursor: hasMore && last ? toCursor(last) : null,
  };
}

export function toNotificationDto(notification: {
  id: string;
  type: NotificationDto["type"];
  createdAt: Date;
  readAt: Date | null;
  actor: PublicUser;
  post: { id: string; text: string } | null;
}): NotificationDto {
  return {
    id: notification.id,
    type: notification.type,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt?.toISOString() ?? null,
    actor: toPublicUser(notification.actor),
    post: notification.post,
  };
}
