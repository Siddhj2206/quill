import type { PublicUser } from "@quill/api/lib/types";
import type { Route } from "next";
import Link from "next/link";

import { UserAvatar } from "@/components/user-avatar";

export function UserRow({ user }: { user: PublicUser }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Link href={`/${user.handle}` as Route} aria-label={user.name}>
        <UserAvatar name={user.name} handle={user.handle} image={user.image} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/${user.handle}` as Route} className="font-medium hover:underline">
          {user.name}
        </Link>
        <p className="text-muted-foreground">@{user.handle}</p>
        {user.bio ? <p className="text-muted-foreground">{user.bio}</p> : null}
      </div>
    </div>
  );
}
