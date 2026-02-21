import { AppShell } from "@/components/app-shell";

export default function SLADashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
