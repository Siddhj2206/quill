"use client";

import { POST_TEXT_MAX } from "@quill/api/lib/text";
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

import { PostComposerForm } from "./post-composer";

type ComposeContextValue = {
  openCompose: () => void;
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

  const openCompose = useCallback(() => {
    if (!session) {
      router.push("/login");
      return;
    }
    setOpen(true);
  }, [router, session]);

  const value = useMemo(() => ({ openCompose }), [openCompose]);

  return (
    <ComposeContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New post</DialogTitle>
            <DialogDescription>Up to {POST_TEXT_MAX} characters.</DialogDescription>
          </DialogHeader>
          <PostComposerForm autoFocus onSuccess={() => setOpen(false)} className="border-0 p-0" />
        </DialogContent>
      </Dialog>
    </ComposeContext.Provider>
  );
}
