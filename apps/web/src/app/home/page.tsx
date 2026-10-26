import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/services";
import { HomeFeed } from "./home-feed";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <h1 className="border-b px-4 py-3 text-base font-medium">Home</h1>
      <HomeFeed />
    </div>
  );
}
