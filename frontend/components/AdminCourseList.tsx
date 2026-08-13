type Course = {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
  _count: { chapters: number };
};

export function AdminCourseList({
  courses,
  onEdit,
  onManageChapters,
  onDelete,
}: {
  courses: Course[];
  onEdit: (id: string) => void;
  onManageChapters: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (!courses.length) {
    return (
      <div className="empty-state">
        <p>No courses found. Create your first course!</p>
      </div>
    );
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <>
      <div className="admin-course-cards" aria-label="Courses">
        {courses.map(course => (
          <article className="admin-course-card" key={course.id}>
            <div className="admin-course-card-heading"><h2>{course.title || "Untitled"}</h2><span className={`status-pill ${course.status === "PUBLISHED" ? "published" : "draft"}`}>{course.status === "PUBLISHED" ? "Published" : "Draft"}</span></div>
            <p>{course._count.chapters} {course._count.chapters === 1 ? "chapter" : "chapters"} · Updated {formatDate(course.updatedAt)}</p>
            <div className="admin-course-card-actions"><button className="btn-secondary btn-small" onClick={() => onManageChapters(course.id)}>Manage chapters</button><button className="btn-secondary btn-small" onClick={() => onEdit(course.id)}>Edit course</button><button className="btn-danger btn-small" onClick={() => { if (window.confirm("Delete course and all chapters?")) onDelete(course.id); }}>Delete</button></div>
          </article>
        ))}
      </div>
      <div className="admin-table-wrap glass-card admin-course-table">
        <table className="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Chapters</th>
            <th>Status</th>
            <th>Last Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(course => (
            <tr key={course.id}>
              <td className="title-cell">{course.title || "Untitled"}</td>
              <td>{course._count.chapters}</td>
              <td>
                <span className={`status-pill ${course.status === "PUBLISHED" ? "published" : "draft"}`}>
                  {course.status === "PUBLISHED" ? "Published" : "Draft"}
                </span>
              </td>
              <td>{formatDate(course.updatedAt)}</td>
              <td>
                <div className="action-buttons">
                  <button className="btn-secondary btn-small" onClick={() => onEdit(course.id)}>
                    Edit
                  </button>
                  <button className="btn-secondary btn-small" onClick={() => onManageChapters(course.id)} style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
                    Chapters
                  </button>
                  <button className="btn-secondary btn-small" onClick={() => { if (window.confirm("Delete course and all chapters?")) onDelete(course.id); }} style={{ borderColor: "var(--red)", color: "var(--red)" }}>
                    Delete
                  </button>
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
