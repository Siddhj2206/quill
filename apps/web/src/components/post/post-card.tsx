"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@quill/ui/components/alert-dialog";
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
import { EllipsisIcon, HeartIcon, MessageCircleIcon, Repeat2Icon, Trash2Icon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { TimeAgo } from "@/components/time-ago";
import { UserAvatar } from "@/components/user-avatar";
import { authClient } from "@/lib/auth-client";
import type { PostDto } from "@quill/api/lib/types";
import { useTRPC } from "@/utils/trpc";

import { PostText } from "./post-text";

export function PostCard({ post, clickable = true }: { post: PostDto; clickable?: boolean }) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const display = post.repostOf ?? post;
  const isRepost = post.repostOf !== null;
  const isOwn = session?.user.id === post.author.id;

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(display.likeCount);
  const [reposted, setReposted] = useState(post.repostedByMe);
  const [repostCount, setRepostCount] = useState(display.repostCount);

  useEffect(() => {
    setLiked(post.likedByMe);
    setLikeCount(display.likeCount);
    setReposted(post.repostedByMe);
    setRepostCount(display.repostCount);
  }, [post.likedByMe, post.repostedByMe, display.likeCount, display.repostCount]);

  const like = useMutation(
    trpc.posts.like.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
        void queryClient.invalidateQueries();
      },
    }),
  );
  const unlike = useMutation(
    trpc.posts.unlike.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
        void queryClient.invalidateQueries();
      },
    }),
  );
  const repost = useMutation(
    trpc.posts.repost.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
        void queryClient.invalidateQueries();
      },
    }),
  );
  const undoRepost = useMutation(
    trpc.posts.undoRepost.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
        void queryClient.invalidateQueries();
      },
    }),
  );
  const remove = useMutation(
    trpc.posts.delete.mutationOptions({
      onSuccess: async () => {
        setDeleteOpen(false);
        await queryClient.invalidateQueries();
        toast.success("Post deleted.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const likePending = like.isPending || unlike.isPending;
  const repostPending = repost.isPending || undoRepost.isPending;
  const detailHref = `/post/${display.id}` as Route;

  function toggleLike() {
    if (!session) {
      router.push("/login");
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikeCount((count) => Math.max(0, count + (next ? 1 : -1)));
    if (next) like.mutate(display.id);
    else unlike.mutate(display.id);
  }

  function toggleRepost() {
    if (!session) {
      router.push("/login");
      return;
    }
    const next = !reposted;
    setReposted(next);
    setRepostCount((count) => Math.max(0, count + (next ? 1 : -1)));
    if (next) repost.mutate(display.id);
    else undoRepost.mutate(display.id);
  }

  return (
    <article
      onClick={
        clickable
          ? (event) => {
              const target = event.target as HTMLElement;
              if (target.closest("a, button, input, textarea, [role='menuitem']")) return;
              router.push(detailHref);
            }
          : undefined
      }
      className={cn(
        "group flex gap-3 border-b border-border px-4 py-4 transition-colors last:border-b-0 hover:bg-muted/40",
        clickable && "cursor-pointer",
      )}
    >
      <Link
        href={`/${display.author.handle}` as Route}
        aria-label={display.author.name}
        className="shrink-0"
      >
        <UserAvatar
          name={display.author.name}
          handle={display.author.handle}
          image={display.author.image}
          size="lg"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {isRepost ? (
              <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Repeat2Icon className="size-3.5" />
                Reposted by @{post.author.handle}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <Link
                href={`/${display.author.handle}` as Route}
                className="truncate text-sm font-semibold hover:underline"
              >
                {display.author.name}
              </Link>
              <span className="truncate text-sm text-muted-foreground">
                @{display.author.handle}
              </span>
              <span className="text-muted-foreground">·</span>
              <Link href={detailHref} className="text-sm text-muted-foreground hover:underline">
                <TimeAgo date={display.createdAt} />
              </Link>
            </div>
          </div>

          {isOwn ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" className="text-muted-foreground" />
                  }
                >
                  <EllipsisIcon />
                  <span className="sr-only">Post menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                      <Trash2Icon />
                      {isRepost ? "Remove repost" : "Delete post"}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {isRepost ? "Remove this repost?" : "Delete this post?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {isRepost
                        ? "It will disappear from your profile and timelines."
                        : "It will disappear from your profile, timelines and replies."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(post.id)}
                    >
                      {remove.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </div>

        {display.replyTo ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Replying to{" "}
            <Link
              href={`/${display.replyTo.handle}` as Route}
              className="text-primary hover:underline"
            >
              @{display.replyTo.handle}
            </Link>
          </p>
        ) : null}

        <div className="mt-1.5 max-w-prose text-sm leading-relaxed">
          <PostText text={display.text} />
        </div>

        <div className="mt-3 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => router.push(detailHref)}
          >
            <MessageCircleIcon data-icon="inline-start" />
            <span>{display.replyCount}</span>
            <span className="sr-only">View replies</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            aria-pressed={reposted}
            disabled={repostPending}
            className={cn(
              "text-muted-foreground hover:text-foreground",
              reposted && "text-foreground",
            )}
            onClick={toggleRepost}
          >
            <Repeat2Icon data-icon="inline-start" />
            <span>{repostCount}</span>
            <span className="sr-only">{reposted ? "Undo repost" : "Repost"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            aria-pressed={liked}
            disabled={likePending}
            className={cn(
              "text-muted-foreground hover:text-destructive",
              liked && "text-destructive",
            )}
            onClick={toggleLike}
          >
            <HeartIcon data-icon="inline-start" className={liked ? "fill-current" : undefined} />
            <span>{likeCount}</span>
            <span className="sr-only">{liked ? "Unlike" : "Like"}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
