import { Avatar, AvatarFallback, AvatarImage } from "@quill/ui/components/avatar";
import { cn } from "@quill/ui/lib/utils";

export function UserAvatar({
  name,
  handle,
  image,
  size = "default",
  className,
}: {
  name: string;
  handle: string;
  image: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const initials = `${name.charAt(0)}${handle.charAt(0)}`.toUpperCase();
  return (
    <Avatar size={size} className={cn(className)}>
      {image ? <AvatarImage src={image} alt={name} /> : null}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
