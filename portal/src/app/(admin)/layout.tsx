import { AppShell } from "@/components/shell/AppShell";

// Painel admin: shell com sidebar administrativa (busca + sino).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell kind="admin">{children}</AppShell>;
}
