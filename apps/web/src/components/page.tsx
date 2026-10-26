"use client";

import { Button } from "@quill/ui/components/button";
import { SidebarTrigger } from "@quill/ui/components/sidebar";
import { cn } from "@quill/ui/lib/utils";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex min-h-svh w-full flex-col", className)}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  actions,
  back = false,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  back?: boolean;
}) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md">
      {back ? (
        <Button variant="ghost" size="icon-sm" aria-label="Back" onClick={() => router.back()}>
          <ArrowLeftIcon />
        </Button>
      ) : (
        <SidebarTrigger className="-ml-1 md:hidden" />
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="truncate text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
