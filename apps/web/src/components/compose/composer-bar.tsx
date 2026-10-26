"use client";

import { Button } from "@quill/ui/components/button";
import { PenLineIcon } from "lucide-react";

import { UserAvatar } from "@/components/user-avatar";
import { authClient } from "@/lib/auth-client";
import { useCompose } from "./compose-provider";

export function ComposerBar() {
  const { data: session } = authClient.useSession();
  const { openCompose } = useCompose();

  if (!session) return null;

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <UserAvatar
        name={session.user.name}
        handle={session.user.handle}
        image={session.user.image ?? null}
        size="lg"
      />
      <Button
        variant="outline"
        className="h-9 flex-1 justify-start px-3 font-normal text-muted-foreground"
        onClick={() => openCompose()}
      >
        Write a post
      </Button>
      <Button size="lg" onClick={() => openCompose()}>
        <PenLineIcon data-icon="inline-start" />
        Post
      </Button>
    </div>
  );
}
