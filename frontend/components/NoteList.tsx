import Link from "next/link";

type Note = {
  id: string;
  title: string;
  content: string;
  tags: { tag: { name: string } }[];
  updatedAt: string;
};

export function NoteList({ notes }: { notes: Note[] }) {
  if (!notes.length) {
    return (
      <div className="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>No published notes yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="notes-grid">
      {notes.map(note => {
        const excerpt = note.content
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        const date = new Date(note.updatedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        return (
          <article key={note.id} className="glass-card note-card">
            {/* Gradient accent stripe */}
            <div className="note-card-accent" aria-hidden="true" />

            <div className="note-card-body">
              <h2>
                <Link href={`/notes/${note.id}`}>{note.title}</Link>
              </h2>
              <p className="note-card-excerpt">
                {excerpt.slice(0, 165)}{excerpt.length > 165 ? "…" : ""}
              </p>

              <div className="note-meta">
                <div className="tags" aria-label="Tags">
                  {note.tags.map(x => (
                    <span key={x.tag.name} className="tag">{x.tag.name}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="note-card-footer">
              <small>{date}</small>
              <Link href={`/notes/${note.id}`} className="read-link" aria-label={`Read ${note.title}`}>
                Read →
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
