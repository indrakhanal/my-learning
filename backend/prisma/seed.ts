import bcrypt from "bcryptjs"; import { prisma } from "../src/lib/prisma.js";
async function main() { const email = process.env.ADMIN_EMAIL ?? "admin@example.com"; const password = process.env.ADMIN_PASSWORD ?? "change-me"; await prisma.user.upsert({ where: { email }, update: {}, create: { email, name: "Administrator", passwordHash: await bcrypt.hash(password, 12) } }); }
main().finally(() => prisma.$disconnect());
