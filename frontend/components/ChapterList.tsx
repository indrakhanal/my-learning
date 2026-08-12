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
          <li key={chapter.id} className="chapter-list-item glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem", marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ 
                display: "inline-flex", alignItems: "center", justifyContent: "center", 
                width: "32px", height: "32px", borderRadius: "50%", 
                background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border)",
                fontSize: "0.9rem", color: "var(--text-muted)"
              }}>
                {chapter.order}
              </span>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 500 }}>
                <Link href={`/courses/${courseSlug}/chapters/${chapter.id}`} style={{ color: "var(--text)", textDecoration: "none" }}>
                  {chapter.title}
                </Link>
              </h3>
            </div>
            
            <Link href={`/courses/${courseSlug}/chapters/${chapter.id}`} className="btn-secondary btn-small" aria-label={`Study ${chapter.title}`}>
              Study →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
