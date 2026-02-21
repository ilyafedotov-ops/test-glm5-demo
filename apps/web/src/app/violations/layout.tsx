import { AppShell } from "@/components/app-shell";

export default function ViolationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
