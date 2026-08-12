---
name: my_notes_sdlc
description: >
  Comprehensive SDLC skill for the Personal Learning Notes project.
  Triggers on any request involving: adding features, fixing bugs, writing tests,
  database migrations, API changes, UI/component work, deployment, security,
  performance, refactoring, or reviewing code in this monorepo.
---

# Personal Learning Notes — SDLC Agent Skill

This skill governs every phase of the Software Development Life Cycle (SDLC) for
the **Personal Learning Notes** monorepo. Always read the relevant reference documents
in `references/` before starting work in a given phase.

---

## Project Snapshot

| Item | Value |
|---|---|
| **App name** | Personal Learning Notes |
| **Repo root** | `e:\Learning\my-notes` |
| **Workspaces** | `frontend/` (Next.js 14, React 18, Tiptap) · `backend/` (Express 4, Prisma 5, PostgreSQL) |
| **Language** | TypeScript 5 throughout |
| **Auth** | JWT (`jsonwebtoken`) — single ADMIN role |
| **Storage** | Local PostgreSQL · Cloudinary (images/PDFs) · `backend/uploads/` (local dev) |
| **Testing** | Vitest + Supertest (backend) |
| **Package manager** | npm workspaces (root `package.json`) |
| **Node requirement** | >= 20 |

---

## SDLC Phases & Rules

### 1 — Requirements & Planning
- Read `references/01_requirements.md` for the canonical feature list, constraints, and out-of-scope items.
- Any new feature MUST be checked against the out-of-scope list before implementation.
- Non-functional requirements (security, performance, accessibility) in that file are mandatory, not optional.

### 2 — Architecture & Design
- Read `references/02_architecture.md` for the system diagram, data flow, and module boundaries.
- New backend modules go in `backend/src/routes/` (router) or `backend/src/lib/` (utilities).
- New frontend pages go under `frontend/app/` using Next.js App Router conventions.
- New reusable UI components go in `frontend/components/`.
- Never import backend code into frontend or vice-versa — they communicate only via the REST API.

### 3 — Database & Schema
- Read `references/03_database.md` for the Prisma schema, migration workflow, and naming conventions.
- Every schema change MUST be accompanied by a `prisma migrate dev --name <descriptive-name>` migration.
- Never edit migration SQL files manually.
- Use `prisma.$transaction` for multi-step writes that must be atomic (see `NoteVersion` snapshot pattern in `notes.ts`).
- Always regenerate the client after schema changes: `npm run prisma:generate --workspace=backend`.

### 4 — API Development
- Read `references/04_api.md` for the REST contract, authentication patterns, and Zod validation rules.
- **All write endpoints** must validate request bodies with Zod before touching Prisma.
- **Admin routes** must use `requireAdmin` middleware. Public-with-optional-auth routes use `optionalAdmin`.
- Return proper HTTP status codes: 201 Create, 204 Delete, 400 Validation, 401 Auth, 404 Not Found, 409 Conflict, 500 Server Error.
- CORS is managed centrally in `backend/src/app.ts` — do not add per-route CORS headers.

### 5 — Frontend Development
- Read `references/05_frontend.md` for component conventions, styling rules, and accessibility requirements.
- All styles are in `frontend/app/styles.css` — no inline `style={{}}` props for layout concerns (only for truly one-off overrides).
- Client components must have `"use client"` directive. Prefer server components (async functions) for data-fetching pages.
- Use `NEXT_PUBLIC_API_URL` (from `frontend/.env.local`) for all API calls — never hardcode localhost URLs.
- Sanitize any HTML rendered from the API with `sanitize-html` before `dangerouslySetInnerHTML`.
- The Tiptap editor (`RichTextEditor.tsx`) handles HTML content — keep image upload, link, and formatting toolbar extensions in sync.

### 6 — Security
- Read `references/06_security.md` for the full security checklist.
- **JWT_SECRET** must be >= 32 random characters. Never commit real secrets.
- Uploads: validate MIME type (allowlist only), enforce 10 MB limit, use generated filenames (never user-supplied).
- Zod validates all inputs; Prisma parameterizes all queries — never concatenate user input into SQL strings.
- The `CLOUDINARY_URL` variable is backend-only. Never reference it in `frontend/` code or Vercel env vars.
- `WEB_ORIGIN` in `backend/.env` controls the CORS allowlist — keep it tight in production.

### 7 — Testing
- Read `references/07_testing.md` for testing strategy, patterns, and coverage expectations.
- Backend unit/integration tests live in `backend/tests/` and use Vitest + Supertest.
- Mock Prisma with `vi.mock('../src/lib/prisma.js', ...)` for unit tests; use a disposable PostgreSQL DB for full integration tests.
- Mock auth middleware with `vi.mock('../src/middleware/auth.js', ...)` to inject a synthetic admin user.
- Run all tests: `npm run test` from the repo root.
- Run type checks: `npm run lint` (calls `tsc --noEmit` in both workspaces).
- A PR must not reduce test coverage for existing routes.

