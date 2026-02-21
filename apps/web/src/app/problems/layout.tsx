import { AppShell } from "@/components/app-shell";

export default function ProblemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
