/**
 * Removes all app data except active ADMIN user accounts (login credentials).
 * Re-applies default settings. All admins must sign in again (sessions cleared).
 */
import { PrismaClient } from "@prisma/client";
import { DEFAULT_SETTINGS } from "../src/lib/defaults";

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true, username: true },
  });

  if (admins.length === 0) {
    console.error("No active admin user found. Run npm run setup:admin first.");
    process.exit(1);
  }

  await prisma.$transaction([
    prisma.session.deleteMany(),
    prisma.employeePayment.deleteMany(),
    prisma.employeeBill.deleteMany(),
    prisma.billingPeriod.deleteMany(),
    prisma.mealRecord.deleteMany(),
    prisma.user.deleteMany({ where: { role: { not: "ADMIN" } } }),
    prisma.employee.deleteMany(),
    prisma.setting.deleteMany(),
  ]);

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.create({ data: { key, value } });
  }

  console.log(
    `Database cleared. Kept admin account(s): ${admins.map((a) => a.username).join(", ")}`
  );
  console.log("Default settings restored. Sign in again at /login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
