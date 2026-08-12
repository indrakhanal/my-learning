# 08 — Build & CI

## Build System

### Toolchain
| Tool | Purpose |
|---|---|
| npm workspaces | Monorepo management, shared `node_modules` |
| TypeScript 5 | Type checking + compilation (backend) |
| Next.js 14 | Build system for frontend (webpack/turbo) |
| `tsx` | TypeScript execution for backend dev server |
| `concurrently` | Run backend + frontend dev servers simultaneously |

---

## Root Scripts (run from `e:\Learning\my-notes`)

```powershell
npm.cmd run dev      # Start both servers concurrently
npm.cmd run build    # Build backend (tsc) then frontend (next build)
npm.cmd run test     # Run backend Vitest suite
npm.cmd run lint     # tsc --noEmit in both workspaces (type-check only)
```

## Backend Scripts (run with `--workspace=backend`)

```powershell
npm.cmd run dev --workspace=backend        # tsx watch src/server.ts (port 4000)
npm.cmd run build --workspace=backend      # tsc -> dist/
npm.cmd run start --workspace=backend      # node dist/src/server.js
npm.cmd run test --workspace=backend       # vitest run
npm.cmd run lint --workspace=backend       # tsc --noEmit
npm.cmd run prisma:generate --workspace=backend   # prisma generate
npm.cmd run prisma:migrate --workspace=backend    # prisma migrate dev
npm.cmd run prisma:seed --workspace=backend       # tsx prisma/seed.ts
```

## Frontend Scripts (run with `--workspace=frontend`)

```powershell
npm.cmd run dev --workspace=frontend       # next dev -H 0.0.0.0 (port 3000)
npm.cmd run build --workspace=frontend     # next build
npm.cmd run start --workspace=frontend     # next start
npm.cmd run lint --workspace=frontend      # tsc --noEmit
```

---

## Build Output

### Backend
- TypeScript compiles to `backend/dist/`
- Entry point: `backend/dist/src/server.js`
- `tsconfig.json`: `"outDir": "dist"`, `"target": "ES2022"`, `"module": "NodeNext"`

### Frontend
- Next.js builds to `frontend/.next/`
- The `.next/` directory is gitignored
- Static assets in `frontend/public/` are served as-is

---

## Development Server Ports

| Service | Port | URL |
|---|---|---|
| Frontend (Next.js) | 3000 | http://localhost:3000 |
| Backend (Express) | 4000 | http://localhost:4000 |
| PostgreSQL | 5432 | localhost:5432/learning_notes |

The frontend dev server binds to `0.0.0.0` (`-H 0.0.0.0`) to allow LAN access for mobile testing.

---

## Local Setup Checklist

```powershell
# Prerequisites: Node.js 20+, PostgreSQL 16+

# 1. Create PostgreSQL user and database
# Run in psql as superuser:
# CREATE USER notes WITH PASSWORD 'notes';
# CREATE DATABASE learning_notes OWNER notes;

# 2. Configure environment
# Copy .env.example to backend/.env and fill in JWT_SECRET, ADMIN_PASSWORD
# Create frontend/.env.local with: NEXT_PUBLIC_API_URL=http://localhost:4000/api

# 3. Install dependencies
npm.cmd install

# 4. Set up database
npm.cmd run prisma:generate --workspace=backend
npm.cmd run prisma:migrate --workspace=backend -- --name init
npm.cmd run prisma:seed --workspace=backend

# 5. Start dev servers
npm.cmd run dev
```

---

## CI/CD Expectations

The `.github/workflows/` directory is currently empty. When adding CI:

### Recommended GitHub Actions workflow

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: notes
          POSTGRES_PASSWORD: notes
          POSTGRES_DB: learning_notes
        ports: ["5432:5432"]
    env:
      DATABASE_URL: postgresql://notes:notes@localhost:5432/learning_notes
      JWT_SECRET: test-secret-at-least-32-characters-long
      ADMIN_EMAIL: admin@test.com
      ADMIN_PASSWORD: testpassword
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run prisma:generate --workspace=backend
      - run: npm run prisma:migrate --workspace=backend -- --name ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

---

## Type Checking

Type checking is the lint step:
```powershell
npm.cmd run lint   # runs tsc --noEmit in both workspaces
```

Backend `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist"
  }
}
```

Frontend `tsconfig.json`:
- Extends Next.js defaults
- Strict mode enabled

---

## Common Build Errors

| Error | Cause | Fix |
|---|---|---|
| `Cannot find module '@prisma/client'` | Prisma client not generated | Run `npm run prisma:generate --workspace=backend` |
| `PrismaClientInitializationError` | `DATABASE_URL` missing or wrong | Check `backend/.env` |
| `EADDRINUSE :4000` | Another process on port 4000 | Kill it: `npx kill-port 4000` |
| `EADDRINUSE :3000` | Another process on port 3000 | Kill it: `npx kill-port 3000` |
| Next.js `NEXT_PUBLIC_API_URL is not configured` | Missing `frontend/.env.local` | Create file with `NEXT_PUBLIC_API_URL=http://localhost:4000/api` |
| TypeScript errors in `dist/` | Stale build artifacts | Delete `backend/dist/` and rebuild |
