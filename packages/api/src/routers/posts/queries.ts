import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure } from "../../index";
import { hydratePosts, paginate, postInclude } from "../../lib/dto";
import { findPostPage } from "../../lib/post-page";
import { objectIdSchema } from "../../lib/validation";
import { homeTimeline } from "../../queries/c1-home-timeline";
import { trendingHashtags } from "../../queries/c2-trending-hashtags";
import { postsByHashtag } from "../../queries/s2-posts-by-hashtag";
import { postsByUser } from "../../queries/s1-posts-by-user";
import { tenMostRecentPosts } from "../../queries/s3-ten-most-recent-posts";

export const home = protectedProcedure
  .input(z.object({ cursor: z.string().nullish(), limit: z.number().min(1).max(50).optional() }))
  .query(async ({ ctx, input }) => {
    return homeTimeline(ctx.db, ctx.session.user.id, input);
  });

export const latest = publicProcedure.query(async ({ ctx }) => {
  return tenMostRecentPosts(ctx.db, { viewerId: ctx.session?.user.id });
});

export const trending = publicProcedure.query(async ({ ctx }) => {
  return trendingHashtags(ctx.db);
});

export const byHashtag = publicProcedure
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
  });

export const byUser = publicProcedure
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
  });

export const repliesByUser = publicProcedure
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
    return findPostPage(
      ctx.db,
      { authorId: user.id, replyToId: { not: null } },
      {
        cursor: input.cursor,
        limit: input.limit,
        viewerId: ctx.session?.user.id,
      },
    );
  });

export const likesByUser = publicProcedure
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
      where: { userId: user.id, post: { deletedAt: null } },
      include: { post: { include: postInclude } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });
    const page = paginate(likes, limit, (like) => like.id);
    return {
      ...page,
      items: await hydratePosts(
        ctx.db,
        page.items.map((like) => like.post),
        ctx.session?.user.id,
      ),
    };
  });

export const get = publicProcedure.input(objectIdSchema).query(async ({ ctx, input }) => {
  const post = await ctx.db.post.findFirst({
    where: { id: input, deletedAt: null },
    include: postInclude,
  });
  if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "That post no longer exists." });
  const replies = await ctx.db.post.findMany({
    where: { replyToId: post.id, deletedAt: null },
    include: postInclude,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 100,
  });
  const [postDto] = await hydratePosts(ctx.db, [post], ctx.session?.user.id);
  if (!postDto) {
    throw new TRPCError({ code: "NOT_FOUND", message: "That post no longer exists." });
  }
  return {
    post: postDto,
    replies: await hydratePosts(ctx.db, replies, ctx.session?.user.id),
  };
});
