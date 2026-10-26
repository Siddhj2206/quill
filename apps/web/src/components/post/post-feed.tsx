"use client";

import { Button } from "@quill/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@quill/ui/components/empty";
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

function PostSkeleton() {
  return (
    <div className="flex gap-3 border-b border-border px-4 py-4 last:border-b-0">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-1 h-6 w-40" />
      </div>
    </div>
  );
}

export function PostFeed({
  query,
  emptyText,
  emptyDescription,
  emptyAction,
}: {
  query: PostFeedQuery;
  emptyText: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}) {
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
      { rootMargin: "400px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [query]);

  if (query.isPending) {
    return (
      <div>
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (query.isError) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Could not load posts.</EmptyTitle>
          <EmptyDescription>Check your connection and try again.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const posts = query.data?.pages.flatMap((page) => page.items) ?? [];

  if (posts.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{emptyText}</EmptyTitle>
          {emptyDescription ? <EmptyDescription>{emptyDescription}</EmptyDescription> : null}
        </EmptyHeader>
        {emptyAction ? <EmptyContent>{emptyAction}</EmptyContent> : null}
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
        <>
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : null}
    </div>
  );
}
