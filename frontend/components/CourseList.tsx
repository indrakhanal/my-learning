import Link from "next/link";

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  _count: { chapters: number };
  updatedAt: string;
};

export function CourseList({ courses }: { courses: Course[] }) {
  if (!courses.length) {
    return (
      <div className="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
        </svg>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>No published courses yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="notes-grid">
      {courses.map(course => {
        const date = new Date(course.updatedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        return (
          <article key={course.id} className="glass-card note-card">
            <div className="note-card-accent" aria-hidden="true" style={{ background: "var(--accent)" }} />

            <div className="note-card-body">
              <h2>
                <Link href={`/courses/${course.slug}`}>{course.title}</Link>
              </h2>
              <p className="note-card-excerpt">
                {course.description.slice(0, 165)}{course.description.length > 165 ? "…" : ""}
              </p>

              <div className="note-meta">
                <div className="tags" aria-label="Course stats">
                  <span className="tag" style={{ border: "1px solid var(--accent)" }}>{course._count.chapters} Chapters</span>
                </div>
              </div>
            </div>

            <div className="note-card-footer">
              <small>{date}</small>
              <Link href={`/courses/${course.slug}`} className="read-link" aria-label={`Explore ${course.title}`}>
                Explore →
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
