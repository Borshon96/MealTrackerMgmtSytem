import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_SETTINGS } from "../src/lib/defaults";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

const prisma = new PrismaClient();

async function ask(rl: readline.Interface, question: string, fallback?: string) {
  const answer = (await rl.question(question)).trim();
  return answer || fallback || "";
}

async function main() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  const existing = await prisma.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
  if (existing > 0) {
    console.log("An active admin already exists. Use the admin UI to create more users.");
    return;
  }

  const envUser = process.env.ADMIN_USERNAME?.trim();
  const envEmail = process.env.ADMIN_EMAIL?.trim();
  const envPassword = process.env.ADMIN_PASSWORD?.trim();

  let username: string;
  let email: string;
  let password: string;

  if (envUser && envEmail && envPassword && envPassword.length >= 8) {
    username = envUser;
    email = envEmail;
    password = envPassword;
  } else {
    const rl = readline.createInterface({ input, output });
    try {
      console.log("Create the first administrator account.\n");
      username = await ask(rl, "Username [admin]: ", "admin");
      email = await ask(rl, "Email [admin@local]: ", "admin@local");
      password = await ask(rl, "Password (min 8 chars): ");
      while (password.length < 8) {
        password = await ask(rl, "Password too short. Password (min 8 chars): ");
      }
    } finally {
      rl.close();
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log(`\nAdmin "${username}" created. Start the app with: npm run dev`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
