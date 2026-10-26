"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@quill/ui/components/card";
import { Skeleton } from "@quill/ui/components/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@quill/ui/components/tabs";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { FollowListDialog } from "@/components/follow-list-dialog";
import { FollowButton } from "@/components/follow-button";
import { PostFeed } from "@/components/post/post-feed";
import { PostingActivityChart } from "@/components/post/posting-activity-chart";
import { UserAvatar } from "@/components/user-avatar";
import { useTRPC } from "@/utils/trpc";

function UserPosts({ handle }: { handle: string }) {
  const trpc = useTRPC();
  const query = useInfiniteQuery(
    trpc.posts.byUser.infiniteQueryOptions(
      { handle, limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );
  return <PostFeed query={query} emptyText="No posts yet." />;
}

function UserReplies({ handle }: { handle: string }) {
  const trpc = useTRPC();
  const query = useInfiniteQuery(
    trpc.posts.repliesByUser.infiniteQueryOptions(
      { handle, limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );
  return <PostFeed query={query} emptyText="No replies yet." />;
}

function UserLikes({ handle }: { handle: string }) {
  const trpc = useTRPC();
  const query = useInfiniteQuery(
    trpc.posts.likesByUser.infiniteQueryOptions(
      { handle, limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    ),
  );
  return <PostFeed query={query} emptyText="No likes yet." />;
}

export function ProfileView({ handle }: { handle: string }) {
  const trpc = useTRPC();
  const query = useQuery(trpc.users.profile.queryOptions(handle));

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return <p className="p-4 text-muted-foreground">No user with that handle.</p>;
  }

  const { user, counts, isFollowing, isViewer, createdAt } = query.data;
  const joined = new Date(createdAt).toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 border-b p-4">
        <div className="flex items-start gap-3">
          <UserAvatar name={user.name} handle={user.handle} image={user.image} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-medium">{user.name}</h1>
            <p className="text-muted-foreground">@{user.handle}</p>
          </div>
          <FollowButton handle={user.handle} isFollowing={isFollowing} isViewer={isViewer} />
        </div>

        {user.bio ? <p>{user.bio}</p> : null}
        <p className="text-muted-foreground">Joined {joined}</p>

        <div className="flex items-center gap-4">
          <span>
            <span className="font-medium">{counts.postCount}</span>{" "}
            <span className="text-muted-foreground">posts</span>
          </span>
          <FollowListDialog handle={user.handle} kind="followers" count={counts.followerCount} />
          <FollowListDialog handle={user.handle} kind="following" count={counts.followingCount} />
        </div>
      </div>

      <div className="border-b p-4">
        <Card>
          <CardHeader>
            <CardTitle>Posting activity</CardTitle>
            <CardDescription>Posts by hour of day, UTC.</CardDescription>
          </CardHeader>
          <CardContent>
            <PostingActivityChart handle={user.handle} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="posts" className="gap-0">
        <TabsList variant="line" className="w-full border-b px-4">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="replies">Replies</TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          <UserPosts handle={user.handle} />
        </TabsContent>
        <TabsContent value="replies">
          <UserReplies handle={user.handle} />
        </TabsContent>
        <TabsContent value="likes">
          <UserLikes handle={user.handle} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
