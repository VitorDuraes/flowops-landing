"use client";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function LogoutButton({ to }: { to: string }) {
  const router = useRouter();
  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignora */
    }
    router.push(to);
    router.refresh();
  }
  return (
    <button className="act" title="Sair" aria-label="Sair" onClick={logout}>
      <Icon name="logout" />
    </button>
  );
}
