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
import { Skeleton } from "@quill/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { UserRow } from "@/components/user-row";
import { useTRPC } from "@/utils/trpc";

export function FollowListDialog({
  handle,
  kind,
  count,
}: {
  handle: string;
  kind: "followers" | "following";
  count: number;
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
          <Button variant="link" className="h-auto p-0 text-foreground">
            {count} {label.toLowerCase()}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>@{handle}</DialogDescription>
        </DialogHeader>
        <div className="flex max-h-80 flex-col overflow-y-auto">
          {query.isPending ? (
            <div className="flex flex-col gap-2 p-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : query.data && query.data.length > 0 ? (
            query.data.map((user) => <UserRow key={user.id} user={user} />)
          ) : (
            <p className="p-4 text-muted-foreground">No {label.toLowerCase()} yet.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
