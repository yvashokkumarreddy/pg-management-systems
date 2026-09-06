import {
  redirect,
} from "next/navigation";

import AppShell from "@/components/layout/AppShell";

import {
  getCurrentOwner,
  UnauthorizedError,
} from "@/modules/auth/auth.service";


export default async function DashboardLayout({
  children,
}) {
  try {
    await getCurrentOwner();
  } catch (error) {
    if (
      error instanceof
      UnauthorizedError
    ) {
      redirect("/login");
    }

    throw error;
  }

  return (
    <AppShell>
      {children}
    </AppShell>
  );
}