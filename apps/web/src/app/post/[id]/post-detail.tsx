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
import { useQuery } from "@tanstack/react-query";

import { PostComposerForm } from "@/components/compose/post-composer";
import { PostCard } from "@/components/post/post-card";
import { useTRPC } from "@/utils/trpc";

export function PostDetail({ id }: { id: string }) {
  const trpc = useTRPC();
  const query = useQuery(trpc.posts.get.queryOptions(id));

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data.post) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Could not load the post.</EmptyTitle>
          <EmptyDescription>It may have been deleted.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const { post, replies } = query.data;

  return (
    <div>
      <PostCard post={post} clickable={false} />

      <PostComposerForm replyTo={{ id: post.id, handle: post.author.handle }} />

      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold">Replies</h2>
        <span className="text-sm text-muted-foreground">{post.replyCount}</span>
      </div>

      {replies.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No replies yet.</EmptyTitle>
            <EmptyDescription>Be the first to reply.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        replies.map((reply) => <PostCard key={reply.id} post={reply} />)
      )}
    </div>
  );
}
