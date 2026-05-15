import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const existing = await prisma.user.findUnique({
    where: { email: adminEmail.toLowerCase() },
  });

  if (existing) {
    console.log(`Admin user ${adminEmail} already exists. Skipping.`);
  } else {
    await prisma.user.create({
      data: { email: adminEmail.toLowerCase(), passwordHash },
    });
    console.log(`Created admin user ${adminEmail}`);
  }

  await prisma.configVersion.upsert({
    where: { id: 1 },
    create: { id: 1, version: 0 },
    update: {},
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
