import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required to seed the administrator");
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name: "Administrator" },
    create: { email, name: "Administrator", passwordHash }
  });
  console.log(`Administrator ready: ${email}`);
}

main().finally(() => prisma.$disconnect());
