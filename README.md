# AI CRM Platform

An enterprise-grade, AI-powered Customer Relationship Management (CRM) platform built with Next.js, TypeScript, Prisma, and PostgreSQL. Designed to centralize customer operations, automate business workflows, and provide executives with real-time, AI-driven business intelligence powered by Google Gemini.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Roadmap](#roadmap)

## Features

- Multi-tenant Organization structure
- JWT-based authentication with refresh token rotation
- Role-Based Access Control (RBAC): Super Admin, Org Admin, Sales Manager, Sales Executive, Support Agent
- Clean Architecture backend (Repository → Service → Route Handler layers)
- AI-powered dashboards, insights, and conversational assistant (Google Gemini) — *planned*
- Customer, Lead, and Deal pipeline management — *in progress*
- Visual workflow automation builder — *planned*

## Tech Stack

**Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Shadcn/UI, Framer Motion

**Backend:** Next.js Route Handlers, Server Actions, Prisma ORM, Repository Pattern, Service Layer, Clean Architecture

**Database:** Neon PostgreSQL

**Auth:** Custom JWT (access + refresh token rotation), bcrypt password hashing, RBAC middleware

**AI:** Google Gemini API (free tier)

## Architecture

```
Presentation Layer   → src/app/api/**/route.ts
Middleware Layer      → src/lib/middleware (withAuth, withRole)
Service Layer          → src/lib/services (business logic)
Repository Layer       → src/lib/repositories (database access)
Validation Layer       → src/lib/validators (Zod schemas)
Database Layer         → prisma/schema.prisma + Neon PostgreSQL
```

Each layer only depends on the layer directly below it. Routes never call Prisma directly — all database access goes through repositories.

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A Neon PostgreSQL database (connection string)

### Installation

```powershell
git clone <your-repo-url>
cd ai-crm
npm install
```

`npm install` automatically runs `prisma generate` via the `postinstall` script.

### Environment Setup

Create a `.env` file in the project root (see [Environment Variables](#environment-variables) below).

### Run Database Migrations

```powershell
npx prisma migrate dev --name init_core_models
```

### Start Development Server

```powershell
npm run dev
```

App runs at `http://localhost:3000`.

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
JWT_ACCESS_SECRET="your_strong_random_secret"
JWT_REFRESH_SECRET="your_other_strong_random_secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret used to sign short-lived access tokens |
| `JWT_REFRESH_SECRET` | Secret used to sign long-lived refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifetime (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime (e.g. `7d`) |

## Database Setup

Prisma schema currently defines:

- **Organization** — tenant entity
- **User** — belongs to an Organization (nullable for Super Admin), has a `UserRole`
- **RefreshToken** — hashed, revocable, tied to a User

Useful commands:

```powershell
npx prisma generate          # regenerate Prisma Client
npx prisma migrate dev        # create & apply a new migration
npx prisma studio              # open Prisma Studio (visual DB browser)
```

## Project Structure

```
ai-crm/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   └── api/
│   │       └── auth/
│   │           ├── register/route.ts
│   │           ├── login/route.ts
│   │           ├── refresh/route.ts
│   │           ├── logout/route.ts
│   │           └── me/route.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── repositories/
│   │   │   ├── user.repository.ts
│   │   │   └── refreshToken.repository.ts
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   ├── validators/
│   │   │   └── auth.validator.ts
│   │   ├── middleware/
│   │   │   ├── withAuth.ts
│   │   │   └── withRole.ts
│   │   └── utils/
│   │       ├── password.ts
│   │       ├── jwt.ts
│   │       └── apiResponse.ts
│   └── types/
├── .env
└── package.json
```

## API Documentation

### Auth

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user + create Organization | No |
| POST | `/api/auth/login` | Log in with email/password | No |
| POST | `/api/auth/refresh` | Rotate refresh token, get new access token | No (needs refresh token) |
| POST | `/api/auth/logout` | Revoke a refresh token | No (needs refresh token) |
| GET | `/api/auth/me` | Get current authenticated user | Yes (Bearer access token) |

**Example — Register**

```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "[email protected]",
  "password": "password123",
  "organizationName": "Acme Inc"
}
```

**Example — Authenticated Request**

```http
GET /api/auth/me
Authorization: Bearer <accessToken>
```

All responses follow a consistent shape:

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "message": "...", "details": {...} } }
```

## Roadmap

- [x] Project setup & Clean Architecture folder structure
- [x] Prisma schema (Organization, User, RefreshToken)
- [x] JWT authentication (register, login, refresh, logout)
- [x] RBAC middleware (`withAuth`, `withRole`)
- [ ] Customer Management APIs
- [ ] Lead Management APIs
- [ ] Deal / Pipeline APIs
- [ ] Executive Dashboard & Analytics APIs
- [ ] AI Integration (Gemini): assistant, insights, forecasting
- [ ] Workflow Automation engine
- [ ] Frontend (Next.js UI)

## License

Proprietary — All rights reserved.
