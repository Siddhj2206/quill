"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@quill/ui/components/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@quill/ui/components/sidebar";
import { Skeleton } from "@quill/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { BellIcon, CompassIcon, HomeIcon, LogInIcon, PenLineIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useCompose } from "@/components/compose/compose-provider";
import { UserAvatar } from "@/components/user-avatar";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/utils/trpc";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const trpc = useTRPC();
  const { data: session, isPending } = authClient.useSession();
  const { openCompose } = useCompose();

  const unread = useQuery({
    ...trpc.notifications.unreadCount.queryOptions(),
    enabled: Boolean(session),
    refetchInterval: 30_000,
  });

  const user = session?.user;
  const profileHref = user ? (`/${user.handle}` as const) : "/login";

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href={user ? "/home" : "/explore"} />}>
              <span className="text-sm font-medium">Quill</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {isPending ? (
                <SidebarMenuItem>
                  <Skeleton className="h-8 w-full" />
                </SidebarMenuItem>
              ) : user ? (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link href="/home" />}
                      isActive={pathname === "/home"}
                    >
                      <HomeIcon />
                      <span>Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link href="/explore" />}
                      isActive={pathname === "/explore"}
                    >
                      <CompassIcon />
                      <span>Explore</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link href="/notifications" />}
                      isActive={pathname === "/notifications"}
                    >
                      <BellIcon />
                      <span>Notifications</span>
                    </SidebarMenuButton>
                    {(unread.data ?? 0) > 0 ? (
                      <SidebarMenuBadge>{unread.data}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link href={profileHref} />}
                      isActive={pathname === `/${user.handle}`}
                    >
                      <UserIcon />
                      <span>Profile</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => openCompose()}>
                      <PenLineIcon />
                      <span>Post</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              ) : (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link href="/explore" />}
                      isActive={pathname === "/explore"}
                    >
                      <CompassIcon />
                      <span>Explore</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton render={<Link href="/login" />}>
                      <LogInIcon />
                      <span>Log in</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton render={<Link href="/signup" />}>
                      <span>Sign up</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {isPending ? (
          <Skeleton className="h-12 w-full" />
        ) : user ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
                  <UserAvatar name={user.name} handle={user.handle} image={user.image ?? null} />
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-muted-foreground">@{user.handle}</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>@{user.handle}</DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem render={<Link href={profileHref} />}>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        authClient.signOut({
                          fetchOptions: {
                            onSuccess: () => {
                              router.push("/explore");
                              router.refresh();
                            },
                          },
                        });
                      }}
                    >
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <p className="px-2 text-muted-foreground">Log in to post and follow people.</p>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
