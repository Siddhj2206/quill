"use client";

import { Button } from "@quill/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/utils/trpc";

export function FollowButton({
  handle,
  isFollowing,
  isViewer,
  size = "sm",
}: {
  handle: string;
  isFollowing: boolean;
  isViewer: boolean;
  size?: "sm" | "default" | "lg";
}) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [following, setFollowing] = useState(isFollowing);

  useEffect(() => {
    setFollowing(isFollowing);
  }, [isFollowing]);

  const follow = useMutation(
    trpc.users.follow.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
      onError: (error) => {
        setFollowing(false);
        toast.error(error.message);
      },
    }),
  );
  const unfollow = useMutation(
    trpc.users.unfollow.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
      onError: (error) => {
        setFollowing(true);
        toast.error(error.message);
      },
    }),
  );

  if (isViewer) return null;

  const pending = follow.isPending || unfollow.isPending;

  return (
    <Button
      size={size}
      variant={following ? "outline" : "default"}
      disabled={pending}
      onClick={() => {
        if (!session) {
          router.push("/login");
          return;
        }
        const next = !following;
        setFollowing(next);
        if (next) follow.mutate(handle);
        else unfollow.mutate(handle);
      }}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
