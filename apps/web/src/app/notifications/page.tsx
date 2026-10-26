import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PageContainer, PageHeader } from "@/components/page";
import { auth } from "@/services";
import { NotificationsView } from "./notifications-view";

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <PageContainer>
      <PageHeader title="Notifications" />
      <NotificationsView />
    </PageContainer>
  );
}
