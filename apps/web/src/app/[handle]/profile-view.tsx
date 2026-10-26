"use client";

import { Button } from "@quill/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@quill/ui/components/card";
import { Empty, EmptyHeader, EmptyTitle } from "@quill/ui/components/empty";
import { Skeleton } from "@quill/ui/components/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@quill/ui/components/tabs";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { CalendarIcon, PenLineIcon } from "lucide-react";
import Link from "next/link";

import { useCompose } from "@/components/compose/compose-provider";
import { FollowButton } from "@/components/follow-button";
import { FollowListDialog } from "@/components/follow-list-dialog";
import { PageHeader } from "@/components/page";
import { PostFeed } from "@/components/post/post-feed";
import { PostingActivityChart } from "@/components/post/posting-activity-chart";
import { UserAvatar } from "@/components/user-avatar";
import { useTRPC } from "@/utils/trpc";

function useProfileFeed(kind: "posts" | "replies" | "likes", handle: string) {
  const trpc = useTRPC();
  const input = { handle, limit: 20 };
  const options = {
    posts: trpc.posts.byUser.infiniteQueryOptions(input, {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }),
    replies: trpc.posts.repliesByUser.infiniteQueryOptions(input, {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }),
    likes: trpc.posts.likesByUser.infiniteQueryOptions(input, {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }),
  }[kind];
  return useInfiniteQuery(options);
}

function ProfileFeed({
  kind,
  handle,
  emptyText,
}: {
  kind: "posts" | "replies" | "likes";
  handle: string;
  emptyText: string;
}) {
  const query = useProfileFeed(kind, handle);
  return <PostFeed query={query} emptyText={emptyText} />;
}

export function ProfileView({ handle }: { handle: string }) {
  const trpc = useTRPC();
  const { openCompose } = useCompose();
  const query = useQuery(trpc.users.profile.queryOptions(handle));

  if (query.isPending) {
    return (
      <>
        <PageHeader title="Profile" />
        <div className="h-28 bg-muted" />
        <div className="flex flex-col gap-4 px-4 pb-4">
          <Skeleton className="-mt-10 size-20 rounded-full ring-4 ring-background" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-36 w-full" />
        </div>
      </>
    );
  }

  if (query.isError || !query.data) {
    return (
      <>
        <PageHeader title="Profile" />
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No user with that handle.</EmptyTitle>
          </EmptyHeader>
          <Button variant="outline" size="sm" render={<Link href="/explore" />}>
            Back to Explore
          </Button>
        </Empty>
      </>
    );
  }

  const { user, counts, isFollowing, isViewer, createdAt } = query.data;
  const joined = new Date(createdAt).toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <PageHeader
        title="Profile"
        description={`@${user.handle}`}
        actions={
          isViewer ? (
            <Button size="sm" onClick={() => openCompose()}>
              <PenLineIcon data-icon="inline-start" />
              Post
            </Button>
          ) : (
            <FollowButton handle={user.handle} isFollowing={isFollowing} isViewer={isViewer} />
          )
        }
      />

      <div className="h-28 border-b bg-muted" />

      <div className="px-4 pb-4">
        <div className="-mt-10 mb-3">
          <UserAvatar
            name={user.name}
            handle={user.handle}
            image={user.image}
            size="lg"
            className="size-20 ring-4 ring-background"
          />
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{user.name}</h1>
            <p className="text-sm text-muted-foreground">@{user.handle}</p>
          </div>

          {user.bio ? <p className="text-sm leading-relaxed">{user.bio}</p> : null}

          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarIcon className="size-4" />
            Joined {joined}
          </p>

          <div className="flex flex-wrap items-center gap-5 text-sm">
            <span>
              <span className="font-semibold">{counts.postCount}</span>{" "}
              <span className="text-muted-foreground">posts and replies</span>
            </span>
            <FollowListDialog handle={user.handle} kind="followers">
              <span className="font-semibold">{counts.followerCount}</span>{" "}
              <span className="text-muted-foreground">followers</span>
            </FollowListDialog>
            <FollowListDialog handle={user.handle} kind="following">
              <span className="font-semibold">{counts.followingCount}</span>{" "}
              <span className="text-muted-foreground">following</span>
            </FollowListDialog>
          </div>

          <Card className="mt-2">
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>Posts by hour of day, UTC.</CardDescription>
            </CardHeader>
            <CardContent>
              <PostingActivityChart handle={user.handle} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="posts" className="gap-0">
        <TabsList variant="line" className="w-full border-y px-4">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="replies">Replies</TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          <ProfileFeed kind="posts" handle={user.handle} emptyText="No posts yet." />
        </TabsContent>
        <TabsContent value="replies">
          <ProfileFeed kind="replies" handle={user.handle} emptyText="No replies yet." />
        </TabsContent>
        <TabsContent value="likes">
          <ProfileFeed kind="likes" handle={user.handle} emptyText="No likes yet." />
        </TabsContent>
      </Tabs>
    </>
  );
}
