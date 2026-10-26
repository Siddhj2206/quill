"use client";

import { Button } from "@quill/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@quill/ui/components/dropdown-menu";
import { cn } from "@quill/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EllipsisIcon, HeartIcon, MessageCircleIcon, Repeat2Icon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { toast } from "sonner";

import { useCompose } from "@/components/compose/compose-provider";
import { TimeAgo } from "@/components/time-ago";
import { UserAvatar } from "@/components/user-avatar";
import { authClient } from "@/lib/auth-client";
import type { PostDto } from "@quill/api/lib/types";
import { useTRPC } from "@/utils/trpc";
import { PostText } from "./post-text";

export function PostCard({ post }: { post: PostDto }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const { openCompose } = useCompose();

  const display = post.repostOf ?? post;
  const isRepost = post.repostOf !== null;
  const isOwn = session?.user.id === post.author.id;

  const like = useMutation(
    trpc.posts.like.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
  const unlike = useMutation(
    trpc.posts.unlike.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
  const repost = useMutation(
    trpc.posts.repost.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
  const undoRepost = useMutation(
    trpc.posts.undoRepost.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
      onError: (error) => toast.error(error.message),
    }),
  );
  const remove = useMutation(
    trpc.posts.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
        toast.success("Post deleted.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const likePending = like.isPending || unlike.isPending;
  const repostPending = repost.isPending || undoRepost.isPending;
  const replyHref = `/post/${display.id}` as Route;

  return (
    <article className="flex gap-3 border-b px-4 py-3">
      <Link href={`/${display.author.handle}` as Route} aria-label={display.author.name}>
        <UserAvatar
          name={display.author.name}
          handle={display.author.handle}
          image={display.author.image}
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {isRepost ? (
          <p className="text-muted-foreground">Reposted by @{post.author.handle}</p>
        ) : null}

        <div className="flex items-center gap-1">
          <Link
            href={`/${display.author.handle}` as Route}
            className="truncate font-medium hover:underline"
          >
            {display.author.name}
          </Link>
          <span className="truncate text-muted-foreground">@{display.author.handle}</span>
          <span className="text-muted-foreground">·</span>
          <Link href={replyHref} className="text-muted-foreground hover:underline">
            <TimeAgo date={display.createdAt} />
          </Link>

          {isOwn ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-sm" className="ml-auto" />}
              >
                <EllipsisIcon />
                <span className="sr-only">Post menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(post.id)}
                  >
                    Delete post
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        {display.replyTo ? (
          <p className="text-muted-foreground">
            Replying to{" "}
            <Link href={`/${display.replyTo.handle}` as Route} className="hover:underline">
              @{display.replyTo.handle}
            </Link>
          </p>
        ) : null}

        <div className="text-sm">
          <PostText text={display.text} />
        </div>

        <div className="mt-1 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => openCompose({ id: display.id, handle: display.author.handle })}
          >
            <MessageCircleIcon />
            <span>{display.replyCount}</span>
            <span className="sr-only">Reply</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn("text-muted-foreground", post.repostedByMe && "text-foreground")}
            disabled={repostPending}
            onClick={() => {
              if (!session) {
                window.location.href = "/login";
                return;
              }
              if (post.repostedByMe) undoRepost.mutate(display.id);
              else repost.mutate(display.id);
            }}
          >
            <Repeat2Icon />
            <span>{display.repostCount}</span>
            <span className="sr-only">{post.repostedByMe ? "Undo repost" : "Repost"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn("text-muted-foreground", post.likedByMe && "text-destructive")}
            disabled={likePending}
            onClick={() => {
              if (!session) {
                window.location.href = "/login";
                return;
              }
              if (post.likedByMe) unlike.mutate(display.id);
              else like.mutate(display.id);
            }}
          >
            <HeartIcon className={post.likedByMe ? "fill-current" : undefined} />
            <span>{display.likeCount}</span>
            <span className="sr-only">{post.likedByMe ? "Unlike" : "Like"}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
