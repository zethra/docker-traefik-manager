import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createClient();
    }
    const value = Reflect.get(globalForPrisma.prisma, prop, globalForPrisma.prisma);
    return typeof value === "function" ? value.bind(globalForPrisma.prisma) : value;
  },
});
