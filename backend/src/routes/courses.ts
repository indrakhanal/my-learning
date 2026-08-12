import { Router } from "express";
import { CourseStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { slugify } from "../lib/slug.js";
import { optionalAdmin, requireAdmin, type AuthRequest } from "../middleware/auth.js";

// ── Zod schemas ──────────────────────────────────────────────────────────────

const courseInput = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().max(2000).default(""),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  coverUrl: z.string().url().optional().or(z.literal("")),
});

const chapterResourceInput = z.object({
  label: z.string().trim().min(1).max(100),
  url: z.string().url().max(2000),
});

const chapterInput = z.object({
  title: z.string().trim().min(1).max(180),
  content: z.string().max(200000).default("<p></p>"),
  resources: z.array(chapterResourceInput).default([]),
});

const orderInput = z.object({ direction: z.enum(["up", "down"]) });

// ── Helpers ──────────────────────────────────────────────────────────────────

async function uniqueCourseSlug(title: string, excludeId?: string) {
  const base = slugify(title);
  let slug = base;
  let seq = 2;
  while (true) {
    const existing = await prisma.course.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    slug = `${base}-${seq++}`;
  }
  return slug;
}

const chapterInclude = {
  resources: true,
  attachments: true,
} as const;

const courseInclude = {
  _count: { select: { chapters: true } },
  author: { select: { name: true, email: true } },
} as const;

// ── Router ───────────────────────────────────────────────────────────────────

export const coursesRouter = Router();

// ── Course CRUD ──────────────────────────────────────────────────────────────

// GET /api/courses — public: PUBLISHED only | admin: all
coursesRouter.get("/", optionalAdmin, async (req: AuthRequest, res, next) => {
  try {
    const where = req.user ? {} : { status: CourseStatus.PUBLISHED };
    const courses = await prisma.course.findMany({
      where,
      include: courseInclude,
      orderBy: { updatedAt: "desc" },
    });
    res.json(courses);
  } catch (error) { next(error); }
});

// POST /api/courses — admin: create course
coursesRouter.post("/", requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = courseInput.parse(req.body);
    const slug = await uniqueCourseSlug(data.title);
    const course = await prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status as CourseStatus,
        coverUrl: data.coverUrl || null,
        slug,
        authorId: req.user!.id,
      },
      include: courseInclude,
    });
    res.status(201).json(course);
  } catch (error) { next(error); }
});

// GET /api/courses/:slug — public (if PUBLISHED) | admin: any
coursesRouter.get("/:slug", optionalAdmin, async (req: AuthRequest, res, next) => {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: String(req.params.slug) },
      include: {
        chapters: {
          orderBy: { order: "asc" },
          include: chapterInclude,
        },
        author: { select: { name: true, email: true } },
      },
    });
    if (!course || (course.status !== "PUBLISHED" && !req.user)) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.json(course);
  } catch (error) { next(error); }
});

// PUT /api/courses/:id — admin: update course meta
coursesRouter.put("/:id", requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = courseInput.parse(req.body);
    const existing = await prisma.course.findUnique({ where: { id: String(req.params.id) } });
    if (!existing) return res.status(404).json({ error: "Course not found" });
    // Regenerate slug only if title changed
    const slug = data.title !== existing.title
      ? await uniqueCourseSlug(data.title, existing.id)
      : existing.slug;
    const course = await prisma.course.update({
      where: { id: String(req.params.id) },
      data: {
        title: data.title,
        description: data.description,
        status: data.status as CourseStatus,
        coverUrl: data.coverUrl || null,
        slug,
      },
      include: courseInclude,
    });
    res.json(course);
  } catch (error) { next(error); }
});

// DELETE /api/courses/:id — admin: delete (cascades chapters)
coursesRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.course.findUnique({ where: { id: String(req.params.id) } });
    if (!existing) return res.status(404).json({ error: "Course not found" });
    await prisma.course.delete({ where: { id: String(req.params.id) } });
    res.status(204).end();
  } catch (error) { next(error); }
});

// ── Chapter CRUD ─────────────────────────────────────────────────────────────

// GET /api/courses/:courseId/chapters — ordered chapter list
coursesRouter.get("/:courseId/chapters", optionalAdmin, async (req: AuthRequest, res, next) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: String(req.params.courseId) } });
    if (!course || (course.status !== "PUBLISHED" && !req.user)) {
      return res.status(404).json({ error: "Course not found" });
    }
    const chapters = await prisma.chapter.findMany({
      where: { courseId: String(req.params.courseId) },
      orderBy: { order: "asc" },
      include: chapterInclude,
    });
    res.json(chapters);
  } catch (error) { next(error); }
});

