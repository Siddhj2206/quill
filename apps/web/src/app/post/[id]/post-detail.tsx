"use client";

import { Button } from "@quill/ui/components/button";
import { Empty, EmptyHeader, EmptyTitle } from "@quill/ui/components/empty";
import { Skeleton } from "@quill/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";

import { PostCard } from "@/components/post/post-card";
import { useTRPC } from "@/utils/trpc";

export function PostDetail({ id }: { id: string }) {
  const trpc = useTRPC();
  const query = useQuery(trpc.posts.get.queryOptions(id));

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data.post) {
    return (
      <div className="flex flex-col items-start gap-2 p-4">
        <p className="text-muted-foreground">Could not load the post.</p>
        <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PostCard post={query.data.post} />
      <div className="border-b px-4 py-3">
        <h2 className="text-base font-medium">Replies</h2>
      </div>
      {query.data.replies.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No replies yet.</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        query.data.replies.map((reply) => <PostCard key={reply.id} post={reply} />)
      )}
    </div>
  );
}
