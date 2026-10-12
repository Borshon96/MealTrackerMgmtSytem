# Office Meal Tracker — v1 Cursor Prompt (Simple Scope)

> **Goal:** Build a simple, local-first office meal management web app with an Admin Portal and Employee Portal. One Next.js project + SQLite.

## v1 scope (build this)

- Auth: ADMIN / EMPLOYEE, bcrypt, DB sessions, server-side role checks
- Admin: employees, users, daily meals, weekly billing, payments, settings, dashboard, outstanding-dues report + CSV
- Employee portal (read-mostly): dashboard, meals, billing, payments, profile + password change
- Money as integer paisa; snapshot meal price/shares on each meal
- Payments: FIFO to oldest outstanding bill; excess → `employee.creditPaisa`
- Docs: README, `.env.example`, `run.bat`

## Deferred (Phase 2 — do not build in v1)

Provider ledger, office funding ledger, payment allocation UI/reversals, bill reopen/corrections, full audit log, backup/restore UI, 8-report suite, Recharts, expansive Vitest matrix.

## Stack

Next.js App Router, TypeScript, Tailwind, shadcn/ui, Prisma + SQLite, Zod, Server Actions, date-fns, Lucide, Vitest (core tests only), npm.

## Data model (8 tables)

User, Session, Employee, MealRecord, BillingPeriod, EmployeeBill, EmployeePayment, Setting.

## Routes

- `/login`, `/` → role redirect
- Admin: `/admin`, `/employees`, `/users`, `/meals`, `/billing`, `/payments`, `/reports`, `/settings`
- Employee: `/my-dashboard`, `/meals`, `/billing`, `/payments`, `/profile`

## Rules

- Database access server-side only
- Validate mutations with Zod
- Never trust client-supplied employee IDs for employee portal data
- Bind to `127.0.0.1`; SQLite under `data/`
- No public self-registration; first admin via `npm run setup:admin`

## Acceptance

Runs locally on Windows, persists in SQLite, admin can manage meals/bills/payments, employees see only their data, settings do not rewrite historical meals, `npm run build` and `npm test` succeed.
