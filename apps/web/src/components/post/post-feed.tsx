"use client";

import { Button } from "@quill/ui/components/button";
import { Empty, EmptyHeader, EmptyTitle } from "@quill/ui/components/empty";
import { Skeleton } from "@quill/ui/components/skeleton";
import { useEffect, useRef } from "react";

import type { PostDto } from "@quill/api/lib/types";

import { PostCard } from "./post-card";

type PostPage = { items: PostDto[]; nextCursor: string | null };

type PostFeedQuery = {
  data:
    | {
        pages: PostPage[];
      }
    | undefined;
  isPending: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
  refetch: () => unknown;
};

export function PostFeed({ query, emptyText }: { query: PostFeedQuery; emptyText: string }) {
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sentinel.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
          void query.fetchNextPage();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [query]);

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex flex-col items-start gap-2 p-4">
        <p className="text-muted-foreground">Could not load posts.</p>
        <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const posts = query.data?.pages.flatMap((page) => page.items) ?? [];

  if (posts.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{emptyText}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      <div ref={sentinel} className="h-8" />
      {query.isFetchingNextPage ? (
        <p className="p-2 text-center text-muted-foreground">Loading more posts.</p>
      ) : null}
    </div>
  );
}
