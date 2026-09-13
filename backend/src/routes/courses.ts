import { Router } from "express";
import { CourseStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { slugify } from "../lib/slug.js";
import { requireCourseAccess, requireAdmin, type AuthRequest } from "../middleware/auth.js";
import { cacheGet, cacheSet, cacheKeys, invalidateChapterCache, invalidateCourseCache } from "../lib/cache.js";

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
  parentId: z.string().cuid().nullable().optional(),
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

const courseOutlineInclude = {
  chapters: {
    where: { parentId: null },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      order: true,
      subchapters: {
        orderBy: { order: "asc" },
        select: { id: true, title: true, order: true, parentId: true },
      },
    },
  },
} as const;

const courseInclude = {
  _count: { select: { chapters: true } },
  author: { select: { name: true, email: true } },
} as const;

async function validateParentChapter(courseId: string, parentId: string | null | undefined) {
  if (!parentId) return null;
  const parent = await prisma.chapter.findUnique({
    where: { id: parentId },
    select: { id: true, courseId: true, parentId: true },
  });
  if (!parent || parent.courseId !== courseId) return "Parent chapter not found in this course";
  if (parent.parentId) return "Subchapters cannot contain another level of subchapters";
  return null;
}

// ── Router ───────────────────────────────────────────────────────────────────

export const coursesRouter = Router();

// ── Course CRUD ──────────────────────────────────────────────────────────────

// GET /api/courses — public: PUBLISHED only | admin: all
coursesRouter.get("/", requireCourseAccess, async (req: AuthRequest, res, next) => {
  try {
    if (req.user?.role !== "ADMIN") { const cached = await cacheGet<unknown[]>(cacheKeys.coursesList); if (cached) return res.json(cached); }
    const where = req.user?.role === "ADMIN" ? {} : { status: CourseStatus.PUBLISHED };
    const courses = await prisma.course.findMany({
      where,
      include: courseInclude,
      orderBy: { updatedAt: "desc" },
    });
    if (req.user?.role !== "ADMIN") await cacheSet(cacheKeys.coursesList, courses);
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
    await invalidateCourseCache();
    res.status(201).json(course);
  } catch (error) { next(error); }
});

// GET /api/courses/:slug — public (if PUBLISHED) | admin: any
coursesRouter.get("/:slug", requireCourseAccess, async (req: AuthRequest, res, next) => {
  try {
    const slug = String(req.params.slug);
    if (req.user?.role !== "ADMIN") { const cached = await cacheGet<unknown>(cacheKeys.course(slug)); if (cached) return res.json(cached); }
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        ...courseOutlineInclude,
        author: { select: { name: true, email: true } },
      },
    });
    if (!course || (course.status !== "PUBLISHED" && req.user?.role !== "ADMIN")) {
      return res.status(404).json({ error: "Course not found" });
    }
    if (req.user?.role !== "ADMIN") await cacheSet(cacheKeys.course(slug), course);
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
    await invalidateCourseCache(existing.slug, existing.id);
    if (slug !== existing.slug) await invalidateCourseCache(slug, existing.id);
    res.json(course);
  } catch (error) { next(error); }
});

// DELETE /api/courses/:id — admin: delete (cascades chapters)
coursesRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.course.findUnique({ where: { id: String(req.params.id) } });
    if (!existing) return res.status(404).json({ error: "Course not found" });
    await prisma.course.delete({ where: { id: String(req.params.id) } });
    await invalidateCourseCache(existing.slug, existing.id);
    res.status(204).end();
  } catch (error) { next(error); }
});

// ── Chapter CRUD ─────────────────────────────────────────────────────────────

// GET /api/courses/:courseId/chapters — ordered chapter list
coursesRouter.get("/:courseId/chapters", requireCourseAccess, async (req: AuthRequest, res, next) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: String(req.params.courseId) } });
    if (!course || (course.status !== "PUBLISHED" && req.user?.role !== "ADMIN")) {
      return res.status(404).json({ error: "Course not found" });
    }
    if (req.user?.role !== "ADMIN") { const cached = await cacheGet<unknown[]>(cacheKeys.chapters(String(req.params.courseId))); if (cached) return res.json(cached); }
    const chapters = await prisma.chapter.findMany({
      where: { courseId: String(req.params.courseId) },
      orderBy: { order: "asc" },
      include: chapterInclude,
    });
    if (req.user?.role !== "ADMIN") await cacheSet(cacheKeys.chapters(String(req.params.courseId)), chapters);
    res.json(chapters);
  } catch (error) { next(error); }
});

