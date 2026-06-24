// Cliente HTTP do front: chamadas GET tipadas para a API interna (/api/*).
// Sem dependencias; usado pelos hooks e telas das areas logadas.

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) {
    let message = "Não foi possível carregar os dados.";
    try {
      const body = await res.json();
      if (body && typeof body.error === "string") message = body.error;
    } catch {
      /* resposta sem corpo JSON */
    }
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as T;
}
