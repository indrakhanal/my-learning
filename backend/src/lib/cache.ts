import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

const ttlSeconds = Number.parseInt(process.env.REDIS_CACHE_TTL_SECONDS ?? "60", 10);
const ttl = Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : 60;
type CacheStatus = "HIT" | "MISS" | "BYPASS" | "ERROR";
type CacheEvent = { at: string; key: string; source: "CACHE" | "DATABASE"; status: CacheStatus };
const metrics = { hits: 0, misses: 0, bypasses: 0, errors: 0, events: [] as CacheEvent[] };

function record(status: CacheStatus, key: string) {
  if (status === "HIT") metrics.hits++;
  if (status === "MISS") metrics.misses++;
  if (status === "BYPASS") metrics.bypasses++;
  if (status === "ERROR") metrics.errors++;
  if (status === "MISS" || status === "ERROR") metrics.events.unshift({ at: new Date().toISOString(), key, source: "DATABASE", status });
  if (status === "BYPASS") metrics.events.unshift({ at: new Date().toISOString(), key, source: "DATABASE", status });
  if (status === "HIT") metrics.events.unshift({ at: new Date().toISOString(), key, source: "CACHE", status });
  metrics.events.splice(100);
}

async function safe<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  if (!redis) return fallback;
  try { return await operation(); }
  catch (error) {
    console.error("Redis cache operation failed", error instanceof Error ? error.message : "unknown error");
    return fallback;
  }
}

export function cacheGet<T>(key: string) {
  return cacheGetWithStatus<T>(key).then(result => result.value);
}

export async function cacheGetWithStatus<T>(key: string): Promise<{ value: T | null; status: CacheStatus }> {
  if (!redis) { record("BYPASS", key); return { value: null, status: "BYPASS" }; }
  try {
    const value = await redis.get<T>(key);
    const status = value === null ? "MISS" : "HIT";
    record(status, key);
    return { value, status };
  } catch (error) {
    record("ERROR", key);
    console.error("Redis cache operation failed", error instanceof Error ? error.message : "unknown error");
    return { value: null, status: "ERROR" };
  }
}

export function cacheSet<T>(key: string, value: T, seconds = ttl) {
  return safe(() => redis!.set(key, value, { ex: seconds }), "OK");
}

export function cacheStatus() {
  const totalReads = metrics.hits + metrics.misses + metrics.bypasses + metrics.errors;
  return {
    enabled: Boolean(redis),
    ttlSeconds: ttl,
    hits: metrics.hits,
    misses: metrics.misses,
    bypasses: metrics.bypasses,
    errors: metrics.errors,
    hitRate: metrics.hits + metrics.misses ? metrics.hits / (metrics.hits + metrics.misses) : 0,
    totalReads,
    events: metrics.events.slice(0, 50),
  };
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
