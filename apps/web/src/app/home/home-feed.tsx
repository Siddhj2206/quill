"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { PostFeed } from "@/components/post/post-feed";
import { useTRPC } from "@/utils/trpc";

export function HomeFeed() {
  const trpc = useTRPC();
  const query = useInfiniteQuery(
    trpc.posts.home.infiniteQueryOptions(
      { limit: 20 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    ),
  );

  return <PostFeed query={query} emptyText="No posts yet. Follow people to fill your timeline." />;
}
