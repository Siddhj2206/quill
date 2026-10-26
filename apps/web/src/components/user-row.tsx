import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@quill/ui/components/item";
import type { PublicUser } from "@quill/api/lib/types";
import type { Route } from "next";
import Link from "next/link";

import { UserAvatar } from "@/components/user-avatar";

export function UserRow({
  user,
  action,
  showBio = true,
}: {
  user: PublicUser;
  action?: React.ReactNode;
  showBio?: boolean;
}) {
  return (
    <Item className="!flex-nowrap items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
      <ItemMedia>
        <Link href={`/${user.handle}` as Route} aria-label={user.name}>
          <UserAvatar name={user.name} handle={user.handle} image={user.image} size="lg" />
        </Link>
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full min-w-0">
          <Link href={`/${user.handle}` as Route} className="min-w-0 truncate hover:underline">
            {user.name}
          </Link>
          <span className="min-w-0 truncate font-normal text-muted-foreground">@{user.handle}</span>
        </ItemTitle>
        {showBio && user.bio ? (
          <ItemDescription className="break-words">{user.bio}</ItemDescription>
        ) : null}
      </ItemContent>
      {action ? <ItemActions className="shrink-0">{action}</ItemActions> : null}
    </Item>
  );
}
