/**
 * One-time: set appliedToMealsPaisa on legacy rows saved before split columns were used.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.$executeRawUnsafe(`
    UPDATE EmployeePayment
    SET appliedToMealsPaisa = amountPaisa
    WHERE appliedToMealsPaisa = 0 AND advanceCreditPaisa = 0 AND amountPaisa > 0
  `);
  console.log(`Backfilled ${updated} payment row(s).`);
}

main()
  .finally(() => prisma.$disconnect());
