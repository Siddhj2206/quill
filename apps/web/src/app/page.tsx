import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/services";

export default async function RootPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  redirect(session ? "/home" : "/explore");
}
