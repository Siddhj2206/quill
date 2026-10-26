"use client";

import { Button } from "@quill/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@quill/ui/components/dialog";
import { Empty, EmptyHeader, EmptyTitle } from "@quill/ui/components/empty";
import { ItemGroup } from "@quill/ui/components/item";
import { ScrollArea } from "@quill/ui/components/scroll-area";
import { Skeleton } from "@quill/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { UserRow } from "@/components/user-row";
import { useTRPC } from "@/utils/trpc";

export function FollowListDialog({
  handle,
  kind,
  children,
}: {
  handle: string;
  kind: "followers" | "following";
  children: React.ReactNode;
}) {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);

  const query = useQuery({
    ...(kind === "followers"
      ? trpc.users.followers.queryOptions(handle)
      : trpc.users.following.queryOptions(handle)),
    enabled: open,
  });

  const label = kind === "followers" ? "Followers" : "Following";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="rounded-sm text-left text-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        }
      >
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>@{handle}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          {query.isPending ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : query.isError ? (
            <div className="flex flex-col items-start gap-2 py-4">
              <p className="text-sm text-muted-foreground">Could not load {label.toLowerCase()}.</p>
              <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
                Try again
              </Button>
            </div>
          ) : query.data && query.data.length > 0 ? (
            <ItemGroup className="gap-0 divide-y divide-border">
              {query.data.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </ItemGroup>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No {label.toLowerCase()} yet.</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
