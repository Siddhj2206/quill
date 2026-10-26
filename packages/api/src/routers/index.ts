import { router } from "../index";
import { notificationsRouter } from "./notifications";
import { postsRouter } from "./posts";
import { searchRouter } from "./search";
import { usersRouter } from "./users";

export const appRouter = router({
  posts: postsRouter,
  users: usersRouter,
  notifications: notificationsRouter,
  search: searchRouter,
});
export type AppRouter = typeof appRouter;
