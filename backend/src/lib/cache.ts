import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

const ttlSeconds = Number.parseInt(process.env.REDIS_CACHE_TTL_SECONDS ?? "60", 10);
const ttl = Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : 60;

async function safe<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  if (!redis) return fallback;
  try { return await operation(); }
  catch (error) {
    console.error("Redis cache operation failed", error instanceof Error ? error.message : "unknown error");
    return fallback;
  }
}

export function cacheGet<T>(key: string) {
  return safe(() => redis!.get<T>(key), null as T | null);
}

export function cacheSet<T>(key: string, value: T, seconds = ttl) {
  return safe(() => redis!.set(key, value, { ex: seconds }), "OK");
}

export function cacheDelete(...keys: string[]) {
  if (!keys.length) return Promise.resolve(0);
  return safe(() => redis!.del(...keys), 0);
}

export const cacheKeys = {
  notesList: (tag?: string) => `learning-notes:notes:list:${tag ?? "all"}`,
  note: (id: string) => `learning-notes:notes:${id}`,
  coursesList: "learning-notes:courses:list",
  course: (slug: string) => `learning-notes:courses:${slug}`,
  chapters: (courseId: string) => `learning-notes:courses:${courseId}:chapters`,
  chapter: (courseId: string, chapterId: string) => `learning-notes:courses:${courseId}:chapters:${chapterId}`,
  tags: "learning-notes:tags",
};

export async function invalidateNoteCache(id?: string) {
  await cacheDelete(cacheKeys.notesList(), cacheKeys.tags, ...(id ? [cacheKeys.note(id)] : []));
}

export async function invalidateCourseCache(slug?: string, courseId?: string) {
  await cacheDelete(
    cacheKeys.coursesList,
    ...(slug ? [cacheKeys.course(slug)] : []),
    ...(courseId ? [cacheKeys.chapters(courseId)] : []),
  );
}

export async function invalidateChapterCache(courseId: string, chapterId?: string, courseSlug?: string) {
  await cacheDelete(
    cacheKeys.chapters(courseId),
    ...(chapterId ? [cacheKeys.chapter(courseId, chapterId)] : []),
    ...(courseSlug ? [cacheKeys.course(courseSlug)] : []),
  );
}
