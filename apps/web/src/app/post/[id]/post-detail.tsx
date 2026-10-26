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
import { MessageCircleIcon } from "lucide-react";

import { useCompose } from "@/components/compose/compose-provider";
import { PostCard } from "@/components/post/post-card";
import { UserAvatar } from "@/components/user-avatar";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/utils/trpc";

export function PostDetail({ id }: { id: string }) {
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();
  const { openCompose } = useCompose();
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
      <PostCard post={post} />

      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        {session ? (
          <UserAvatar
            name={session.user.name}
            handle={session.user.handle}
            image={session.user.image ?? null}
          />
        ) : null}
        <button
          type="button"
          onClick={() => openCompose({ id: post.id, handle: post.author.handle })}
          className="flex h-9 flex-1 items-center rounded-lg border border-border bg-muted/40 px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          Write a reply
        </button>
        <Button size="sm" onClick={() => openCompose({ id: post.id, handle: post.author.handle })}>
          <MessageCircleIcon data-icon="inline-start" />
          Reply
        </Button>
      </div>

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
