import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getBackendUrl } from "@/lib/backend-url";

export default async function EmployeesLayout({ children }: { children: ReactNode }) {
  const backendUrl = getBackendUrl();
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(`${backendUrl}/api/auth/get-session`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  }).catch(() => null);
  const session = response?.ok ? await response.json() : null;
  if (!session?.user) redirect("/login");
  return <>{children}</>;
}
