# 07 — Testing

## Testing Stack

| Tool | Role |
|---|---|
| **Vitest** | Test runner (fast, ESM-native, compatible with `type: "module"`) |
| **Supertest** | HTTP integration testing against the Express `app` |
| `vi.mock()` | Module-level mocking for Prisma and auth middleware |

---

## Test Location & Conventions

```
backend/
  tests/
    notes.test.ts          # Tests for POST /api/notes (example)
    # Add: auth.test.ts, tags.test.ts, uploads.test.ts
```

- One test file per route module
- Test file names match the route file: `routes/notes.ts` -> `tests/notes.test.ts`
- All tests use `describe` + `it` blocks
- Each `it` block tests one behavior/edge case

---

## Running Tests

```powershell
# Run all backend tests
npm.cmd run test

# Run specific test file
npm.cmd run test --workspace=backend -- tests/notes.test.ts

# Watch mode (re-runs on file changes)
cd backend && npx vitest

# Type-check (not a test but run alongside)
npm.cmd run lint
```

---

## Unit Test Pattern (Mocked Prisma)

```typescript
import { describe, expect, it, vi } from "vitest";

// Mock Prisma before importing app
vi.mock("../src/lib/prisma.js", () => ({
  prisma: {
    note: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: "note_1",
        title: "Test note",
        status: "DRAFT",
        tags: [],
        attachments: [],
        resources: [],
        author: { name: "Admin", email: "admin@example.com" },
      }),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
      delete: vi.fn(),
    },
    noteVersion: { create: vi.fn() },
    tag: { findMany: vi.fn() },
  },
}));

// Mock auth middleware to inject a synthetic admin user
vi.mock("../src/middleware/auth.js", async () => ({
  requireAdmin: (req: any, _res: any, next: any) => {
    req.user = { id: "admin_1", role: "ADMIN" };
    next();
  },
  optionalAdmin: (_req: any, _res: any, next: any) => next(),
}));

import request from "supertest";
import { app } from "../src/app.js";

describe("POST /api/notes", () => {
  it("creates a validated note", async () => {
    const response = await request(app)
      .post("/api/notes")
      .send({ title: "Test note", content: "# Hello", tags: ["testing"] });
    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Test note");
  });

  it("rejects an empty title", async () => {
    const response = await request(app)
      .post("/api/notes")
      .send({ title: "", content: "x" });
    expect(response.status).toBe(400);
  });
});
```

---

## Integration Test Pattern (Real Database)

For full integration tests, use a disposable PostgreSQL database:

```typescript
// tests/integration/setup.ts
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const TEST_DB_URL = process.env.TEST_DATABASE_URL!;
export const testPrisma = new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });

export async function resetDb() {
  await testPrisma.$executeRaw`TRUNCATE "Note", "User", "Tag", "NoteTag", "Attachment", "Resource", "NoteVersion" RESTART IDENTITY CASCADE`;
}
```

**Note**: Integration tests require `TEST_DATABASE_URL` env var pointing to a separate test database.

---

## Test Coverage Requirements

| Route | Minimum test cases |
|---|---|
| `POST /api/auth/login` | Valid credentials (200), wrong password (401), missing fields (400) |
| `GET /api/notes` | Public returns PUBLISHED only, admin returns all, tag filter works |
| `POST /api/notes` | Valid note created (201), empty title rejected (400), no auth rejected (401) |
| `PUT /api/notes/:id` | Updates note and creates NoteVersion, 404 if not found |
| `DELETE /api/notes/:id` | Cascades correctly, 404 if not found |
| `POST /api/notes/import` | Parses Markdown title correctly |
| Exports | Returns correct Content-Type and attachment header |

---

## What NOT to Test

- Prisma internals (trust the ORM)
- Next.js framework behavior
- Third-party libraries (sanitize-html, Tiptap, PDFKit)
- Environment variable loading

---

## Type Checking as a Test

TypeScript strict mode (`tsc --noEmit`) catches a large class of bugs at compile time.
Always run before committing:

```powershell
npm.cmd run lint
```

This runs `tsc --noEmit` in BOTH workspaces (backend + frontend).

---

## Test-Driven Development (TDD) Workflow

For new routes:

1. Write a failing test for the happy path
2. Write a failing test for validation errors
3. Write a failing test for auth (401)
4. Implement the route handler
5. Make all tests pass
6. Refactor if needed

---

## Vitest Configuration

Vitest uses the default configuration (detected from `package.json`). No separate `vitest.config.ts` is needed unless:
- You add a test database setup/teardown
- You need coverage reports (`--coverage` flag with `@vitest/coverage-v8`)

---

## Frontend Testing (Future)

Frontend tests are not currently implemented. When adding:
- Use **React Testing Library** + **Vitest** (or Jest)
- Test components with `render()` + user-event interactions
- Mock `fetch` calls with `vi.fn()` or MSW (Mock Service Worker)
- Place tests in `frontend/__tests__/` or co-located as `Component.test.tsx`
