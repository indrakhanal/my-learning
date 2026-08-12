import { describe, expect, it, vi } from "vitest";

// Mock Cloudinary
vi.mock("cloudinary", () => ({
  v2: {
    uploader: { upload_stream: vi.fn() }
  }
}));

// Route behavior is tested with a mocked persistence boundary; use a disposable Postgres DB for full integration tests.
vi.mock("../src/lib/prisma.js", () => ({ prisma: { note: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({ id: "note_1", title: "Test note", status: "DRAFT" }) }, tag: { findMany: vi.fn() } } }));
vi.mock("../src/middleware/auth.js", async () => ({ requireAdmin: (req: any, _res: any, next: any) => { req.user = { id: "admin_1", role: "ADMIN" }; next(); }, optionalAdmin: (_req: any, _res: any, next: any) => next() }));
import request from "supertest"; import { app } from "../src/app.js";
describe("POST /api/notes", () => { it("creates a validated note", async () => { const response = await request(app).post("/api/notes").send({ title: "Test note", content: "# Hello", tags: ["testing"] }); expect(response.status).toBe(201); expect(response.body.title).toBe("Test note"); }); it("rejects an empty title", async () => { const response = await request(app).post("/api/notes").send({ title: "", content: "x" }); expect(response.status).toBe(400); }); });
