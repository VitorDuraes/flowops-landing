import "server-only";

// Rate limiter leve em memoria (janela deslizante). Suficiente para 1 instancia
// (caso do Railway no MVP). Para multi-instancia, trocar por Redis/Upstash.
// Nao substitui as defesas por requisicao (OTP com limite de tentativas + uso unico),
// e uma camada extra contra abuso (email bombing, brute-force por IP).
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    hits.set(key, arr);
    return false; // estourou o limite
  }
  arr.push(now);
  hits.set(key, arr);
  return true; // dentro do limite
}

// IP do cliente a partir dos headers de proxy (Railway/Vercel setam x-forwarded-for).
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") || "desconhecido";
}
