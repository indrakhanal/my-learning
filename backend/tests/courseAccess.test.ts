import { describe, expect, it, vi } from "vitest";
import request from "supertest";

process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-tests";

vi.mock("../src/lib/prisma.js", () => ({
  prisma: {
    courseAccessEmail: {
      findUnique: vi.fn().mockResolvedValue({ id: "access_1", email: "learner@example.com", duration: "MONTH", expiresAt: new Date(Date.now() + 86400000), createdAt: new Date() }),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: "access_1", email: "learner@example.com", duration: "MONTH", expiresAt: new Date(Date.now() + 2592000000), createdAt: new Date() }),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}));
vi.mock("../src/middleware/auth.js", () => ({
  requireAdmin: (req: any, _res: any, next: any) => { req.user = { id: "admin_1", role: "ADMIN" }; next(); },
  optionalAdmin: (_req: any, _res: any, next: any) => next(),
  requireCourseAccess: (_req: any, _res: any, next: any) => next(),
}));

import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

describe("Course access API", () => {
  it("issues a token only for a registered email", async () => {
    const response = await request(app).post("/api/course-access/verify").set("X-Device-ID", "11111111-1111-4111-8111-111111111111").send({ email: "LEARNER@example.com" });
    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(prisma.courseAccessEmail.findUnique).toHaveBeenCalledWith({ where: { email: "learner@example.com" } });
  });

  it("rejects malformed email input", async () => {
    const response = await request(app).post("/api/course-access/verify").send({ email: "not-an-email" });
    expect(response.status).toBe(400);
  });

  it("rejects an expired allowlisted email", async () => {
    (prisma.courseAccessEmail.findUnique as any).mockResolvedValueOnce({
      id: "access_expired",
      email: "expired@example.com",
      duration: "MONTH",
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(Date.now() - 31 * 86400000),
    });
    const response = await request(app).post("/api/course-access/verify").set("X-Device-ID", "11111111-1111-4111-8111-111111111111").send({ email: "expired@example.com" });
    expect(response.status).toBe(403);
    expect(response.body.error).toContain("expired");
  });

  it("requires admin authentication to manage the allowlist", async () => {
    const response = await request(app).get("/api/course-access/emails");
    expect(response.status).toBe(200);
  });

  it("exposes cache status to admins", async () => {
    const response = await request(app).get("/api/cache/status");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ enabled: false, hits: expect.any(Number), misses: expect.any(Number) }));
  });

  it("validates an existing admin session", async () => {
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("ADMIN");
  });
});
