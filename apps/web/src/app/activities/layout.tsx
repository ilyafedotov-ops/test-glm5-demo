import { AppShell } from "@/components/app-shell";

export default function ActivitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
