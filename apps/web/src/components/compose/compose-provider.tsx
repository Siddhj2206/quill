"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@quill/ui/components/dialog";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { authClient } from "@/lib/auth-client";

import { PostComposerForm, type ReplyTarget } from "./post-composer";

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
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);

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
          <PostComposerForm
            replyTo={replyTo ?? undefined}
            autoFocus
            onSuccess={() => setOpen(false)}
            className="border-0 p-0"
          />
        </DialogContent>
      </Dialog>
    </ComposeContext.Provider>
  );
}
