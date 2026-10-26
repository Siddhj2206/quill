import { headers } from "next/headers";
import { redirect } from "next/navigation";

import SignUpForm from "@/components/sign-up-form";
import { auth } from "@/services";

export default async function SignupPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/home");
  return <SignUpForm />;
}
