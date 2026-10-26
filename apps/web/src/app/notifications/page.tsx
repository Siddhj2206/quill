import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/services";
import { NotificationsView } from "./notifications-view";

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <h1 className="border-b px-4 py-3 text-base font-medium">Notifications</h1>
      <NotificationsView />
    </div>
  );
}
