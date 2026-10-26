import { z } from "zod";

import { publicProcedure, router } from "../index";
import { publicUserSelect, toPublicUser } from "../lib/dto";
import { postsByHashtag } from "../queries/s2-posts-by-hashtag";

export const searchRouter = router({
  search: publicProcedure
    .input(z.object({ query: z.string().trim().min(1).max(50) }))
    .query(async ({ ctx, input }) => {
      const query = input.query.trim();
      const hashtag = query.replace(/^#/, "").toLowerCase();

      const users = await ctx.db.user.findMany({
        where: {
          OR: [
            { handle: { contains: hashtag, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
        },
        select: publicUserSelect,
        orderBy: [{ followerCount: "desc" }, { handle: "asc" }],
        take: 8,
      });

      const posts = await postsByHashtag(ctx.db, hashtag, {
        limit: 10,
        viewerId: ctx.session?.user.id,
      });

      return {
        users: users.map(toPublicUser),
        posts: posts.items,
      };
    }),
});
