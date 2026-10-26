"use client";

import { Badge } from "@quill/ui/components/badge";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@quill/ui/components/item";
import { useQuery } from "@tanstack/react-query";
import { ChevronRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { FollowButton } from "@/components/follow-button";
import { ListEmpty, ListSkeleton } from "@/components/list-states";
import { SectionCard } from "@/components/section-card";
import { UserRow } from "@/components/user-row";
import { useTRPC } from "@/utils/trpc";

export function DiscoverSections({ compact = false }: { compact?: boolean }) {
  const trpc = useTRPC();
  const trending = useQuery(trpc.posts.trending.queryOptions());
  const suggested = useQuery(trpc.users.suggested.queryOptions());
  const active = useQuery(trpc.users.active.queryOptions());

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Trending" description="Hashtags in the last 24 hours.">
        {trending.isPending ? (
          <ListSkeleton />
        ) : trending.isError ? (
          <ListEmpty>Could not load trending hashtags.</ListEmpty>
        ) : trending.data && trending.data.length > 0 ? (
          <ItemGroup className="gap-0 divide-y divide-border">
            {trending.data.map((tag) => (
              <Item
                key={tag.tag}
                render={<Link href={`/hashtag/${tag.tag}` as Route} />}
                className="rounded-none px-4 transition-colors hover:bg-muted/40"
              >
                <ItemContent>
                  <ItemTitle>#{tag.tag}</ItemTitle>
                  <ItemDescription>{tag.count} posts</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge variant="secondary">{tag.count}</Badge>
                  <ChevronRightIcon className="size-4 text-muted-foreground" />
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        ) : (
          <ListEmpty>No trending hashtags yet.</ListEmpty>
        )}
      </SectionCard>

      <SectionCard title="Who to follow" description="People nearby in your graph.">
        {suggested.isPending ? (
          <ListSkeleton />
        ) : suggested.isError ? (
          <ListEmpty>Could not load suggestions.</ListEmpty>
        ) : suggested.data && suggested.data.length > 0 ? (
          <ItemGroup className="gap-0 divide-y divide-border">
            {suggested.data.map((entry) => (
              <UserRow
                key={entry.user.id}
                user={entry.user}
                showBio={!compact}
                action={
                  <FollowButton handle={entry.user.handle} isFollowing={false} isViewer={false} />
                }
              />
            ))}
          </ItemGroup>
        ) : (
          <ListEmpty>No suggestions yet.</ListEmpty>
        )}
      </SectionCard>

      <SectionCard title="Active accounts" description="Engagement per post.">
        {active.isPending ? (
          <ListSkeleton />
        ) : active.isError ? (
          <ListEmpty>Could not load active accounts.</ListEmpty>
        ) : active.data && active.data.length > 0 ? (
          <ItemGroup className="gap-0 divide-y divide-border">
            {active.data.map((entry) => (
              <UserRow
                key={entry.user.id}
                user={entry.user}
                showBio={!compact}
                action={
                  <div className="text-right">
                    <p className="text-sm font-semibold">{entry.engagementRate.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">per post</p>
                  </div>
                }
              />
            ))}
          </ItemGroup>
        ) : (
          <ListEmpty>No account activity yet.</ListEmpty>
        )}
      </SectionCard>
    </div>
  );
}
