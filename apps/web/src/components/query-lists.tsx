"use client";

import type { PostDto, PublicUser } from "@quill/api/lib/types";
import { ItemGroup } from "@quill/ui/components/item";

import { ListEmpty, ListSkeleton } from "./list-states";
import { PostCard } from "./post/post-card";
import { UserRow } from "./user-row";

export function PostListState({
  isPending,
  isError,
  posts,
  errorText,
  emptyText,
  skeletonRows,
}: {
  isPending: boolean;
  isError: boolean;
  posts: PostDto[] | undefined;
  errorText: string;
  emptyText: string;
  skeletonRows?: number;
}) {
  if (isPending) return <ListSkeleton rows={skeletonRows} />;
  if (isError) return <ListEmpty>{errorText}</ListEmpty>;
  if (!posts || posts.length === 0) return <ListEmpty>{emptyText}</ListEmpty>;
  return (
    <>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </>
  );
}

export function UserListState({
  isPending,
  isError,
  users,
  errorText,
  emptyText,
}: {
  isPending: boolean;
  isError: boolean;
  users: PublicUser[] | undefined;
  errorText: string;
  emptyText: string;
}) {
  if (isPending) return <ListSkeleton />;
  if (isError) return <ListEmpty>{errorText}</ListEmpty>;
  if (!users || users.length === 0) return <ListEmpty>{emptyText}</ListEmpty>;
  return (
    <ItemGroup className="gap-0 divide-y divide-border">
      {users.map((user) => (
        <UserRow key={user.id} user={user} />
      ))}
    </ItemGroup>
  );
}
