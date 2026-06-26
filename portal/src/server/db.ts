import "server-only";
import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// PrismaClient singleton, instanciado de forma preguicosa. So e criado quando
// ha DATABASE_URL configurado; sem banco, o app usa o repositorio mock.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (!env.hasDb()) {
    throw new Error("DATABASE_URL nao configurado: o portal esta em modo mock.");
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}
