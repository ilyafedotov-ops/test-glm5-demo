import { AppShell } from "@/components/app-shell";

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
