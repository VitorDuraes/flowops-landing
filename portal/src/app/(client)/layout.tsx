import { AppShell } from "@/components/shell/AppShell";

// Area do cliente: shell com sidebar do cliente.
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <AppShell kind="client">{children}</AppShell>;
}
