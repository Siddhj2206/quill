"use client";

import { Badge } from "@quill/ui/components/badge";
import { Button } from "@quill/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@quill/ui/components/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@quill/ui/components/item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@quill/ui/components/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AtSignIcon, HeartIcon, MessageCircleIcon, Repeat2Icon, UserPlusIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { toast } from "sonner";

import { ListSkeleton } from "@/components/list-states";
import { TimeAgo } from "@/components/time-ago";
import { useTRPC } from "@/utils/trpc";

const LABELS = {
  LIKE: "liked your post",
  REPOST: "reposted your post",
  REPLY: "replied to your post",
  FOLLOW: "followed you",
  MENTION: "mentioned you",
} as const;

const ICONS = {
  LIKE: HeartIcon,
  REPOST: Repeat2Icon,
  REPLY: MessageCircleIcon,
  FOLLOW: UserPlusIcon,
  MENTION: AtSignIcon,
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
  const markRead = useMutation(
    trpc.notifications.markRead.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  if (query.isPending) {
    return <ListSkeleton rows={4} />;
  }

  if (query.isError || !query.data) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Could not load notifications.</EmptyTitle>
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

  const notifications = query.data;
  const unread = notifications.filter((notification) => notification.readAt === null);

  function renderList(items: typeof notifications) {
    if (items.length === 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No notifications yet.</EmptyTitle>
            <EmptyDescription>Likes, replies and follows will show up here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }

    return (
      <ItemGroup className="gap-0 divide-y divide-border">
        {items.map((notification) => {
          const Icon = ICONS[notification.type];
          const href = (
            notification.post ? `/post/${notification.post.id}` : `/${notification.actor.handle}`
          ) as Route;

          return (
            <Item
              key={notification.id}
              render={<Link href={href} />}
              variant={notification.readAt === null ? "muted" : "default"}
              className="items-start rounded-none px-4 py-3 transition-colors hover:bg-muted/60"
              onClick={() => {
                if (notification.readAt === null) markRead.mutate(notification.id);
              }}
            >
              <ItemMedia>
                <span className="flex size-9 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border">
                  <Icon className="size-4" />
                </span>
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="flex-wrap">
                  <span>{notification.actor.name}</span>
                  <span className="font-normal text-muted-foreground">
                    {LABELS[notification.type]}
                  </span>
                </ItemTitle>
                {notification.post ? (
                  <ItemDescription>{notification.post.text || "Repost"}</ItemDescription>
                ) : null}
              </ItemContent>
              <ItemActions className="flex-col items-end gap-1.5">
                <span className="text-xs text-muted-foreground">
                  <TimeAgo date={notification.createdAt} />
                </span>
                {notification.readAt === null ? <Badge variant="secondary">New</Badge> : null}
              </ItemActions>
            </Item>
          );
        })}
      </ItemGroup>
    );
  }

  return (
    <Tabs defaultValue="all" className="gap-0">
      <div className="flex items-center justify-between gap-2 border-b px-4">
        <TabsList variant="line">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
        </TabsList>
        <Button
          variant="ghost"
          size="sm"
          disabled={unread.length === 0 || markAllRead.isPending}
          onClick={() => markAllRead.mutate()}
        >
          Mark all read
        </Button>
      </div>
      <TabsContent value="all">{renderList(notifications)}</TabsContent>
      <TabsContent value="unread">{renderList(unread)}</TabsContent>
    </Tabs>
  );
}
