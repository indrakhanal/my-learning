"use client";

import { useEffect, useState } from "react";
import { CourseList } from "../../components/CourseList";
import { CourseAccessGate, courseAccessHeaders, useCourseAccessToken } from "../../components/CourseAccessGate";

const api = process.env.NEXT_PUBLIC_API_URL;
export const dynamic = "force-dynamic";

export default function CoursesPage() {
  return <CourseAccessGate><AuthorizedCourses /></CourseAccessGate>;
}

function AuthorizedCourses() {
  const token = useCourseAccessToken();
  const [courses, setCourses] = useState<any[]>([]);
  useEffect(() => { if (token) fetch(`${api}/courses`, { headers: courseAccessHeaders(token), cache: "no-store" }).then(r => r.ok ? r.json() : []).then(setCourses).catch(() => setCourses([])); }, [token]);

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-eyebrow">
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <circle cx="5" cy="5" r="5" fill="currentColor" />
          </svg>
          Curriculum
        </div>
        <h1>Learning Courses</h1>
        <p>
          Structured, chapter-by-chapter guides on specific topics. 
          Follow along from start to finish.
        </p>
        <div className="hero-divider" />
      </section>

      {/* ── Courses Grid ── */}
      <CourseList courses={courses} />
    </>
  );
}
