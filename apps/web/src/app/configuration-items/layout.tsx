import { AppShell } from "@/components/app-shell";

export default function ConfigurationItemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
