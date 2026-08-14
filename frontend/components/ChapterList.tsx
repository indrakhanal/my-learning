import Link from "next/link";

type Chapter = {
  id: string;
  title: string;
  order: number;
};

export function ChapterList({ chapters, courseSlug }: { chapters: Chapter[], courseSlug: string }) {
  if (!chapters.length) {
    return (
      <div className="empty-state" style={{ marginTop: "2rem" }}>
        <p style={{ color: "var(--text-muted)" }}>This course doesn't have any chapters yet.</p>
      </div>
    );
  }

  return (
    <div className="chapter-list-wrap">
      <ul className="chapter-list">
        {chapters.map((chapter) => (
          <li key={chapter.id} className="chapter-list-item glass-card">
            <div className="chapter-list-info">
              <span className="chapter-list-order">
                {chapter.order}
              </span>
              <h3>
                <Link href={`/courses/${courseSlug}/chapters/${chapter.id}`}>
                  {chapter.title}
                </Link>
              </h3>
            </div>
            
            <Link href={`/courses/${courseSlug}/chapters/${chapter.id}`} className="btn-secondary btn-small" aria-label={`Study ${chapter.title}`}>
              <span className="chapter-study-label">Study</span> <span aria-hidden="true">&rarr;</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
