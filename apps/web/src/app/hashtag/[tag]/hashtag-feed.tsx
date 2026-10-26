"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { PostFeed } from "@/components/post/post-feed";
import { useTRPC } from "@/utils/trpc";

export function HashtagFeed({ tag }: { tag: string }) {
  const trpc = useTRPC();
  const query = useInfiniteQuery(
    trpc.posts.byHashtag.infiniteQueryOptions(
      { tag, limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );
  return (
    <PostFeed
      query={query}
      emptyText="No posts with this hashtag yet."
      emptyDescription="Try another hashtag from Explore."
    />
  );
}
