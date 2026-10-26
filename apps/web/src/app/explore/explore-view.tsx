"use client";

import { Button } from "@quill/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@quill/ui/components/tabs";
import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";

import { DiscoverSections } from "@/components/discover";
import { PostListState, UserListState } from "@/components/query-lists";
import { SearchForm } from "@/components/search-form";
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
              <UserListState
                isPending={search.isPending}
                isError={search.isError}
                users={search.data?.users}
                errorText="Could not search users."
                emptyText="No users found."
              />
            </TabsContent>

            <TabsContent value="posts">
              <PostListState
                isPending={search.isPending}
                isError={search.isError}
                posts={search.data?.posts}
                errorText="Could not search posts."
                emptyText="No posts found."
                skeletonRows={2}
              />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div>
          <div className="p-4 xl:hidden">
            <DiscoverSections />
          </div>

          <PostListState
            isPending={latest.isPending}
            isError={latest.isError}
            posts={latest.data}
            errorText="Could not load posts."
            emptyText="No posts yet."
          />
        </div>
      )}
    </>
  );
}
