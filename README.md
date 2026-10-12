# Office Meal Tracker (v1)

Local-first office meal management for Windows. One Next.js app with SQLite: daily meal register, weekly billing, simple payments, admin portal, and employee self-service.

## Features (v1)

- Admin and employee login (bcrypt passwords, DB sessions)
- Employee and user management
- Daily meal register with price/share snapshots
- Weekly bill generation and period close
- Payment recording with FIFO allocation and simple credit balance
- Employee portal (own meals, bills, payments, password change)
- Outstanding dues report + CSV exports
- Settings for meal price and contribution shares (৳)

## Requirements

- Node.js 20+ recommended (21 works for local use)
- npm

## Quick start (Windows)

1. Copy environment file:

```bat
copy .env.example .env
```

2. Install and prepare the database:

```bat
npm install
mkdir data
npx prisma generate
npx prisma db push
npm run db:seed
npm run setup:admin
```

Non-interactive admin creation (optional):

```bat
set ADMIN_USERNAME=admin
set ADMIN_EMAIL=admin@local
set ADMIN_PASSWORD=your-secure-password
npm run setup:admin
```

3. Start the app:

```bat
npm run dev
```

Or double-click `run.bat` (still run `npm run setup:admin` once for the first admin).

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Production-style local run

```bat
npm run build
npm run start
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server on 127.0.0.1:3000 |
| `npm run build` / `start` | Production build and serve |
| `npm run setup:admin` | Create the first admin interactively |
| `npm run db:seed` | Seed default settings |
| `npm test` | Run Vitest unit tests |

## Money rules

- Stored as integer **paisa** (1 BDT = 100 paisa)
- Displayed as ৳
- Meal price and share percentages are snapshotted on each meal record
- Odd splits: employee share is rounded; office gets the remainder

## Assumptions / limitations

- Single local instance; do not run multiple servers against the same SQLite file
- Bound to localhost by default
- No provider ledger, office-funding module, audit log UI, or backup UI in v1
- Closed billing periods cannot be regenerated in v1

## Phase 2 backlog

Provider ledger, office funding, audit trail, backup/restore, payment reversals, bill reopen/corrections, fuller report suite.
