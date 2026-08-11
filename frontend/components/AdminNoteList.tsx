type Note = { id: string; title: string; status: "DRAFT" | "PUBLISHED"; updatedAt: string };

export function AdminNoteList({
  notes,
  onEdit,
  onPublish,
}: {
  notes: Note[];
  onEdit: (id: string) => void;
  onPublish: (id: string) => void;
}) {
  if (!notes.length) {
    return (
      <div className="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>No notes yet. Create your first note!</p>
      </div>
    );
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <>
      {/* ── Mobile: card list ── */}
      <div className="admin-notes-mobile">
        {notes.map(note => (
          <div key={note.id} className="glass-card admin-note-card">
            <div className="admin-note-title">{note.title || "Untitled"}</div>
            <div className="admin-note-row">
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span className={`status-pill ${note.status === "PUBLISHED" ? "published" : "draft"}`}>
                  {note.status === "PUBLISHED" ? "Published" : "Draft"}
                </span>
                <small style={{ color: "var(--text-muted)" }}>{formatDate(note.updatedAt)}</small>
              </div>
              <div className="admin-note-actions">
                <button
                  className="btn-secondary btn-small"
                  onClick={() => onEdit(note.id)}
                  aria-label={`Edit ${note.title}`}
                >
                  Edit
                </button>
                {note.status === "DRAFT" && (
                  <button
                    className="btn-small btn-publish"
                    onClick={() => onPublish(note.id)}
                    aria-label={`Publish ${note.title}`}
                  >
                    Publish
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop: table ── */}
      <div className="admin-table-wrap glass-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {notes.map(note => (
              <tr key={note.id}>
                <td className="title-cell">{note.title || "Untitled"}</td>
                <td>
                  <span className={`status-pill ${note.status === "PUBLISHED" ? "published" : "draft"}`}>
                    {note.status === "PUBLISHED" ? "Published" : "Draft"}
                  </span>
                </td>
                <td>{formatDate(note.updatedAt)}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-secondary btn-small"
                      onClick={() => onEdit(note.id)}
                      aria-label={`Edit ${note.title}`}
                    >
                      Edit
                    </button>
                    {note.status === "DRAFT" && (
                      <button
                        className="btn-small btn-publish"
                        onClick={() => onPublish(note.id)}
                        aria-label={`Publish ${note.title}`}
                      >
                        Publish
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
