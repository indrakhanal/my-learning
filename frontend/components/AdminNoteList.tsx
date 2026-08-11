type Note = { id: string; title: string; status: "DRAFT" | "PUBLISHED"; updatedAt: string };

export function AdminNoteList({ notes, onEdit, onPublish }: { notes: Note[], onEdit: (id: string) => void; onPublish: (id: string) => void }) {
  if (!notes.length) return <p>No notes found. Create your first note!</p>;

  return (
    <div className="glass-card" style={{ padding: "0" }}>
      <div style={{ overflowX: "auto" }}>
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
                <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{note.title || "Untitled"}</td>
                <td>
                  <span className={`status-pill ${note.status === "PUBLISHED" ? "published" : "draft"}`}>
                    {note.status === "PUBLISHED" ? "Published" : "Draft"}
                  </span>
                </td>
                <td>{new Date(note.updatedAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-small btn-edit" onClick={() => onEdit(note.id)}>Edit</button>
                    {note.status === "DRAFT" && <button className="btn-small btn-publish" onClick={() => onPublish(note.id)}>Publish</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
