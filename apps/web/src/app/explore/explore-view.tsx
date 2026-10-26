"use client";

import { Button } from "@quill/ui/components/button";
import { ItemGroup } from "@quill/ui/components/item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@quill/ui/components/tabs";
import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";

import { DiscoverSections } from "@/components/discover";
import { ListEmpty, ListSkeleton } from "@/components/list-states";
import { PostCard } from "@/components/post/post-card";
import { SearchForm } from "@/components/search-form";
import { UserRow } from "@/components/user-row";
import { useTRPC } from "@/utils/trpc";

export function ExploreView({ initialQuery }: { initialQuery: string }) {
  const trpc = useTRPC();
  const searchActive = initialQuery.length > 0;

  const latest = useQuery(trpc.posts.latest.queryOptions());
  const search = useQuery({
    ...trpc.search.search.queryOptions({ query: initialQuery }),
    enabled: searchActive,
  });

  return (
    <>
      <div className="border-b border-border p-4 xl:hidden">
        <SearchForm />
      </div>

      {searchActive ? (
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <p className="min-w-0 truncate text-sm text-muted-foreground">
              Results for <span className="font-medium text-foreground">“{initialQuery}”</span>
            </p>
            <Button variant="ghost" size="sm" render={<Link href={"/explore" as Route} />}>
              Clear
            </Button>
          </div>

          <Tabs defaultValue="users" className="gap-0">
            <TabsList variant="line" className="w-full border-b px-4">
              <TabsTrigger value="users">
                Users{search.data ? ` (${search.data.users.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="posts">
                Posts{search.data ? ` (${search.data.posts.length})` : ""}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              {search.isPending ? (
                <ListSkeleton />
              ) : search.isError ? (
                <ListEmpty>Could not search users.</ListEmpty>
              ) : search.data && search.data.users.length > 0 ? (
                <ItemGroup className="gap-0 divide-y divide-border">
                  {search.data.users.map((user) => (
                    <UserRow key={user.id} user={user} />
                  ))}
                </ItemGroup>
              ) : (
                <ListEmpty>No users found.</ListEmpty>
              )}
            </TabsContent>

            <TabsContent value="posts">
              {search.isPending ? (
                <ListSkeleton rows={2} />
              ) : search.isError ? (
                <ListEmpty>Could not search posts.</ListEmpty>
              ) : search.data && search.data.posts.length > 0 ? (
                search.data.posts.map((post) => <PostCard key={post.id} post={post} />)
              ) : (
                <ListEmpty>No posts found.</ListEmpty>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div>
          <div className="p-4 xl:hidden">
            <DiscoverSections />
          </div>

          {latest.isPending ? (
            <ListSkeleton rows={3} />
          ) : latest.isError ? (
            <ListEmpty>Could not load posts.</ListEmpty>
          ) : latest.data && latest.data.length > 0 ? (
            latest.data.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <ListEmpty>No posts yet.</ListEmpty>
          )}
        </div>
      )}
    </>
  );
}
