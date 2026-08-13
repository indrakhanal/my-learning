"use client";

import { useState, useEffect, useCallback } from "react";
import { NoteEditor, type EditableNote } from "../../components/NoteEditor";
import { AdminDashboard } from "../../components/AdminDashboard";
import { AdminNoteList } from "../../components/AdminNoteList";
import { CourseEditor, type EditableCourse } from "../../components/CourseEditor";
import { ChapterEditor, type EditableChapter } from "../../components/ChapterEditor";
import { AdminCourseList } from "../../components/AdminCourseList";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type ViewState = "dashboard" | "notes" | "editor" | "courses" | "course-editor" | "chapters" | "chapter-editor";

export default function Admin() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [view, setView] = useState<ViewState>("dashboard");
  
  // Note state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [notes, setNotes] = useState<EditableNote[]>([]);
  
  // Course state
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courses, setCourses] = useState<EditableCourse[]>([]);
  
  // Chapter state
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<EditableChapter[]>([]);

  const fetchNotes = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${api}/notes`, { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setNotes(await r.json());
    } catch (e) { console.error(e); }
  }, [token]);

  const fetchCourses = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${api}/courses`, { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setCourses(await r.json());
    } catch (e) { console.error(e); }
  }, [token]);

  const fetchChapters = useCallback(async (courseId: string) => {
    if (!token) return;
    try {
      const r = await fetch(`${api}/courses/${courseId}/chapters`, { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setChapters(await r.json());
    } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchNotes();
      fetchCourses();
    }
  }, [token, fetchNotes, fetchCourses]);

  async function publishNote(id: string) {
    const note = notes.find(item => item.id === id);
    if (!note) return;
    const response = await fetch(`${api}/notes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: note.title,
        content: note.content,
        status: "PUBLISHED",
        tags: note.tags.map(item => item.tag.name),
        resources: note.resources,
      }),
    });
    if (!response.ok) return setMessage((await response.json()).error ?? "Could not publish note");
    setMessage("Note published successfully.");
    fetchNotes();
  }

  async function deleteCourse(id: string) {
    const response = await fetch(`${api}/courses/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return setMessage("Could not delete course");
    setMessage("Course deleted.");
    fetchCourses();
  }

  async function deleteChapter(courseId: string, chapterId: string) {
    const response = await fetch(`${api}/courses/${courseId}/chapters/${chapterId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return setMessage("Could not delete chapter");
    setMessage("Chapter deleted.");
    fetchChapters(courseId);
  }

  async function reorderChapter(courseId: string, chapterId: string, direction: "up" | "down") {
    const response = await fetch(`${api}/courses/${courseId}/chapters/${chapterId}/order`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ direction }),
    });
    if (response.ok) fetchChapters(courseId);
  }

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoggingIn(true);
    setMessage("");
    try {
      const form = new FormData(e.currentTarget);
      const r = await fetch(`${api}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const json = await r.json();
      if (!r.ok) {
        setMessage(json.error ?? "Invalid credentials.");
        return;
      }
      setToken(json.token);
    } catch (err) {
      setMessage("Cannot reach the server. Make sure the backend is running.");
      console.error("Login error:", err);
    } finally {
      setLoggingIn(false);
    }
  }

  /* ── Login Screen ── */
  if (!token) {
    return (
      <div className="login-wrap">
        <div className="glass-card login-card fade-in">
          <div className="login-logo">
            <div className="login-logo-icon" aria-hidden="true">🔐</div>
            <h1>Admin Sign In</h1>
            <p>Access your learning dashboard</p>
          </div>

          <form onSubmit={login} className="login-form">
            <label htmlFor="admin-email">
              Email Address
              <input id="admin-email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
            </label>
            <label htmlFor="admin-password">
              Password
              <input id="admin-password" name="password" type="password" placeholder="••••••••" required autoComplete="current-password" />
            </label>
            <button type="submit" className="btn-primary" disabled={loggingIn} style={{ marginTop: "0.5rem" }}>
              {loggingIn ? "Signing in…" : "Sign in →"}
            </button>
          </form>
          {message && <p className="login-error" role="alert">{message}</p>}
        </div>
      </div>
    );
  }

  /* ── Admin Shell ── */
  return (
    <div className="admin-layout fade-in">
      <aside className="glass-card admin-sidebar" aria-label="Admin navigation">
        <h2>Admin Menu</h2>

        <button className={`admin-nav-btn${view === "dashboard" ? " active" : ""}`} onClick={() => { setView("dashboard"); setMessage(""); }}>
          📊 Dashboard
        </button>

        <button className={`admin-nav-btn${view === "notes" ? " active" : ""}`} onClick={() => { setView("notes"); setMessage(""); }}>
          📋 Notes
        </button>

        <button className={`admin-nav-btn${view === "editor" && !editingNoteId ? " active" : ""}`} onClick={() => { setEditingNoteId(null); setView("editor"); setMessage(""); }}>
          ✏️ New Note
        </button>
        
        <div className="admin-sidebar-divider hide-mobile" />
        
        <button className={`admin-nav-btn${view === "courses" || view === "chapters" || view === "chapter-editor" ? " active" : ""}`} onClick={() => { setView("courses"); setMessage(""); }}>
          📚 Courses
        </button>
        
        <button className={`admin-nav-btn${view === "course-editor" && !editingCourseId ? " active" : ""}`} onClick={() => { setEditingCourseId(null); setView("course-editor"); setMessage(""); }}>
          + New Course
        </button>

        <div className="admin-sidebar-divider hide-mobile" />

        <button className="admin-nav-logout" onClick={() => setToken("")}>
          ↩ Sign out
        </button>
      </aside>

      <div className="admin-content">
        {view === "dashboard" && (
          <div>
            <div className="admin-page-header">
              <div>
                <h1>Dashboard</h1>
                <p>Welcome back! Here's an overview of your content.</p>
              </div>
            </div>
            <AdminDashboard notes={notes} courses={courses} />
            {message && <p className="form-message" style={{ marginTop: "1rem" }}>{message}</p>}
          </div>
        )}

        {/* --- NOTES --- */}
        {view === "notes" && (
          <div>
            <div className="admin-page-header">
              <div>
                <h1>Manage Notes</h1>
                <p>Edit, publish, or create new learning notes.</p>
              </div>
              <button className="btn-primary" onClick={() => { setEditingNoteId(null); setView("editor"); }}>
                + New Note
              </button>
            </div>
            <AdminNoteList
              notes={notes}
              onEdit={(id) => { setEditingNoteId(id); setView("editor"); }}
              onPublish={publishNote}
            />
          </div>
        )}

        {view === "editor" && (
          <NoteEditor
            token={token}
            note={notes.find(note => note.id === editingNoteId)}
            onSaved={() => {
              setMessage("Note saved successfully.");
              fetchNotes();
              setView("notes");
            }}
          />
        )}

        {/* --- COURSES --- */}
        {view === "courses" && (
          <div>
            <div className="admin-page-header">
              <div>
                <h1>Manage Courses</h1>
                <p>Create curriculum tracks and manage their chapters.</p>
              </div>
              <button className="btn-primary" onClick={() => { setEditingCourseId(null); setView("course-editor"); }}>
                + New Course
              </button>
            </div>
            <AdminCourseList
              courses={courses}
              onEdit={(id) => { setEditingCourseId(id); setView("course-editor"); }}
              onManageChapters={(id) => { setSelectedCourseId(id); fetchChapters(id); setView("chapters"); }}
              onDelete={deleteCourse}
            />
          </div>
        )}

        {view === "course-editor" && (
          <CourseEditor
            token={token}
            course={courses.find(c => c.id === editingCourseId) as any}
            onSaved={() => {
              setMessage("Course saved successfully.");
              fetchCourses();
              setView("courses");
            }}
          />
        )}

        {/* --- CHAPTERS --- */}
        {view === "chapters" && selectedCourseId && (
          <div>
            <div className="admin-page-header">
              <div>
                <button className="btn-secondary btn-small" onClick={() => setView("courses")} style={{ marginBottom: "1rem" }}>← Back to Courses</button>
                <h1>Manage Chapters</h1>
                <p>Chapters for: {courses.find(c => c.id === selectedCourseId)?.title}</p>
              </div>
              <button className="btn-primary" onClick={() => { setEditingChapterId(null); setView("chapter-editor"); }}>
                + New Chapter
              </button>
            </div>
            
            {message && <p className="form-message" style={{ marginBottom: "1rem" }}>{message}</p>}

            <div className="admin-chapter-cards" aria-label="Chapters">
              {chapters.map((chapter, index) => (
                <article className="admin-chapter-card" key={chapter.id}>
                  <div><span className="chapter-order">Chapter {chapter.order}</span><h2>{chapter.title}</h2></div>
                  <div className="admin-chapter-card-actions">
                    <button className="btn-secondary btn-small" disabled={index === 0} onClick={() => reorderChapter(selectedCourseId, chapter.id, "up")}>Move up</button>
                    <button className="btn-secondary btn-small" disabled={index === chapters.length - 1} onClick={() => reorderChapter(selectedCourseId, chapter.id, "down")}>Move down</button>
                    <button className="btn-secondary btn-small" onClick={() => { setEditingChapterId(chapter.id); setView("chapter-editor"); }}>Edit</button>
                    <button className="btn-danger btn-small" onClick={() => { if (window.confirm("Delete chapter?")) deleteChapter(selectedCourseId, chapter.id); }}>Delete</button>
                  </div>
                </article>
              ))}
              {chapters.length === 0 && <div className="empty-state"><p>No chapters yet. Select “New Chapter” to add the first one.</p></div>}
            </div>
            
            <div className="admin-table-wrap glass-card admin-chapter-table">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Title</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {chapters.map((chapter, index) => (
                    <tr key={chapter.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {chapter.order}
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <button disabled={index === 0} onClick={() => reorderChapter(selectedCourseId, chapter.id, "up")} style={{ cursor: index === 0 ? "default" : "pointer", background: "none", border: "none", opacity: index === 0 ? 0.3 : 1 }}>▲</button>
                            <button disabled={index === chapters.length - 1} onClick={() => reorderChapter(selectedCourseId, chapter.id, "down")} style={{ cursor: index === chapters.length - 1 ? "default" : "pointer", background: "none", border: "none", opacity: index === chapters.length - 1 ? 0.3 : 1 }}>▼</button>
                          </div>
                        </div>
                      </td>
                      <td className="title-cell">{chapter.title}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-secondary btn-small" onClick={() => { setEditingChapterId(chapter.id); setView("chapter-editor"); }}>Edit</button>
                          <button className="btn-secondary btn-small" onClick={() => { if (window.confirm("Delete chapter?")) deleteChapter(selectedCourseId, chapter.id); }} style={{ borderColor: "var(--red)", color: "var(--red)" }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {chapters.length === 0 && <tr><td colSpan={3} style={{ textAlign: "center", padding: "2rem" }}>No chapters yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "chapter-editor" && selectedCourseId && (
          <ChapterEditor
            token={token}
            courseId={selectedCourseId}
            chapter={chapters.find(c => c.id === editingChapterId) as any}
            onSaved={() => {
              setMessage("Chapter saved successfully.");
              fetchChapters(selectedCourseId);
              fetchCourses(); // update chapter count on course list
              setView("chapters");
            }}
          />
        )}
      </div>
    </div>
  );
}
