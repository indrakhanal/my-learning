"use client";

import { useEffect, useState } from "react";
import { ChapterView } from "../../../../../components/ChapterView";
import { CourseAccessGate, courseAccessHeaders, useCourseAccessToken } from "../../../../../components/CourseAccessGate";

const api = process.env.NEXT_PUBLIC_API_URL;
export const dynamic = "force-dynamic";

// Keep the last successful chapter available while the next chapter is loading.
// This prevents client-side navigation from flashing an empty page.
let previousChapter: any = null;
let previousCourse: any = null;

export default function ChapterPage({ params }: { params: { slug: string, id: string } }) {
  return <CourseAccessGate><AuthorizedChapter slug={params.slug} id={params.id} /></CourseAccessGate>;
}

function AuthorizedChapter({ slug, id }: { slug: string; id: string }) {
  const token = useCourseAccessToken();
  const [course, setCourse] = useState<any>(previousCourse);
  const [chapter, setChapter] = useState<any>(previousChapter);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!token || !api) {
      if (!api) setError("The course service is not configured. Please try again later.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    (async () => {
      // We need the course to verify it's published and get its title/slug for the breadcrumb
      const headers = courseAccessHeaders(token);
      const courseRes = await fetch(`${api}/courses/${slug}`, { headers, cache: "no-store" });
      if (!courseRes.ok) {
        if (courseRes.status === 401 || courseRes.status === 403) throw new Error("Your course access has expired. Please verify your email again.");
        if (courseRes.status === 404) throw new Error("We couldn't find this course.");
        throw new Error("We couldn't load this course. Please try again.");
      }

      const loadedCourse = await courseRes.json();
      // Verify that the requested item is a top-level chapter or a subchapter in this course.
      const chapterExists = loadedCourse.chapters.some((c: any) =>
        c.id === id || c.subchapters.some((subchapter: any) => subchapter.id === id)
      );
      if (!chapterExists) throw new Error("This chapter does not exist in the selected course.");

      const chapterRes = await fetch(`${api}/courses/${loadedCourse.id}/chapters/${id}`, { headers, cache: "no-store" });
      if (!chapterRes.ok) {
        if (chapterRes.status === 404) throw new Error("We couldn't find this chapter.");
        throw new Error("We couldn't load this chapter. Please try again.");
      }

      const loadedChapter = await chapterRes.json();
      loadedChapter.course = { title: loadedCourse.title, slug: loadedCourse.slug }; // attach course info for breadcrumb
      previousCourse = loadedCourse;
      previousChapter = loadedChapter;
      setCourse(loadedCourse);
      setChapter(loadedChapter);
    })().catch(caughtError => {
      setError(caughtError instanceof Error ? caughtError.message : "We couldn't load this chapter. Please try again.");
    }).finally(() => setLoading(false));
  }, [token, slug, id]);

  if (!chapter && (loading || error)) {
    return (
      <div className="chapter-loading-state" aria-busy={loading} aria-live="polite">
        {loading && <><span className="loading-spinner" aria-hidden="true" /><p>Loading chapter…</p></>}
        {error && <><h1>Unable to load chapter</h1><p>{error}</p></>}
      </div>
    );
  }

  if (!chapter || !course) return null;

  return (
    <div className="chapter-route-content" aria-busy={loading}>
      <ChapterView chapter={chapter} outline={course.chapters} />
      {loading && (
        <div className="chapter-loading-overlay" role="status" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Loading chapter…</span>
        </div>
      )}
      {error && !loading && (
        <div className="chapter-error-overlay" role="alert">
          <strong>Unable to open chapter</strong>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
