"use client";

import { Button } from "@quill/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@quill/ui/components/dialog";
import { Textarea } from "@quill/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/utils/trpc";

type ReplyTarget = { id: string; handle: string };

type ComposeContextValue = {
  openCompose: (replyTo?: ReplyTarget) => void;
};

const ComposeContext = createContext<ComposeContextValue | null>(null);

export function useCompose() {
  const context = useContext(ComposeContext);
  if (!context) throw new Error("useCompose must be used inside ComposeProvider");
  return context;
}

export function ComposeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);

  const createPost = useMutation(
    trpc.posts.create.mutationOptions({
      onSuccess: async () => {
        setOpen(false);
        setText("");
        setReplyTo(null);
        await queryClient.invalidateQueries();
        toast.success(replyTo ? "Reply posted." : "Posted.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const openCompose = useCallback(
    (target?: ReplyTarget) => {
      if (!session) {
        router.push("/login");
        return;
      }
      setReplyTo(target ?? null);
      setOpen(true);
    },
    [router, session],
  );

  const value = useMemo(() => ({ openCompose }), [openCompose]);

  const remaining = 280 - text.length;
  const canSubmit = text.trim().length > 0 && remaining >= 0 && !createPost.isPending;

  return (
    <ComposeContext.Provider value={value}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setReplyTo(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{replyTo ? "Reply" : "New post"}</DialogTitle>
            <DialogDescription>
              {replyTo ? `Replying to @${replyTo.handle}.` : "Up to 280 characters."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write a post."
            aria-label="Post text"
            autoFocus
          />
          <DialogFooter className="items-center justify-between sm:justify-between">
            <span className={remaining < 0 ? "text-destructive" : "text-muted-foreground"}>
              {text.length}/280
            </span>
            <Button
              disabled={!canSubmit}
              onClick={() => createPost.mutate({ text, replyToId: replyTo?.id ?? null })}
            >
              {createPost.isPending ? "Posting..." : "Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ComposeContext.Provider>
  );
}
