"use client";

import { Button } from "@quill/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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

  const follow = useMutation(
    trpc.users.follow.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
  const unfollow = useMutation(
    trpc.users.unfollow.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  if (isViewer) return null;

  const pending = follow.isPending || unfollow.isPending;

  return (
    <Button
      size={size}
      variant={isFollowing ? "outline" : "default"}
      disabled={pending}
      onClick={() => {
        if (!session) {
          router.push("/login");
          return;
        }
        if (isFollowing) unfollow.mutate(handle);
        else follow.mutate(handle);
      }}
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
