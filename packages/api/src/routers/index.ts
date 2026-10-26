import { protectedProcedure, publicProcedure, router } from "../index";
import { notificationsRouter } from "./notifications";
import { postsRouter } from "./posts";
import { searchRouter } from "./search";
import { usersRouter } from "./users";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  posts: postsRouter,
  users: usersRouter,
  notifications: notificationsRouter,
  search: searchRouter,
});
export type AppRouter = typeof appRouter;
