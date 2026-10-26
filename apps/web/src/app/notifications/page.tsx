import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PageShell } from "@/components/page-shell";
import { auth } from "@/services";

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return (
    <PageShell title="Notifications">
      <p className="text-muted-foreground">No notifications yet.</p>
    </PageShell>
  );
}
