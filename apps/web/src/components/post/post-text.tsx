import type { Route } from "next";
import Link from "next/link";

export function PostText({ text }: { text: string }) {
  if (text.length === 0) return null;
  const parts = text.split(/([#@][A-Za-z0-9_]+)/g);

  return (
    <p className="whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        const previous = parts[index - 1] ?? "";
        const startsToken = index === 0 || /\s$/.test(previous);
        if (startsToken && /^#[A-Za-z0-9_]+$/.test(part)) {
          const tag = part.slice(1).toLowerCase();
          return (
            <Link
              key={index}
              href={`/hashtag/${tag}` as Route}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {part}
            </Link>
          );
        }
        if (startsToken && /^@[A-Za-z0-9_]+$/.test(part)) {
          const handle = part.slice(1).toLowerCase();
          return (
            <Link
              key={index}
              href={`/${handle}` as Route}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {part}
            </Link>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </p>
  );
}
