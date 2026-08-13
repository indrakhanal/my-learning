type Note = { id: string; title: string; status: "DRAFT" | "PUBLISHED"; updatedAt: string };
type Course = { id: string; status: "DRAFT" | "PUBLISHED"; _count: { chapters: number } };

export function AdminDashboard({ notes, courses = [] }: { notes: Note[], courses?: Course[] }) {
  const totalNotes = notes.length;
  const publishedNotes = notes.filter(n => n.status === "PUBLISHED").length;
  const draftNotes = totalNotes - publishedNotes;

  const totalCourses = courses.length;
  const coursesWithChapters = courses.filter(c => c._count?.chapters > 0).length;

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
        <div className="stat-label">Published Notes</div>
      </div>

      <div className="glass-card stat-card draft">
        <div className="stat-icon" aria-hidden="true">✏️</div>
        <div className="stat-value">{draftNotes}</div>
        <div className="stat-label">Draft Notes</div>
      </div>

      <div className="glass-card stat-card course">
        <div className="stat-icon" aria-hidden="true">📚</div>
        <div className="stat-value">{totalCourses}</div>
        <div className="stat-label">Total Courses</div>
      </div>

      <div className="glass-card stat-card course-chapters">
        <div className="stat-icon" aria-hidden="true">📖</div>
        <div className="stat-value">{coursesWithChapters}</div>
        <div className="stat-label">Courses with Chapters</div>
      </div>
    </div>
  );
}
