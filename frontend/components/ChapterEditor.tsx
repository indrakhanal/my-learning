"use client";

import { useEffect, useState } from "react";
import { RichTextEditor } from "./RichTextEditor";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
type Resource = { label: string; url: string };
export type EditableChapter = {
  id: string;
  courseId: string;
  title: string;
  content: string;
  order: number;
  resources: Resource[];
};

export function ChapterEditor({
  token,
  courseId,
  chapter,
  onSaved,
}: {
  token: string;
  courseId: string;
  chapter?: EditableChapter;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("<p>Start writing chapter content…</p>");
  const [resources, setResources] = useState<Resource[]>([]);
  const [resource, setResource] = useState<Resource>({ label: "", url: "" });
  const [file, setFile] = useState<File | null>(null);
  
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [persistedId, setPersistedId] = useState<string | null>(null);

  useEffect(() => {
    setTitle(chapter?.title ?? "");
    setContent(chapter?.content ?? "<p>Start writing chapter content…</p>");
    setResources(chapter?.resources ?? []);
    setFile(null);
    setPersistedId(chapter?.id ?? null);
    setMessage("");
  }, [chapter]);

  const payload = () => ({
    title,
    content,
    resources,
  });

  function addResource() {
    try { new URL(resource.url); } catch { setMessage("Add a valid resource URL."); setMessageType("error"); return; }
    if (!resource.label.trim()) { setMessage("Add a label for the resource."); setMessageType("error"); return; }
    setResources(current => [...current, { label: resource.label.trim(), url: resource.url.trim() }]);
    setResource({ label: "", url: "" });
  }

  async function uploadFile(chapterId: string, image: File) {
    const form = new FormData();
    form.append("file", image);
    const response = await fetch(`${api}/uploads/chapter/${chapterId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Upload failed");
    return result.url as string;
  }

  async function uploadInlineImage(image: File) {
    try {
      let cId = persistedId ?? chapter?.id;
      if (!cId) {
        if (!title.trim()) { setMessage("Add a title before inserting an image."); setMessageType("error"); return null; }
        setMessage("Saving draft before uploading…");
        setMessageType("success");
        const response = await fetch(`${api}/courses/${courseId}/chapters`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload()),
        });
        const draft = await response.json();
        if (!response.ok) throw new Error(draft.error ?? "Could not create draft");
        cId = String(draft.id);
        setPersistedId(cId);
      }
      const url = await uploadFile(cId as string, image);
      setMessage("Image uploaded. Save to persist changes.");
      setMessageType("success");
      return url;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
      setMessageType("error");
      return null;
    }
  }

  async function save() {
    setMessage("");
    setSaving(true);
    try {
      const cId = persistedId ?? chapter?.id;
      const response = await fetch(cId ? `${api}/courses/${courseId}/chapters/${cId}` : `${api}/courses/${courseId}/chapters`, {
        method: cId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload()),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.error ?? "Could not save chapter");
      
      setPersistedId(saved.id);
      if (file) await uploadFile(saved.id, file);
      
      setMessage(cId ? "Chapter updated." : "Chapter created.");
      setMessageType("success");
      onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save chapter");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-shell">
      <div className="editor-heading">
        <div>
          <p className="eyebrow">✏️ Chapter Editor</p>
          <h1>{chapter || persistedId ? "Edit chapter" : "Create a chapter"}</h1>
          <p>Add rich content to this section of the course.</p>
        </div>
        {chapter && (
          <span className="status-pill published">Order: {chapter.order}</span>
        )}
      </div>

      <div className="editor-grid">
        <div className="glass-card compose-card">
          <label htmlFor="chapter-title">
            Title
            <input
              id="chapter-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Chapter Title"
            />
          </label>

          <RichTextEditor
            value={content}
            onChange={setContent}
            onImageUpload={uploadInlineImage}
          />

          <div className="editor-actions" style={{ justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn-primary"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving…" : chapter || persistedId ? "Update chapter" : "Save chapter"}
            </button>
          </div>

          {message && (
            <p className={`form-message${messageType === "error" ? " error" : ""}`} role="status">
              {message}
            </p>
          )}
        </div>

        <aside className="side-panel">
          <section className="glass-card">
            <h2>Resources &amp; links</h2>
            <p>Keep references separate from chapter body.</p>

            <label htmlFor="resource-label">
              Label
              <input
                id="resource-label"
                value={resource.label}
                onChange={e => setResource(cur => ({ ...cur, label: e.target.value }))}
                placeholder="Resource title"
              />
            </label>
            <label htmlFor="resource-url">
              URL
              <input
                id="resource-url"
                value={resource.url}
                onChange={e => setResource(cur => ({ ...cur, url: e.target.value }))}
                placeholder="https://example.com"
                type="url"
              />
            </label>

            <button type="button" className="btn-secondary" style={{ width: "100%" }} onClick={addResource}>
              + Add resource
            </button>

            {resources.length > 0 && (
              <ul className="resource-list">
                {resources.map((item, index) => (
                  <li key={`${item.url}-${index}`}>
                    <a href={item.url} target="_blank" rel="noreferrer">{item.label}</a>
                    <button type="button" onClick={() => setResources(cur => cur.filter((_, i) => i !== index))}>×</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="glass-card">
            <h2>Attachment</h2>
            <p>Upload an image or PDF attachment.</p>
            <label htmlFor="chapter-file" style={{ cursor: "pointer" }}>
              File
              <input
                id="chapter-file"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {file && <small style={{ color: "var(--green)" }}>✓ {file.name}</small>}
          </section>
        </aside>
      </div>
    </section>
  );
}
