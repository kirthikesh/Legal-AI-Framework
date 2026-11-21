import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth.ts";
import { homePath } from "@/lib/access.ts";

export default async function Home() {
  const user = await getSession();
  redirect(user ? homePath(user) : "/login");
}
