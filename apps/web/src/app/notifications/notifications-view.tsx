"use client";

import { Badge } from "@quill/ui/components/badge";
import { Button } from "@quill/ui/components/button";
import { Empty, EmptyHeader, EmptyTitle } from "@quill/ui/components/empty";
import { Skeleton } from "@quill/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { toast } from "sonner";

import { UserAvatar } from "@/components/user-avatar";
import { useTRPC } from "@/utils/trpc";

const LABELS = {
  LIKE: "liked your post",
  REPOST: "reposted your post",
  REPLY: "replied to your post",
  FOLLOW: "followed you",
  MENTION: "mentioned you",
} as const;

export function NotificationsView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const query = useQuery(trpc.notifications.list.queryOptions());
  const markAllRead = useMutation(
    trpc.notifications.markAllRead.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex flex-col items-start gap-2 p-4">
        <p className="text-muted-foreground">Could not load notifications.</p>
        <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (query.data.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No notifications yet.</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  const hasUnread = query.data.some((notification) => notification.readAt === null);

  return (
    <div className="flex flex-col">
      <div className="flex justify-end border-b px-4 py-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasUnread || markAllRead.isPending}
          onClick={() => markAllRead.mutate()}
        >
          Mark all read
        </Button>
      </div>
      {query.data.map((notification) => (
        <div key={notification.id} className="flex items-start gap-3 border-b px-4 py-3">
          <Link href={`/${notification.actor.handle}` as Route}>
            <UserAvatar
              name={notification.actor.name}
              handle={notification.actor.handle}
              image={notification.actor.image}
            />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p>
              <Link
                href={`/${notification.actor.handle}` as Route}
                className="font-medium hover:underline"
              >
                {notification.actor.name}
              </Link>{" "}
              <span className="text-muted-foreground">{LABELS[notification.type]}</span>
            </p>
            {notification.post ? (
              <Link
                href={`/post/${notification.post.id}` as Route}
                className="truncate text-muted-foreground hover:underline"
              >
                {notification.post.text || "Repost"}
              </Link>
            ) : null}
          </div>
          {notification.readAt === null ? <Badge variant="secondary">New</Badge> : null}
        </div>
      ))}
    </div>
  );
}
