"use client";

import { usePathname } from "next/navigation";

import { DiscoverSections } from "@/components/discover";
import { SearchForm } from "@/components/search-form";

const AUTH_ROUTES = new Set(["/login", "/signup"]);

export function RightSidebar() {
  const pathname = usePathname();

  if (AUTH_ROUTES.has(pathname)) return null;

  return (
    <aside className="sticky top-0 hidden h-svh w-96 shrink-0 overflow-y-auto border-l border-border bg-background xl:block">
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 p-4 backdrop-blur">
        <SearchForm />
      </div>
      <div className="flex flex-col gap-4 p-4">
        <DiscoverSections compact />
      </div>
    </aside>
  );
}
