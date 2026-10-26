import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PageContainer, PageHeader } from "@/components/page";
import SignInForm from "@/components/sign-in-form";
import { auth } from "@/services";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/home");

  return (
    <PageContainer>
      <PageHeader title="Log in" />
      <div className="flex flex-1 items-center justify-center p-4">
        <SignInForm />
      </div>
    </PageContainer>
  );
}
