import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure } from "../../index";
import {
  createNotification,
  deleteNotification,
  isUniqueConstraintError,
} from "../../lib/notifications";
import { parseHashtags, parseMentions, POST_TEXT_MAX } from "../../lib/text";
import { objectIdSchema } from "../../lib/validation";

export const create = protectedProcedure
  .input(
    z.object({
      text: z.string().trim().min(1, "Write something first.").max(POST_TEXT_MAX),
      replyToId: objectIdSchema.nullish(),
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
            where: { id: input.replyToId, deletedAt: null },
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
          repostOfId: null,
          deletedAt: null,
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
  });

export const deletePost = protectedProcedure
  .input(objectIdSchema)
  .mutation(async ({ ctx, input }) => {
    const post = await ctx.db.post.findUnique({ where: { id: input } });
    if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "That post no longer exists." });
    if (post.authorId !== ctx.session.user.id) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own posts." });
    }
    if (post.deletedAt) return { id: post.id };

    await ctx.db.$transaction(async (tx) => {
      await tx.post.update({ where: { id: post.id }, data: { deletedAt: new Date() } });

      // postCount counts originals and replies, not repost rows.
      if (!post.repostOfId) {
        await tx.user.updateMany({
          where: { id: post.authorId, postCount: { gt: 0 } },
          data: { postCount: { decrement: 1 } },
        });
      }
      if (post.replyToId) {
        await tx.post.updateMany({
          where: { id: post.replyToId, replyCount: { gt: 0 } },
          data: { replyCount: { decrement: 1 } },
        });
      }
      if (post.repostOfId) {
        await tx.post.updateMany({
          where: { id: post.repostOfId, repostCount: { gt: 0 } },
          data: { repostCount: { decrement: 1 } },
        });
      }
      await tx.notification.deleteMany({ where: { postId: post.id } });
    });

    return { id: post.id };
  });

export const like = protectedProcedure.input(objectIdSchema).mutation(async ({ ctx, input }) => {
  const viewerId = ctx.session.user.id;
  const post = await ctx.db.post.findFirst({ where: { id: input, deletedAt: null } });
  if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "That post no longer exists." });

  const targetId = post.repostOfId ?? post.id;
  const target =
    targetId === post.id
      ? post
      : await ctx.db.post.findFirst({
          where: { id: targetId, deletedAt: null },
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
});

export const unlike = protectedProcedure.input(objectIdSchema).mutation(async ({ ctx, input }) => {
  const viewerId = ctx.session.user.id;
  const post = await ctx.db.post.findFirst({ where: { id: input, deletedAt: null } });
  if (!post) return { id: input };
  const targetId = post.repostOfId ?? post.id;

  const like = await ctx.db.like.findUnique({
    where: { userId_postId: { userId: viewerId, postId: targetId } },
  });
  if (!like) return { id: targetId };

  const target = await ctx.db.post.findUnique({
    where: { id: targetId },
    select: { authorId: true },
  });

  await ctx.db.$transaction(async (tx) => {
    await tx.like.delete({ where: { id: like.id } });
    if (target) {
      await tx.post.updateMany({
        where: { id: targetId, likeCount: { gt: 0 } },
        data: { likeCount: { decrement: 1 } },
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
});

export const repost = protectedProcedure.input(objectIdSchema).mutation(async ({ ctx, input }) => {
  const viewerId = ctx.session.user.id;
  const post = await ctx.db.post.findFirst({ where: { id: input, deletedAt: null } });
  if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "That post no longer exists." });
  const targetId = post.repostOfId ?? post.id;
  const target =
    targetId === post.id
      ? post
      : await ctx.db.post.findFirst({
          where: { id: targetId, deletedAt: null },
        });
  if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "That post no longer exists." });

  const existing = await ctx.db.post.findFirst({
    where: { authorId: viewerId, repostOfId: targetId, deletedAt: null },
  });
  if (existing) return { id: existing.id };

  const repost = await ctx.db.$transaction(async (tx) => {
    const created = await tx.post.create({
      data: {
        authorId: viewerId,
        text: "",
        hashtags: [],
        mentions: [],
        replyToId: null,
        repostOfId: targetId,
        deletedAt: null,
      },
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
});

export const undoRepost = protectedProcedure
  .input(objectIdSchema)
  .mutation(async ({ ctx, input }) => {
    const viewerId = ctx.session.user.id;
    const post = await ctx.db.post.findFirst({ where: { id: input, deletedAt: null } });
    if (!post) return { id: input };
    const targetId = post.repostOfId ?? post.id;

    const repost = await ctx.db.post.findFirst({
      where: { authorId: viewerId, repostOfId: targetId, deletedAt: null },
    });
    if (!repost) return { id: targetId };

    const target = await ctx.db.post.findUnique({
      where: { id: targetId },
      select: { authorId: true },
    });

    await ctx.db.$transaction(async (tx) => {
      await tx.post.update({ where: { id: repost.id }, data: { deletedAt: new Date() } });
      if (target) {
        await tx.post.updateMany({
          where: { id: targetId, repostCount: { gt: 0 } },
          data: { repostCount: { decrement: 1 } },
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
  });
