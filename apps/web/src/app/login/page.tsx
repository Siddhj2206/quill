import { headers } from "next/headers";
import { redirect } from "next/navigation";

import SignInForm from "@/components/sign-in-form";
import { auth } from "@/services";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/home");
  return <SignInForm />;
}
