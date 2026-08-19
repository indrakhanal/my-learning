import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

// Mock Cloudinary
vi.mock("cloudinary", () => ({
  v2: {
    uploader: { upload_stream: vi.fn() }
  }
}));

// Mock Prisma
vi.mock("../src/lib/prisma.js", () => ({
  prisma: {
    course: {
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "course_1", title: "DSA", status: "DRAFT", _count: { chapters: 0 }, author: { name: "Admin" } }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    chapter: {
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue({ order: 1 }),
      create: vi.fn().mockResolvedValue({ id: "chapter_1", courseId: "course_1", title: "Intro", order: 2 }),
      update: vi.fn(),
    },
    $transaction: vi.fn().mockResolvedValue([]),
  }
}));

// Mock auth middleware
vi.mock("../src/middleware/auth.js", async () => ({
  requireAdmin: (req: any, _res: any, next: any) => { req.user = { id: "admin_1", role: "ADMIN" }; next(); },
  optionalAdmin: (_req: any, _res: any, next: any) => next()
}));


describe("Courses API", () => {
  it("POST /api/courses creates a validated course", async () => {
    const response = await request(app).post("/api/courses").send({ title: "DSA", description: "Learn DSA" });
    expect(response.status).toBe(201);
    expect(response.body.title).toBe("DSA");
  });

  it("POST /api/courses rejects empty title", async () => {
    const response = await request(app).post("/api/courses").send({ title: "" });
    expect(response.status).toBe(400);
  });
  
  it("POST /api/courses/:id/chapters creates a validated chapter", async () => {
    // Override course findUnique to pretend course exists
    (prisma.course.findUnique as any).mockResolvedValueOnce({ id: "course_1", title: "DSA", status: "DRAFT" });
    
    const response = await request(app).post("/api/courses/course_1/chapters").send({ title: "Intro", content: "<p>Hi</p>" });
    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Intro");
    expect(response.body.order).toBe(2);
  });

  it("rejects a subchapter whose parent is not in the course", async () => {
    (prisma.course.findUnique as any).mockResolvedValueOnce({ id: "course_1", title: "DSA", status: "DRAFT" });
    (prisma.chapter.findUnique as any).mockResolvedValueOnce(null);

    const response = await request(app)
      .post("/api/courses/course_1/chapters")
      .send({ title: "Arrays", content: "<p>Hi</p>", parentId: "ck1234567890" });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Parent chapter");
  });

  it("creates a subchapter under a top-level chapter", async () => {
    (prisma.course.findUnique as any).mockResolvedValueOnce({ id: "course_1", title: "DSA", status: "DRAFT" });
    (prisma.chapter.findUnique as any).mockResolvedValueOnce({ id: "ck1234567890", courseId: "course_1", parentId: null });
    (prisma.chapter.create as any).mockClear();

    const response = await request(app)
      .post("/api/courses/course_1/chapters")
      .send({ title: "Arrays", content: "<p>Hi</p>", parentId: "ck1234567890" });

    expect(response.status).toBe(201);
    expect(prisma.chapter.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ parentId: "ck1234567890" }),
    }));
  });

  it("prevents deleting a chapter that still has subchapters", async () => {
    (prisma.chapter.findUnique as any).mockResolvedValueOnce({ id: "chapter_1", courseId: "course_1", parentId: null });
    (prisma.chapter.findFirst as any).mockResolvedValueOnce({ id: "subchapter_1" });

    const response = await request(app).delete("/api/courses/course_1/chapters/chapter_1");

    expect(response.status).toBe(409);
  });
});
