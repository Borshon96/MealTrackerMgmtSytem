import { resyncAllEmployeeStoredCredits } from "@/services/meal-ledger-service";

async function main() {
  const count = await resyncAllEmployeeStoredCredits();
  console.log(`Resynced stored credit for ${count} employee(s) from meal ledger.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
