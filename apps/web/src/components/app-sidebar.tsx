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
  useSidebar,
} from "@quill/ui/components/sidebar";
import { useQuery } from "@tanstack/react-query";
import {
  BellIcon,
  ChevronsUpDownIcon,
  CompassIcon,
  FeatherIcon,
  HomeIcon,
  LogInIcon,
  LogOutIcon,
  PenLineIcon,
  UserIcon,
  UserPlusIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

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
  const { setOpenMobile, isMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  const unread = useQuery({
    ...trpc.notifications.unreadCount.queryOptions(),
    enabled: Boolean(session),
    refetchInterval: 30_000,
  });

  const user = session?.user;
  const profileHref = user ? (`/${user.handle}` as const) : "/login";

  return (
    <Sidebar collapsible="icon" className="bg-background">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href={user ? "/home" : "/explore"} />}
              tooltip="Quill"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FeatherIcon />
              </div>
              <span className="truncate text-base font-semibold">Quill</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {user ? (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link href="/home" />}
                      isActive={pathname === "/home"}
                      tooltip="Home"
                    >
                      <HomeIcon />
                      <span>Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link href="/explore" />}
                      isActive={pathname === "/explore"}
                      tooltip="Explore"
                    >
                      <CompassIcon />
                      <span>Explore</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link href="/notifications" />}
                      isActive={pathname === "/notifications"}
                      tooltip="Notifications"
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
                      tooltip="Profile"
                    >
                      <UserIcon />
                      <span>Profile</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              ) : (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link href="/explore" />}
                      isActive={pathname === "/explore"}
                      tooltip="Explore"
                    >
                      <CompassIcon />
                      <span>Explore</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Post"
                    onClick={() => openCompose()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  >
                    <PenLineIcon />
                    <span>Post</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        {isPending ? null : user ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      size="lg"
                      className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                    />
                  }
                >
                  <UserAvatar name={user.name} handle={user.handle} image={user.image ?? null} />
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">@{user.handle}</span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56"
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5">
                        <UserAvatar
                          name={user.name}
                          handle={user.handle}
                          image={user.image ?? null}
                        />
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-medium">{user.name}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            @{user.handle}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem render={<Link href={profileHref} />}>
                      <UserIcon />
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
                      <LogOutIcon />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/login" />} tooltip="Log in">
                <LogInIcon />
                <span>Log in</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/signup" />}
                tooltip="Sign up"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              >
                <UserPlusIcon />
                <span>Sign up</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
