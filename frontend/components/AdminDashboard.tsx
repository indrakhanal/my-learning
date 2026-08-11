type Note = { id: string; title: string; status: "DRAFT" | "PUBLISHED"; updatedAt: string };

export function AdminDashboard({ notes }: { notes: Note[] }) {
  const totalNotes = notes.length;
  const publishedNotes = notes.filter(n => n.status === "PUBLISHED").length;
  const draftNotes = totalNotes - publishedNotes;

  return (
    <div className="dashboard-stats">
      <div className="glass-card stat-card total">
        <div className="stat-icon" aria-hidden="true">📝</div>
        <div className="stat-value">{totalNotes}</div>
        <div className="stat-label">Total Notes</div>
      </div>

      <div className="glass-card stat-card published">
        <div className="stat-icon" aria-hidden="true">✅</div>
        <div className="stat-value">{publishedNotes}</div>
        <div className="stat-label">Published</div>
      </div>

      <div className="glass-card stat-card draft">
        <div className="stat-icon" aria-hidden="true">✏️</div>
        <div className="stat-value">{draftNotes}</div>
        <div className="stat-label">Drafts</div>
      </div>
    </div>
  );
}
