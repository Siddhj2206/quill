"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@quill/ui/components/input-group";
import { SearchIcon, XIcon } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function SearchForm({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = pathname === "/explore" ? (searchParams.get("q") ?? "") : "";
  const [value, setValue] = useState(urlQuery);

  useEffect(() => {
    setValue(urlQuery);
  }, [urlQuery]);

  function goToResults(next: string) {
    const query = next.trim();
    router.push((query ? `/explore?q=${encodeURIComponent(query)}` : "/explore") as Route);
  }

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        goToResults(value);
      }}
    >
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search people or #hashtags"
          aria-label="Search people or hashtags"
        />
        {value.length > 0 ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label="Clear search"
              onClick={() => {
                setValue("");
                if (pathname === "/explore") router.push("/explore");
              }}
            >
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    </form>
  );
}
