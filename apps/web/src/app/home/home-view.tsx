"use client";

import { Button } from "@quill/ui/components/button";
import { useInfiniteQuery } from "@tanstack/react-query";
import { RefreshCwIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { PostComposerForm } from "@/components/compose/post-composer";
import { PageHeader } from "@/components/page";
import { PostFeed } from "@/components/post/post-feed";
import { useTRPC } from "@/utils/trpc";

export function HomeView() {
  const trpc = useTRPC();
  const query = useInfiniteQuery(
    trpc.posts.home.infiniteQueryOptions(
      { limit: 20 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    ),
  );

  return (
    <>
      <PageHeader
        title="Home"
        actions={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Refresh timeline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCwIcon className={query.isFetching ? "animate-spin" : undefined} />
          </Button>
        }
      />
      <PostComposerForm />
      <PostFeed
        query={query}
        emptyText="No posts yet."
        emptyDescription="Follow people to fill your timeline."
        emptyAction={
          <Button variant="outline" size="sm" render={<Link href={"/explore" as Route} />}>
            Find people
          </Button>
        }
      />
    </>
  );
}
