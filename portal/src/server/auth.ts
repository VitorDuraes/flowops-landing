import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import crypto from "node:crypto";
import { env } from "./env";

export const SESSION_COOKIE = "waveops_session";
const OTP_COOKIE = "waveops_otp";
const secret = new TextEncoder().encode(env.sessionSecret);

export type Role = "customer" | "admin";
export interface SessionUser {
  sub: string;
  role: Role;
  email: string;
}

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

/* ---------------- sessao ---------------- */
export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ role: user.role, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function readSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    // Valida o role contra o conjunto conhecido (defense-in-depth: nao confiar no cast).
    const role = payload.role;
    if (role !== "customer" && role !== "admin") return null;
    return { sub: String(payload.sub), role, email: String(payload.email) };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(OTP_COOKIE);
}

/* ---------------- OTP (codigo por e-mail) ---------------- */
// Codigo guardado de forma stateless num cookie assinado (hash do codigo + email +
// contador de tentativas). 6 digitos com RNG criptografico. Limite de tentativas e
// uso unico para impedir brute-force (4 digitos + Math.random + sem limite era
// vulneravel a account takeover).
const OTP_MAX_ATTEMPTS = 5;
const OTP_COOKIE_OPTS = { httpOnly: true as const, secure: env.isProd, sameSite: "lax" as const, path: "/", maxAge: 600 };

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function issueOtp(email: string): Promise<string> {
  // 6 digitos (100000..999999) com RNG criptografico.
  const code = String(crypto.randomInt(100000, 1000000));
  const token = await new SignJWT({ email: email.toLowerCase(), ch: sha256(code), n: 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret);
  const jar = await cookies();
  jar.set(OTP_COOKIE, token, OTP_COOKIE_OPTS);
  return code;
}

export async function verifyOtp(email: string, code: string): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(OTP_COOKIE)?.value;
  if (!token) return false;

  let payload: { email?: string; ch?: string; n?: number; exp?: number };
  try {
    ({ payload } = (await jwtVerify(token, secret, { algorithms: ["HS256"] })) as { payload: typeof payload });
  } catch {
    return false;
  }

  const attempts = typeof payload.n === "number" ? payload.n : 0;
  // Excedeu o limite: invalida o cookie (forca pedir novo codigo).
  if (attempts >= OTP_MAX_ATTEMPTS) {
    jar.delete(OTP_COOKIE);
    return false;
  }

  const emailOk = payload.email === email.toLowerCase();
  const codeOk = typeof payload.ch === "string" && timingSafeEqualStr(payload.ch, sha256(code));
  if (emailOk && codeOk) {
    jar.delete(OTP_COOKIE); // uso unico
    return true;
  }

  // Falhou: incrementa o contador preservando a expiracao original.
  const next = new SignJWT({ email: payload.email, ch: payload.ch, n: attempts + 1 }).setProtectedHeader({
    alg: "HS256",
  });
  if (payload.exp) next.setExpirationTime(payload.exp);
  jar.set(OTP_COOKIE, await next.sign(secret), OTP_COOKIE_OPTS);
  return false;
}

/* ---------------- senha do cliente (scrypt) ---------------- */
// Hash no formato scrypt$<salt>$<hash>. scrypt e nativo do Node (sem dependencia).
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}
export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const calc = crypto.scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqualStr(calc, hash);
}

/* ---------------- token de ativacao (definir senha pos-pagamento) ---------------- */
const ACTIVATION_PURPOSE = "activate";
export async function issueActivationToken(customerId: string, email: string): Promise<string> {
  return new SignJWT({ email: email.toLowerCase(), purpose: ACTIVATION_PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(customerId)
    .setIssuedAt()
    .setExpirationTime("48h")
    .sign(secret);
}
export async function verifyActivationToken(token: string): Promise<{ customerId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (payload.purpose !== ACTIVATION_PURPOSE) return null;
    return { customerId: String(payload.sub), email: String(payload.email) };
  } catch {
    return null;
  }
}
