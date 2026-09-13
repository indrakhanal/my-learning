"use client";

import { useEffect, useState } from "react";
import { ChapterList } from "../../../components/ChapterList";
import { CourseAccessGate, courseAccessHeaders, useCourseAccessToken } from "../../../components/CourseAccessGate";

const api = process.env.NEXT_PUBLIC_API_URL;
export const dynamic = "force-dynamic";

export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  return <CourseAccessGate><AuthorizedCourse slug={params.slug} /></CourseAccessGate>;
}

function AuthorizedCourse({ slug }: { slug: string }) {
  const token = useCourseAccessToken();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !api) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${api}/courses/${slug}`, { headers: courseAccessHeaders(token), cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(setCourse)
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [token, slug]);

  if (loading) {
    return <div className="content-loader" aria-busy="true" aria-live="polite"><span className="loading-spinner" aria-hidden="true" />Loading course…</div>;
  }

  if (!course) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <h1>Course not found</h1>
        <p style={{ color: "var(--text-muted)" }}>This course may be unpublished or does not exist.</p>
      </div>
    );
  }

  return (
    <>
      <section className="hero" style={{ paddingBottom: "2rem" }}>
        <div className="hero-eyebrow">
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <circle cx="5" cy="5" r="5" fill="currentColor" />
          </svg>
          Course
        </div>
        <h1 style={{ marginBottom: "1rem" }}>{course.title}</h1>
        <p style={{ maxWidth: "800px", margin: "0 auto", fontSize: "1.1rem", lineHeight: 1.6 }}>
          {course.description}
        </p>
        
        {course.coverUrl && (
          <div style={{ marginTop: "3rem", borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" }}>
            <img src={course.coverUrl} alt={course.title} style={{ width: "100%", height: "auto", display: "block", maxHeight: "400px", objectFit: "cover" }} />
          </div>
        )}
        <div className="hero-divider" style={{ marginTop: "3rem" }} />
      </section>

      <section style={{ maxWidth: "800px", margin: "0 auto 4rem auto" }}>
        <h2 style={{ marginBottom: "1.5rem" }}>Curriculum</h2>
        <ChapterList chapters={course.chapters} courseSlug={course.slug} />
      </section>
    </>
  );
}
