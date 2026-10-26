"use client";

import { Button } from "@quill/ui/components/button";
import { Textarea } from "@quill/ui/components/textarea";
import { cn } from "@quill/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/user-avatar";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/utils/trpc";

export type ReplyTarget = { id: string; handle: string };

export function PostComposerForm({
  replyTo,
  autoFocus = false,
  onSuccess,
  className,
}: {
  replyTo?: ReplyTarget;
  autoFocus?: boolean;
  onSuccess?: () => void;
  className?: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [text, setText] = useState("");

  const createPost = useMutation(
    trpc.posts.create.mutationOptions({
      onSuccess: async () => {
        setText("");
        await queryClient.invalidateQueries();
        toast.success(replyTo ? "Reply posted." : "Posted.");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  if (!session) return null;

  const remaining = 280 - text.length;
  const canSubmit = text.trim().length > 0 && remaining >= 0 && !createPost.isPending;

  return (
    <form
      className={cn("border-b border-border px-4 py-3", className)}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        createPost.mutate({ text, replyToId: replyTo?.id ?? null });
      }}
    >
      <div className="flex gap-3">
        <UserAvatar
          name={session.user.name}
          handle={session.user.handle}
          image={session.user.image ?? null}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          {replyTo ? (
            <p className="mb-1 text-xs text-muted-foreground">Replying to @{replyTo.handle}</p>
          ) : null}
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={replyTo ? "Write a reply." : "What is happening?"}
            aria-label={replyTo ? "Reply text" : "Post text"}
            autoFocus={autoFocus}
            rows={2}
            className="min-h-12 resize-none border-0 bg-transparent p-0 text-base shadow-none placeholder:text-muted-foreground focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="mt-2 flex items-center justify-end gap-3 border-t border-border pt-2">
            {text.length > 0 ? (
              <span
                className={cn(
                  "mr-auto text-xs tabular-nums",
                  remaining < 0 ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {text.length}/280
              </span>
            ) : null}
            <Button type="submit" size="sm" disabled={!canSubmit}>
              {createPost.isPending ? "Posting..." : replyTo ? "Reply" : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
