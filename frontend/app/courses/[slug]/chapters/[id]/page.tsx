"use client";

import { useEffect, useState } from "react";
import { ChapterView } from "../../../../../components/ChapterView";
import { CourseAccessGate, courseAccessHeaders, useCourseAccessToken } from "../../../../../components/CourseAccessGate";

const api = process.env.NEXT_PUBLIC_API_URL;
export const dynamic = "force-dynamic";

export default function ChapterPage({ params }: { params: { slug: string, id: string } }) {
  return <CourseAccessGate><AuthorizedChapter slug={params.slug} id={params.id} /></CourseAccessGate>;
}

function AuthorizedChapter({ slug, id }: { slug: string; id: string }) {
  const token = useCourseAccessToken();
  const [course, setCourse] = useState<any>(null);
  const [chapter, setChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!token || !api) {
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      let loadedCourse: any = null;
      let loadedChapter: any = null;
      // We need the course to verify it's published and get its title/slug for the breadcrumb
      const headers = courseAccessHeaders(token);
      const courseRes = await fetch(`${api}/courses/${slug}`, { headers, cache: "no-store" });
      if (courseRes.ok) {
        loadedCourse = await courseRes.json();
        
        // Verify that the requested item is a top-level chapter or a subchapter in this course.
        const chapterExists = loadedCourse.chapters.some((c: any) =>
          c.id === id || c.subchapters.some((subchapter: any) => subchapter.id === id)
        );
        
        if (chapterExists) {
          const chapterRes = await fetch(`${api}/courses/${loadedCourse.id}/chapters/${id}`, { headers, cache: "no-store" });
          if (chapterRes.ok) {
            loadedChapter = await chapterRes.json();
            loadedChapter.course = { title: loadedCourse.title, slug: loadedCourse.slug }; // attach course info for breadcrumb
          }
        }
      }
      setCourse(loadedCourse); setChapter(loadedChapter);
    })().catch(error => console.error("API is unavailable", error)).finally(() => setLoading(false));
  }, [token, slug, id]);

  if (loading) {
    return <div className="content-loader" aria-busy="true" aria-live="polite"><span className="loading-spinner" aria-hidden="true" />Loading chapter…</div>;
  }

  if (!chapter) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <h1>Chapter not found</h1>
        <p style={{ color: "var(--text-muted)" }}>This chapter may not exist or belongs to an unpublished course.</p>
      </div>
    );
  }

  return <ChapterView chapter={chapter} outline={course.chapters} />;
}
