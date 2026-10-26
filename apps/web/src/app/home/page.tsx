import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/page";
import { auth } from "@/services";
import { HomeView } from "./home-view";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <PageContainer>
      <HomeView />
    </PageContainer>
  );
}
