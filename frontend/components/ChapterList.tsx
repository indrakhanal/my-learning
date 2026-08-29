import Link from "next/link";

type Chapter = {
  id: string;
  title: string;
  order: number;
  subchapters: { id: string; title: string; order: number }[];
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
        {chapters.map((chapter, chapterIndex) => (
          <li key={chapter.id} className="chapter-list-item glass-card">
            <div className="chapter-list-info">
              <span className="chapter-list-order">
                {chapterIndex + 1}
              </span>
              <h3>
                <Link href={`/courses/${courseSlug}/chapters/${chapter.id}`}>
                  {chapter.title}
                </Link>
              </h3>
            </div>
            {chapter.subchapters.length > 0 && (
              <ul className="chapter-subchapter-list" aria-label={`Subchapters in ${chapter.title}`}>
                {chapter.subchapters.map((subchapter, index) => (
                  <li key={subchapter.id}>
                    <Link href={`/courses/${courseSlug}/chapters/${subchapter.id}`}>
                      {chapterIndex + 1}.{index + 1} {subchapter.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            
            <Link href={`/courses/${courseSlug}/chapters/${chapter.id}`} className="btn-secondary btn-small" aria-label={`Study ${chapter.title}`}>
              <span className="chapter-study-label">Study</span> <span aria-hidden="true">&rarr;</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
