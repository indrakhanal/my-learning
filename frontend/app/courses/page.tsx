import { CourseList } from "../../components/CourseList";

const api = process.env.NEXT_PUBLIC_API_URL;
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  let courses = [];
  if (api) {
    try {
      const response = await fetch(`${api}/courses`, { cache: "no-store" });
      if (response.ok) courses = await response.json();
      else console.error(`Courses API returned ${response.status}`);
    } catch (error) {
      console.error("Courses API is unavailable", error);
    }
  } else {
    console.error("NEXT_PUBLIC_API_URL is not configured");
  }

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