### 8 — Build & CI
- Read `references/08_build_ci.md` for build commands, environment setup, and CI expectations.
- Build order: backend TypeScript compile -> frontend Next.js build.
- Root scripts: `npm run dev` (concurrent dev servers) · `npm run build` · `npm run test` · `npm run lint`.
- Backend dev server: `tsx watch src/server.ts` on port 4000.
- Frontend dev server: `next dev -H 0.0.0.0` on port 3000 (LAN-accessible for mobile PWA testing).
- Production start: `node dist/src/server.js` (backend) · `next start` (frontend).

### 9 — Environment & Configuration
- Read `references/09_environment.md` for all environment variables, their purpose, and where they live.
- Copy `.env.example` -> `backend/.env` for local dev (never commit real values).
- Frontend env: `frontend/.env.local` with `NEXT_PUBLIC_API_URL`.
- Variables prefixed `NEXT_PUBLIC_` are embedded into the client bundle — never put secrets there.

### 10 — Deployment
- Read `references/10_deployment.md` for deployment targets, HTTPS considerations, and Cloudinary setup.
- Frontend deploys to Vercel (or Cloudflare Pages). Backend deploys to Render.
- PWA service-worker and offline caching require HTTPS — fully functional only after deployment.
- Set `WEB_ORIGIN` on Render to the Vercel preview/production URL(s).
- Set `CLOUDINARY_URL` on Render only — never on Vercel.

### 11 — Maintenance & Refactoring
- Read `references/11_maintenance.md` for versioning, NoteVersion snapshot semantics, and technical debt notes.
- `NoteVersion` snapshots are append-only — never delete version rows directly.
- Slug uniqueness is enforced by `uniqueSlug()` in `notes.ts` — always use this helper when creating notes.
- When refactoring shared lib code in `backend/src/lib/`, re-run all tests to verify no regressions.

---

## Quick Command Reference

```powershell
# Install all dependencies
npm.cmd install

# Run both dev servers concurrently
npm.cmd run dev

# Backend only
npm.cmd run dev --workspace=backend

# Frontend only
npm.cmd run dev --workspace=frontend

# Run backend tests
npm.cmd run test

# Type-check both workspaces
npm.cmd run lint

# Build both workspaces
npm.cmd run build

# Database: generate Prisma client
npm.cmd run prisma:generate --workspace=backend

# Database: create & apply a new migration
npm.cmd run prisma:migrate --workspace=backend -- --name <migration-name>

# Database: seed with initial admin user
npm.cmd run prisma:seed --workspace=backend
```

---

## File Map (Key Files)

| Path | Purpose |
|---|---|
| `backend/prisma/schema.prisma` | Single source of truth for all data models |
| `backend/prisma/seed.ts` | Seeds the initial ADMIN user |
| `backend/src/app.ts` | Express app setup, CORS, routes registration, global error handler |
| `backend/src/server.ts` | HTTP server entry point |
| `backend/src/routes/auth.ts` | `POST /api/auth/login` — JWT issuance |
| `backend/src/routes/notes.ts` | Full CRUD + import/export for notes |
| `backend/src/routes/courses.ts` | Full CRUD for courses and chapters |
| `backend/src/routes/tags.ts` | Tag listing |
| `backend/src/routes/uploads.ts` | Attachment upload -> Cloudinary |
| `backend/src/middleware/auth.ts` | `requireAdmin` / `optionalAdmin` middleware |
| `backend/src/lib/prisma.ts` | Prisma client singleton |
| `backend/src/lib/slug.ts` | Slug generation utility |
| `backend/tests/notes.test.ts` | Vitest + Supertest test suite |
| `backend/tests/courses.test.ts` | Vitest tests for courses |
| `frontend/app/layout.tsx` | Root HTML shell, fonts, header, mobile nav |
| `frontend/app/page.tsx` | Public homepage — published notes list |
| `frontend/app/courses/page.tsx` | Public course list page |
| `frontend/app/courses/[slug]/page.tsx` | Public course detail page |
| `frontend/app/courses/[slug]/chapters/[id]/page.tsx` | Public chapter reading view |
| `frontend/app/styles.css` | Global design system & all component styles |
| `frontend/components/RichTextEditor.tsx` | Tiptap-based WYSIWYG editor |
| `frontend/components/NoteEditor.tsx` | Admin note create/edit form |
| `frontend/components/CourseEditor.tsx` | Admin course create/edit form |
| `frontend/components/ChapterEditor.tsx` | Admin chapter create/edit form |
| `frontend/components/NoteList.tsx` | Public note card grid |
| `frontend/components/CourseList.tsx` | Public course card grid |
| `frontend/components/ChapterList.tsx` | Public/admin chapter index |
| `frontend/components/NoteView.tsx` | Full note reading view |
| `frontend/components/ChapterView.tsx` | Chapter reading view |
| `frontend/components/AdminNoteList.tsx` | Admin note management table |
| `frontend/components/AdminCourseList.tsx` | Admin course management table |
| `frontend/components/AdminDashboard.tsx` | Admin dashboard shell |
| `.env.example` | Template for all required environment variables |
