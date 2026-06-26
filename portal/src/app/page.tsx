import { redirect } from "next/navigation";

// Entrada do portal. Os planos ficam na landing (index.html); o portal cuida do
// checkout em diante. A raiz encaminha para o login do cliente.
export default function Home() {
  redirect("/cliente/login");
}
