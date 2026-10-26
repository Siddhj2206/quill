import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";
import { publicUserSelect, toPublicUser } from "../lib/dto";
import { createNotification, deleteNotification } from "../lib/notifications";
import { activeAccounts } from "../queries/c4-active-accounts";
import { postingActivityByHour } from "../queries/c5-posting-activity";
import { suggestedAccounts } from "../queries/c3-suggested-accounts";
import { followersOfUser, followingOfUser } from "../queries/s4-followers-of-user";
import { userCounts } from "../queries/s5-user-counts";

const handleInput = z
  .string()
  .min(3)
  .max(15)
  .regex(/^[a-z0-9_]+$/i, "Handles use letters, numbers and underscores")
  .transform((handle) => handle.toLowerCase());

export const usersRouter = router({
  handleAvailable: publicProcedure.input(handleInput).query(async ({ ctx, input }) => {
    const existing = await ctx.db.user.findUnique({
      where: { handle: input },
      select: { id: true },
    });
    return existing === null;
  }),

  profile: publicProcedure.input(handleInput).query(async ({ ctx, input }) => {
    const user = await ctx.db.user.findUnique({
      where: { handle: input },
      select: { ...publicUserSelect, createdAt: true },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "No user with that handle." });

    const counts = await userCounts(ctx.db, user.id);
    const viewerId = ctx.session?.user.id;
    const isFollowing = viewerId
      ? (await ctx.db.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
          select: { id: true },
        })) !== null
      : false;

    return {
      user: toPublicUser(user),
      createdAt: user.createdAt.toISOString(),
      counts: counts ?? { postCount: 0, followerCount: 0, followingCount: 0 },
      isFollowing,
      isViewer: viewerId === user.id,
    };
  }),

  followers: publicProcedure.input(handleInput).query(async ({ ctx, input }) => {
    const user = await ctx.db.user.findUnique({
      where: { handle: input },
      select: { id: true },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "No user with that handle." });
    return followersOfUser(ctx.db, user.id);
  }),

  following: publicProcedure.input(handleInput).query(async ({ ctx, input }) => {
    const user = await ctx.db.user.findUnique({
      where: { handle: input },
      select: { id: true },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "No user with that handle." });
    return followingOfUser(ctx.db, user.id);
  }),

  follow: protectedProcedure.input(handleInput).mutation(async ({ ctx, input }) => {
    const target = await ctx.db.user.findUnique({
      where: { handle: input },
      select: { id: true, followerCount: true },
    });
    if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "No user with that handle." });
    const viewerId = ctx.session.user.id;
    if (target.id === viewerId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot follow yourself." });
    }

    const existing = await ctx.db.follow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: target.id } },
    });
    if (existing) return { id: target.id };

    await ctx.db.$transaction(async (tx) => {
      await tx.follow.create({ data: { followerId: viewerId, followingId: target.id } });
      await tx.user.update({
        where: { id: target.id },
        data: { followerCount: { increment: 1 } },
      });
      await tx.user.update({
        where: { id: viewerId },
        data: { followingCount: { increment: 1 } },
      });
      await createNotification(tx, {
        recipientId: target.id,
        actorId: viewerId,
        type: "FOLLOW",
      });
    });

    return { id: target.id };
  }),

  unfollow: protectedProcedure.input(handleInput).mutation(async ({ ctx, input }) => {
    const target = await ctx.db.user.findUnique({
      where: { handle: input },
      select: { id: true },
    });
    if (!target) return { id: input };
    const viewerId = ctx.session.user.id;

    const existing = await ctx.db.follow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: target.id } },
    });
    if (!existing) return { id: target.id };

    await ctx.db.$transaction(async (tx) => {
      await tx.follow.delete({ where: { id: existing.id } });
      const [targetUser, viewer] = await Promise.all([
        tx.user.findUnique({ where: { id: target.id }, select: { followerCount: true } }),
        tx.user.findUnique({ where: { id: viewerId }, select: { followingCount: true } }),
      ]);
      await tx.user.update({
        where: { id: target.id },
        data: { followerCount: Math.max(0, (targetUser?.followerCount ?? 1) - 1) },
      });
      await tx.user.update({
        where: { id: viewerId },
        data: { followingCount: Math.max(0, (viewer?.followingCount ?? 1) - 1) },
      });
      await deleteNotification(tx, {
        recipientId: target.id,
        actorId: viewerId,
        type: "FOLLOW",
      });
    });

    return { id: target.id };
  }),

  suggested: publicProcedure.query(async ({ ctx }) => {
    return suggestedAccounts(ctx.db, ctx.session?.user.id ?? null);
  }),

  active: publicProcedure.query(async ({ ctx }) => {
    return activeAccounts(ctx.db);
  }),

  activity: publicProcedure.input(handleInput).query(async ({ ctx, input }) => {
    const user = await ctx.db.user.findUnique({
      where: { handle: input },
      select: { id: true },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "No user with that handle." });
    return postingActivityByHour(ctx.db, { userId: user.id });
  }),
});
