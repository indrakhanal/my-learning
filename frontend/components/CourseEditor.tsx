"use client";

import { useEffect, useState } from "react";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type EditableCourse = {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
  _count: { chapters: number };
};

export function CourseEditor({
  token,
  course,
  onSaved,
}: {
  token: string;
  course?: EditableCourse;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(course?.title ?? "");
    setDescription(course?.description ?? "");
    setCoverUrl(course?.coverUrl ?? "");
    setStatus(course?.status ?? "DRAFT");
    setMessage("");
  }, [course]);

  const payload = (overrideStatus = status) => ({
    title,
    description,
    coverUrl: coverUrl.trim() || undefined,
    status: overrideStatus,
  });

  async function save() {
    setMessage("");
    setSaving(true);
    try {
      const courseId = course?.id;
      const response = await fetch(courseId ? `${api}/courses/${courseId}` : `${api}/courses`, {
        method: courseId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload()),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.error ?? "Could not save course");
      
      setMessage(courseId ? "Course updated." : "Course created.");
      setMessageType("success");
      onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save course");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-shell">
      <div className="editor-heading">
        <div>
          <p className="eyebrow">🎓 Course Editor</p>
          <h1>{course ? "Edit course" : "Create a new course"}</h1>
          <p>Define the curriculum container. Chapters are added later.</p>
        </div>
        <span className={`status-pill ${status.toLowerCase()}`}>
          {status === "PUBLISHED" ? "Published" : "Draft"}
        </span>
      </div>

      <div className="glass-card compose-card" style={{ maxWidth: "800px", margin: "0 auto" }}>
        <label htmlFor="course-title">
          Title
          <input
            id="course-title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Data Structures & Algorithms"
          />
        </label>

        <label htmlFor="course-description">
          Description
          <textarea
            id="course-description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What will students learn?"
            style={{ width: "100%", padding: "0.75rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text)", fontFamily: "inherit", resize: "vertical", minHeight: "100px", marginBottom: "1rem" }}
          />
        </label>

        <label htmlFor="course-cover">
          Cover Image URL (optional)
          <input
            id="course-cover"
            value={coverUrl}
            onChange={e => setCoverUrl(e.target.value)}
            placeholder="https://..."
            type="url"
          />
        </label>

        <div className="editor-actions">
          <select
            id="course-status"
            value={status}
            onChange={e => setStatus(e.target.value as typeof status)}
            aria-label="Publication status"
          >
            <option value="DRAFT">Save as draft</option>
            <option value="PUBLISHED">Publish now</option>
          </select>

          <button
            type="button"
            className="btn-primary"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving…" : course ? "Update course" : "Save course"}
          </button>
        </div>

        {message && (
          <p className={`form-message${messageType === "error" ? " error" : ""}`} role="status">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
