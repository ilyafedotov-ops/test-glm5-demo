import { AppShell } from "@/components/app-shell";

export default function ChangesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