// POST /api/courses/:courseId/chapters — admin: create chapter
coursesRouter.post("/:courseId/chapters", requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = chapterInput.parse(req.body);
    const course = await prisma.course.findUnique({ where: { id: String(req.params.courseId) } });
    if (!course) return res.status(404).json({ error: "Course not found" });
    // Order = max existing order + 1
    const last = await prisma.chapter.findFirst({
      where: { courseId: String(req.params.courseId) },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const order = (last?.order ?? 0) + 1;
    const chapter = await prisma.chapter.create({
      data: {
        courseId: String(req.params.courseId),
        title: data.title,
        content: data.content,
        order,
        resources: { create: data.resources },
      },
      include: chapterInclude,
    });
    res.status(201).json(chapter);
  } catch (error) { next(error); }
});

// GET /api/courses/:courseId/chapters/:id — single chapter
coursesRouter.get("/:courseId/chapters/:id", optionalAdmin, async (req: AuthRequest, res, next) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: String(req.params.courseId) } });
    if (!course || (course.status !== "PUBLISHED" && !req.user)) {
      return res.status(404).json({ error: "Course not found" });
    }
    const chapter = await prisma.chapter.findUnique({
      where: { id: String(req.params.id) },
      include: chapterInclude,
    });
    if (!chapter || chapter.courseId !== String(req.params.courseId)) {
      return res.status(404).json({ error: "Chapter not found" });
    }
    res.json(chapter);
  } catch (error) { next(error); }
});

// PUT /api/courses/:courseId/chapters/:id — admin: update chapter
coursesRouter.put("/:courseId/chapters/:id", requireAdmin, async (req, res, next) => {
  try {
    const data = chapterInput.parse(req.body);
    const existing = await prisma.chapter.findUnique({ where: { id: String(req.params.id) } });
    if (!existing || existing.courseId !== String(req.params.courseId)) {
      return res.status(404).json({ error: "Chapter not found" });
    }
    const chapter = await prisma.chapter.update({
      where: { id: String(req.params.id) },
      data: {
        title: data.title,
        content: data.content,
        resources: { deleteMany: {}, create: data.resources },
      },
      include: chapterInclude,
    });
    res.json(chapter);
  } catch (error) { next(error); }
});

// DELETE /api/courses/:courseId/chapters/:id — admin: delete chapter
coursesRouter.delete("/:courseId/chapters/:id", requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.chapter.findUnique({ where: { id: String(req.params.id) } });
    if (!existing || existing.courseId !== String(req.params.courseId)) {
      return res.status(404).json({ error: "Chapter not found" });
    }
    await prisma.chapter.delete({ where: { id: String(req.params.id) } });
    // Re-sequence remaining chapters to remove gaps in order
    const remaining = await prisma.chapter.findMany({
      where: { courseId: String(req.params.courseId) },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    await prisma.$transaction(
      remaining.map((ch, idx) =>
        prisma.chapter.update({ where: { id: ch.id }, data: { order: idx + 1 } })
      )
    );
    res.status(204).end();
  } catch (error) { next(error); }
});

// PUT /api/courses/:courseId/chapters/:id/order — admin: move up or down
coursesRouter.put("/:courseId/chapters/:id/order", requireAdmin, async (req, res, next) => {
  try {
    const { direction } = orderInput.parse(req.body);
    const chapter = await prisma.chapter.findUnique({ where: { id: String(req.params.id) } });
    if (!chapter || chapter.courseId !== String(req.params.courseId)) {
      return res.status(404).json({ error: "Chapter not found" });
    }
    const adjacentOrder = direction === "up" ? chapter.order - 1 : chapter.order + 1;
    const sibling = await prisma.chapter.findUnique({
      where: { courseId_order: { courseId: String(req.params.courseId), order: adjacentOrder } },
    });
    if (!sibling) return res.status(400).json({ error: "Cannot move in that direction" });

    // Swap orders atomically using a temp value to avoid unique constraint collision
    const TEMP = -1;
    await prisma.$transaction([
      prisma.chapter.update({ where: { id: chapter.id }, data: { order: TEMP } }),
      prisma.chapter.update({ where: { id: sibling.id }, data: { order: chapter.order } }),
      prisma.chapter.update({ where: { id: chapter.id }, data: { order: adjacentOrder } }),
    ]);

    res.json({ moved: chapter.id, order: adjacentOrder });
  } catch (error) { next(error); }
});
