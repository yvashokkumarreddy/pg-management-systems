# PG Management System

Mobile-first PG (Paying Guest) Management System built with Next.js, React, JavaScript, PostgreSQL and Prisma.

## Architecture

Next.js App Router
→ API Route Handlers
→ Validation
→ Services
→ Repositories
→ Prisma
→ PostgreSQL

## Project status

Initial backend/frontend foundation only. Business modules are scaffolded and ready for implementation.

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npm run dev
```

Configure `DATABASE_URL` in `.env` before running database migrations.

## Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run prisma:seed
```
