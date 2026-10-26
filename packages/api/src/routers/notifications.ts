import { protectedProcedure, router } from "../index";
import { publicUserSelect, toNotificationDto } from "../lib/dto";
import { objectIdSchema } from "../lib/validation";

export const notificationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await ctx.db.notification.findMany({
      where: { recipientId: ctx.session.user.id },
      include: {
        actor: { select: publicUserSelect },
        post: { select: { id: true, text: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
    });
    return notifications.map(toNotificationDto);
  }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.notification.count({
      where: { recipientId: ctx.session.user.id, readAt: null },
    });
  }),

  markRead: protectedProcedure.input(objectIdSchema).mutation(async ({ ctx, input }) => {
    await ctx.db.notification.updateMany({
      where: { id: input, recipientId: ctx.session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.notification.updateMany({
      where: { recipientId: ctx.session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }),
});