// POST /api/courses/:courseId/chapters — admin: create chapter
coursesRouter.post("/:courseId/chapters", requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = chapterInput.parse(req.body);
    const courseId = String(req.params.courseId);
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: "Course not found" });
    const parentError = await validateParentChapter(courseId, data.parentId);
    if (parentError) return res.status(400).json({ error: parentError });
    // Order is scoped to siblings so subchapters do not consume top-level numbers.
    const last = await prisma.chapter.findFirst({
      where: { courseId, parentId: data.parentId ?? null },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const order = (last?.order ?? 0) + 1;
    const chapter = await prisma.chapter.create({
      data: {
        courseId,
        parentId: data.parentId ?? null,
        title: data.title,
        content: data.content,
        order,
        resources: { create: data.resources },
      },
      include: chapterInclude,
    });
    await invalidateChapterCache(courseId, undefined, course.slug);
    res.status(201).json(chapter);
  } catch (error) { next(error); }
});

// GET /api/courses/:courseId/chapters/:id — single chapter
coursesRouter.get("/:courseId/chapters/:id", requireCourseAccess, async (req: AuthRequest, res, next) => {
  try {
    const courseId = String(req.params.courseId);
    const chapterId = String(req.params.id);
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || (course.status !== "PUBLISHED" && req.user?.role !== "ADMIN")) {
      return res.status(404).json({ error: "Course not found" });
    }
    if (req.user?.role !== "ADMIN") { const cached = await cacheGet<unknown>(cacheKeys.chapter(courseId, chapterId)); if (cached) return res.json(cached); }
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: chapterInclude,
    });
    if (!chapter || chapter.courseId !== courseId) {
      return res.status(404).json({ error: "Chapter not found" });
    }
    if (req.user?.role !== "ADMIN") await cacheSet(cacheKeys.chapter(courseId, chapterId), chapter);
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
    if (data.parentId !== undefined && data.parentId !== existing.parentId) {
      return res.status(400).json({ error: "A chapter's parent cannot be changed after creation" });
    }
    const course = await prisma.course.findUnique({ where: { id: existing.courseId }, select: { slug: true } });
    const chapter = await prisma.chapter.update({
      where: { id: String(req.params.id) },
      data: {
        title: data.title,
        content: data.content,
        resources: { deleteMany: {}, create: data.resources },
      },
      include: chapterInclude,
    });
    await invalidateChapterCache(existing.courseId, existing.id, course?.slug);
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
    const child = await prisma.chapter.findFirst({ where: { parentId: existing.id }, select: { id: true } });
    if (child) return res.status(409).json({ error: "Delete or move this chapter's subchapters first" });
    const course = await prisma.course.findUnique({ where: { id: existing.courseId }, select: { slug: true } });
    await prisma.chapter.delete({ where: { id: String(req.params.id) } });
    // Re-sequence only the deleted chapter's siblings to remove gaps in order.
    const remaining = await prisma.chapter.findMany({
      where: { courseId: String(req.params.courseId), parentId: existing.parentId },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    await prisma.$transaction(
      remaining.map((ch, idx) =>
        prisma.chapter.update({ where: { id: ch.id }, data: { order: idx + 1 } })
      )
    );
    await invalidateChapterCache(existing.courseId, existing.id, course?.slug);
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
    const course = await prisma.course.findUnique({ where: { id: chapter.courseId }, select: { slug: true } });
    const siblings = await prisma.chapter.findMany({
      where: { courseId: String(req.params.courseId), parentId: chapter.parentId },
      orderBy: { order: "asc" },
      select: { id: true, order: true },
    });
    const currentIndex = siblings.findIndex(sibling => sibling.id === chapter.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const sibling = siblings[targetIndex];
    if (!sibling) return res.status(400).json({ error: "Cannot move in that direction" });

    // Swap orders atomically using a temp value to avoid unique constraint collision
    const TEMP = -1;
    await prisma.$transaction([
      prisma.chapter.update({ where: { id: chapter.id }, data: { order: TEMP } }),
      prisma.chapter.update({ where: { id: sibling.id }, data: { order: chapter.order } }),
      prisma.chapter.update({ where: { id: chapter.id }, data: { order: sibling.order } }),
    ]);

    await invalidateChapterCache(chapter.courseId, chapter.id, course?.slug);
    await invalidateChapterCache(chapter.courseId, sibling.id, course?.slug);

    res.json({ moved: chapter.id, order: sibling.order });
  } catch (error) { next(error); }
});
