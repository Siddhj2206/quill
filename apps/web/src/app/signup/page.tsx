import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PageContainer, PageHeader } from "@/components/page";
import SignUpForm from "@/components/sign-up-form";
import { auth } from "@/services";

export default async function SignupPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/home");

  return (
    <PageContainer>
      <PageHeader title="Sign up" />
      <div className="flex flex-1 items-center justify-center p-4">
        <SignUpForm />
      </div>
    </PageContainer>
  );
}
