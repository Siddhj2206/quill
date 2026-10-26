"use client";

import { Badge } from "@quill/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@quill/ui/components/card";
import { Empty, EmptyHeader, EmptyTitle } from "@quill/ui/components/empty";
import { Input } from "@quill/ui/components/input";
import { Skeleton } from "@quill/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import { FollowButton } from "@/components/follow-button";
import { PostCard } from "@/components/post/post-card";
import { UserRow } from "@/components/user-row";
import { useTRPC } from "@/utils/trpc";

export function ExploreView() {
  const trpc = useTRPC();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

  const trending = useQuery(trpc.posts.trending.queryOptions());
  const latest = useQuery(trpc.posts.latest.queryOptions());
  const suggested = useQuery(trpc.users.suggested.queryOptions());
  const active = useQuery(trpc.users.active.queryOptions());
  const search = useQuery({
    ...trpc.search.search.queryOptions({ query: submitted }),
    enabled: submitted.length > 0,
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(query.trim());
        }}
      >
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search users or #hashtags"
          aria-label="Search users or hashtags"
        />
      </form>

      {submitted.length > 0 ? (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {search.isPending ? (
                <Skeleton className="m-4 h-12" />
              ) : search.data && search.data.users.length > 0 ? (
                search.data.users.map((user) => <UserRow key={user.id} user={user} />)
              ) : (
                <p className="p-4 text-muted-foreground">No users found.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Posts with #{submitted.replace(/^#/, "").toLowerCase()}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {search.isPending ? (
                <Skeleton className="m-4 h-20" />
              ) : search.data && search.data.posts.length > 0 ? (
                search.data.posts.map((post) => <PostCard key={post.id} post={post} />)
              ) : (
                <p className="p-4 text-muted-foreground">No posts found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Trending</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {trending.isPending ? (
                <Skeleton className="h-16 w-full" />
              ) : trending.data && trending.data.length > 0 ? (
                trending.data.map((tag) => (
                  <div key={tag.tag} className="flex items-center justify-between gap-2">
                    <Link href={`/hashtag/${tag.tag}` as Route} className="hover:underline">
                      #{tag.tag}
                    </Link>
                    <Badge variant="secondary">{tag.count}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No trending hashtags yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Who to follow</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-0">
              {suggested.isPending ? (
                <Skeleton className="m-4 h-16" />
              ) : suggested.data && suggested.data.length > 0 ? (
                suggested.data.map((entry) => (
                  <div key={entry.user.id} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <UserRow user={entry.user} />
                    </div>
                    <div className="pr-4">
                      <FollowButton
                        handle={entry.user.handle}
                        isFollowing={false}
                        isViewer={false}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-muted-foreground">No suggestions yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active accounts</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-0">
              {active.isPending ? (
                <Skeleton className="m-4 h-16" />
              ) : active.data && active.data.length > 0 ? (
                active.data.map((entry) => (
                  <div key={entry.user.id} className="flex items-center justify-between gap-2 pr-4">
                    <UserRow user={entry.user} />
                    <div className="shrink-0 text-right text-muted-foreground">
                      <p>{entry.engagementRate.toFixed(1)} per post</p>
                      <p>{entry.postCount} posts</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-muted-foreground">No account activity yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {latest.isPending ? (
                <div className="flex flex-col gap-2 p-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : latest.data && latest.data.length > 0 ? (
                latest.data.map((post) => <PostCard key={post.id} post={post} />)
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No posts yet.</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
