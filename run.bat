@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
)

if not exist "data" mkdir data

echo Generating Prisma client...
call npx prisma generate

echo Applying database schema...
call npx prisma db push

echo Seeding default settings...
call npm run db:seed

echo.
echo Starting Office Meal Tracker at http://127.0.0.1:3000
echo First-time setup: create an admin with  npm run setup:admin
echo.
call npm run dev
