import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PageShell } from "@/components/page-shell";
import { auth } from "@/services";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return (
    <PageShell title="Home">
      <p className="text-muted-foreground">No posts yet.</p>
    </PageShell>
  );
}
