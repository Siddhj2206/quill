import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";
import { hydratePosts, postInclude } from "../lib/dto";
import {
  createNotification,
  deleteNotification,
  isUniqueConstraintError,
} from "../lib/notifications";
import { parseHashtags, parseMentions, POST_TEXT_MAX } from "../lib/text";
import { homeTimeline } from "../queries/c1-home-timeline";
import { postsByHashtag } from "../queries/s2-posts-by-hashtag";
import { postsByUser } from "../queries/s1-posts-by-user";
import { tenMostRecentPosts } from "../queries/s3-ten-most-recent-posts";

const objectId = z.string().regex(/^[0-9a-f]{24}$/, "Invalid id");

export const postsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        text: z.string().trim().min(1, "Write something first.").max(POST_TEXT_MAX),
        replyToId: objectId.nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const viewerId = ctx.session.user.id;
      const hashtags = parseHashtags(input.text);
      const mentions = parseMentions(input.text);
      const mentioned = await ctx.db.user.findMany({
        where: { handle: { in: mentions } },
        select: { id: true, handle: true },
      });

      const post = await ctx.db.$transaction(async (tx) => {
        const parent = input.replyToId
          ? await tx.post.findFirst({
              where: { id: input.replyToId, deletedAt: { isSet: false } },
              include: { author: { select: { id: true, handle: true } } },
            })
          : null;
        if (input.replyToId && !parent) {
          throw new TRPCError({ code: "NOT_FOUND", message: "That post no longer exists." });
        }

        const created = await tx.post.create({
          data: {
            authorId: viewerId,
            text: input.text,
            hashtags,
            mentions,
            replyToId: parent?.id ?? null,
          },
        });

        await tx.user.update({
          where: { id: viewerId },
          data: { postCount: { increment: 1 } },
        });

        if (parent) {
          await tx.post.update({
            where: { id: parent.id },
            data: { replyCount: { increment: 1 } },
          });
          await createNotification(tx, {
            recipientId: parent.authorId,
            actorId: viewerId,
            type: "REPLY",
            postId: created.id,
          });
        }

        for (const user of mentioned) {
          if (parent && user.id === parent.authorId) continue;
          await createNotification(tx, {
            recipientId: user.id,
            actorId: viewerId,
            type: "MENTION",
            postId: created.id,
          });
        }

        return created;
      });

      return { id: post.id };
    }),

  delete: protectedProcedure.input(objectId).mutation(async ({ ctx, input }) => {
    const post = await ctx.db.post.findUnique({ where: { id: input } });
    if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "That post no longer exists." });
    if (post.authorId !== ctx.session.user.id) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own posts." });
    }
    if (post.deletedAt) return { id: post.id };

    await ctx.db.$transaction(async (tx) => {
      await tx.post.update({ where: { id: post.id }, data: { deletedAt: new Date() } });
      const [author, parent, original] = await Promise.all([
        tx.user.findUnique({ where: { id: post.authorId }, select: { postCount: true } }),
        post.replyToId
          ? tx.post.findUnique({ where: { id: post.replyToId }, select: { replyCount: true } })
          : null,
        post.repostOfId
          ? tx.post.findUnique({ where: { id: post.repostOfId }, select: { repostCount: true } })
          : null,
      ]);

      await tx.user.update({
        where: { id: post.authorId },
        data: { postCount: Math.max(0, (author?.postCount ?? 1) - 1) },
      });
      if (post.replyToId && parent) {
        await tx.post.update({
          where: { id: post.replyToId },
          data: { replyCount: Math.max(0, parent.replyCount - 1) },
        });
      }
      if (post.repostOfId && original) {
        await tx.post.update({
          where: { id: post.repostOfId },
          data: { repostCount: Math.max(0, original.repostCount - 1) },
        });
      }
      await tx.notification.deleteMany({ where: { postId: post.id } });
    });

    return { id: post.id };
  }),

  like: protectedProcedure.input(objectId).mutation(async ({ ctx, input }) => {
    const viewerId = ctx.session.user.id;
    const post = await ctx.db.post.findFirst({ where: { id: input, deletedAt: { isSet: false } } });
    if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "That post no longer exists." });

    const targetId = post.repostOfId ?? post.id;
    const target =
      targetId === post.id
        ? post
        : await ctx.db.post.findFirst({
            where: { id: targetId, deletedAt: { isSet: false } },
          });
    if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "That post no longer exists." });

    const existing = await ctx.db.like.findUnique({
      where: { userId_postId: { userId: viewerId, postId: target.id } },
    });
    if (existing) return { id: target.id };

    try {
      await ctx.db.$transaction(async (tx) => {
        await tx.like.create({ data: { userId: viewerId, postId: target.id } });
        await tx.post.update({
          where: { id: target.id },
          data: { likeCount: { increment: 1 } },
        });
        await createNotification(tx, {
          recipientId: target.authorId,
          actorId: viewerId,
          type: "LIKE",
          postId: target.id,
        });
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }

    return { id: target.id };
  }),

  unlike: protectedProcedure.input(objectId).mutation(async ({ ctx, input }) => {
    const viewerId = ctx.session.user.id;
    const post = await ctx.db.post.findFirst({ where: { id: input, deletedAt: { isSet: false } } });
    if (!post) return { id: input };
    const targetId = post.repostOfId ?? post.id;

    const like = await ctx.db.like.findUnique({
      where: { userId_postId: { userId: viewerId, postId: targetId } },
    });
    if (!like) return { id: targetId };

    await ctx.db.$transaction(async (tx) => {
      await tx.like.delete({ where: { id: like.id } });
      const target = await tx.post.findUnique({
        where: { id: targetId },
        select: { likeCount: true, authorId: true },
      });
      if (target) {
        await tx.post.update({
          where: { id: targetId },
          data: { likeCount: Math.max(0, target.likeCount - 1) },
        });
        await deleteNotification(tx, {
          recipientId: target.authorId,
          actorId: viewerId,
          type: "LIKE",
          postId: targetId,
        });
      }
    });

    return { id: targetId };
  }),

  repost: protectedProcedure.input(objectId).mutation(async ({ ctx, input }) => {
    const viewerId = ctx.session.user.id;
    const post = await ctx.db.post.findFirst({ where: { id: input, deletedAt: { isSet: false } } });
    if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "That post no longer exists." });
    const targetId = post.repostOfId ?? post.id;

    const existing = await ctx.db.post.findFirst({
      where: { authorId: viewerId, repostOfId: targetId, deletedAt: { isSet: false } },
    });
    if (existing) return { id: existing.id };

    const repost = await ctx.db.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: { authorId: viewerId, text: "", hashtags: [], mentions: [], repostOfId: targetId },
      });
      await tx.post.update({
        where: { id: targetId },
        data: { repostCount: { increment: 1 } },
      });
      const original = await tx.post.findUnique({
        where: { id: targetId },
        select: { authorId: true },
      });
      if (original) {
        await createNotification(tx, {
          recipientId: original.authorId,
          actorId: viewerId,
          type: "REPOST",
          postId: targetId,
        });
      }
      return created;
    });

    return { id: repost.id };
  }),

  undoRepost: protectedProcedure.input(objectId).mutation(async ({ ctx, input }) => {
    const viewerId = ctx.session.user.id;
    const post = await ctx.db.post.findFirst({ where: { id: input, deletedAt: { isSet: false } } });
    if (!post) return { id: input };
    const targetId = post.repostOfId ?? post.id;

    const repost = await ctx.db.post.findFirst({
      where: { authorId: viewerId, repostOfId: targetId, deletedAt: { isSet: false } },
    });
    if (!repost) return { id: targetId };

    await ctx.db.$transaction(async (tx) => {
      await tx.post.update({ where: { id: repost.id }, data: { deletedAt: new Date() } });
      const target = await tx.post.findUnique({
        where: { id: targetId },
        select: { repostCount: true, authorId: true },
      });
      if (target) {
        await tx.post.update({
          where: { id: targetId },
          data: { repostCount: Math.max(0, target.repostCount - 1) },
        });
        await deleteNotification(tx, {
          recipientId: target.authorId,
          actorId: viewerId,
          type: "REPOST",
          postId: targetId,
        });
      }
    });

    return { id: targetId };
  }),

  home: protectedProcedure
    .input(z.object({ cursor: z.string().nullish(), limit: z.number().min(1).max(50).optional() }))
    .query(async ({ ctx, input }) => {
      return homeTimeline(ctx.db, ctx.session.user.id, input);
    }),

  latest: publicProcedure.query(async ({ ctx }) => {
    return tenMostRecentPosts(ctx.db, { viewerId: ctx.session?.user.id });
  }),

  byHashtag: publicProcedure
    .input(
      z.object({
        tag: z.string().min(1),
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(50).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return postsByHashtag(ctx.db, input.tag, {
        cursor: input.cursor,
        limit: input.limit,
        viewerId: ctx.session?.user.id,
      });
    }),

  byUser: publicProcedure
    .input(
      z.object({
        handle: z.string().min(1),
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(50).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { handle: input.handle.toLowerCase() },
        select: { id: true },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "No user with that handle." });
      return postsByUser(ctx.db, user.id, {
        cursor: input.cursor,
        limit: input.limit,
        viewerId: ctx.session?.user.id,
      });
    }),

  repliesByUser: publicProcedure
    .input(
      z.object({
        handle: z.string().min(1),
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(50).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { handle: input.handle.toLowerCase() },
        select: { id: true },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "No user with that handle." });
      const limit = input.limit ?? 20;
      const posts = await ctx.db.post.findMany({
        where: { authorId: user.id, deletedAt: { isSet: false }, replyToId: { not: null } },
        include: postInclude,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
      const items = posts.slice(0, limit);
      const last = items[items.length - 1];
      return {
        items: await hydratePosts(ctx.db, items, ctx.session?.user.id),
        nextCursor: posts.length > limit && last ? last.id : null,
      };
    }),

  likesByUser: publicProcedure
    .input(
      z.object({
        handle: z.string().min(1),
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(50).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { handle: input.handle.toLowerCase() },
        select: { id: true },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "No user with that handle." });
      const limit = input.limit ?? 20;
      const likes = await ctx.db.like.findMany({
        where: { userId: user.id, post: { deletedAt: { isSet: false } } },
        include: { post: { include: postInclude } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
      const pageLikes = likes.slice(0, limit);
      const last = pageLikes[pageLikes.length - 1];
      return {
        items: await hydratePosts(
          ctx.db,
          pageLikes.map((like) => like.post),
          ctx.session?.user.id,
        ),
        nextCursor: likes.length > limit && last ? last.id : null,
      };
    }),

  get: publicProcedure.input(objectId).query(async ({ ctx, input }) => {
    const post = await ctx.db.post.findFirst({
      where: { id: input, deletedAt: { isSet: false } },
      include: postInclude,
    });
    if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "That post no longer exists." });
    const replies = await ctx.db.post.findMany({
      where: { replyToId: post.id, deletedAt: { isSet: false } },
      include: postInclude,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 100,
    });
    const [postDto] = await hydratePosts(ctx.db, [post], ctx.session?.user.id);
    return {
      post: postDto ?? null,
      replies: await hydratePosts(ctx.db, replies, ctx.session?.user.id),
    };
  }),
});
