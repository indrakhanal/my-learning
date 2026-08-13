"use client";

import { useEffect, useState } from "react";
import { RichTextEditor } from "./RichTextEditor";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
type Resource = { label: string; url: string };
type Attachment = {
  id: string;
  filename: string;
  url: string;
  kind: "IMAGE" | "FILE";
};
export type EditableNote = {
  id: string;
  title: string;
  content: string;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
  tags: { tag: { name: string } }[];
  resources: Resource[];
  attachments: Attachment[];
};

export function NoteEditor({
  token,
  note,
  onSaved,
}: {
  token: string;
  note?: EditableNote;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("<p>Start writing your note…</p>");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [resources, setResources] = useState<Resource[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [resource, setResource] = useState<Resource>({ label: "", url: "" });
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [persistedId, setPersistedId] = useState<string | null>(null);

  useEffect(() => {
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "<p>Start writing your note…</p>");
    setTags(note?.tags.map(item => item.tag.name).join(", ") ?? "");
    setStatus(note?.status ?? "DRAFT");
    setResources(note?.resources ?? []);
    setAttachments(note?.attachments ?? []);
    setFile(null);
    setPersistedId(note?.id ?? null);
    setMessage("");
  }, [note]);

  const payload = (overrideStatus = status) => ({
    title,
    content,
    status: overrideStatus,
    tags: tags.split(",").map(tag => tag.trim()).filter(Boolean),
    resources,
  });

  function addResource() {
    try { new URL(resource.url); } catch { setMessage("Add a valid resource URL."); setMessageType("error"); return; }
    if (!resource.label.trim()) { setMessage("Add a label for the resource."); setMessageType("error"); return; }
    setResources(current => [...current, { label: resource.label.trim(), url: resource.url.trim() }]);
    setResource({ label: "", url: "" });
  }

  async function uploadFile(noteId: string, image: File) {
    const form = new FormData();
    form.append("file", image);
    const response = await fetch(`${api}/uploads/${noteId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Image upload failed");
    return result as Attachment;
  }

  async function uploadInlineImage(image: File) {
    try {
      let noteId = persistedId ?? note?.id;
      if (!noteId) {
        if (!title.trim()) { setMessage("Add a title before inserting an image."); setMessageType("error"); return null; }
        setMessage("Saving a draft before uploading…");
        setMessageType("success");
        const response = await fetch(`${api}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload("DRAFT")),
        });
        const draft = await response.json();
        if (!response.ok) throw new Error(draft.error ?? "Could not create draft");
        noteId = String(draft.id);
        setPersistedId(noteId);
      }
      const attachment = await uploadFile(noteId as string, image);
      setAttachments(current => current.some(item => item.id === attachment.id) ? current : [...current, attachment]);
      setMessage("Image uploaded. Save to persist changes.");
      setMessageType("success");
      return attachment.url;
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
      const noteId = persistedId ?? note?.id;
      const response = await fetch(noteId ? `${api}/notes/${noteId}` : `${api}/notes`, {
        method: noteId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload()),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.error ?? "Could not save note");
      setPersistedId(saved.id);
      if (file) {
        const attachment = await uploadFile(saved.id, file);
        setAttachments(current => current.some(item => item.id === attachment.id) ? current : [...current, attachment]);
        setFile(null);
      }
      setMessage(noteId ? "Note updated." : "Note created.");
      setMessageType("success");
      onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save note");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAttachment(attachment: Attachment) {
    const noteId = persistedId ?? note?.id;
    if (!noteId || !window.confirm(`Delete ${attachment.filename}? This cannot be undone.`)) return;

    setMessage("");
    try {
      const response = await fetch(`${api}/notes/${noteId}/attachments/${attachment.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "Could not delete attachment");
      }
      setAttachments(current => current.filter(item => item.id !== attachment.id));
      setMessage("Attachment deleted.");
      setMessageType("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete attachment");
      setMessageType("error");
    }
  }

  return (
    <section className="admin-shell">
      {/* Heading */}
      <div className="editor-heading">
        <div>
          <p className="eyebrow">✏️ Editor</p>
          <h1>{note || persistedId ? "Edit note" : "Create a learning note"}</h1>
          <p>Format ideas richly, add useful links, and publish when ready.</p>
        </div>
        <span className={`status-pill ${status.toLowerCase()}`}>
          {status === "PUBLISHED" ? "Published" : "Draft"}
        </span>
      </div>

      <div className="editor-grid">
        {/* ── Main compose area ── */}
        <div className="glass-card compose-card">
          <label htmlFor="note-title">
            Title
            <input
              id="note-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What did you learn?"
            />
          </label>

          <label htmlFor="note-tags">
            Tags
            <input
              id="note-tags"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="react, databases, design — comma-separated"
            />
          </label>

          <RichTextEditor
            value={content}
            onChange={setContent}
            onImageUpload={uploadInlineImage}
          />

          <div className="editor-actions">
            <select
              id="note-status"
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
              id="note-save-btn"
            >
              {saving ? "Saving…" : note || persistedId ? "Update note" : "Save note"}
            </button>
          </div>

          {message && (
            <p className={`form-message${messageType === "error" ? " error" : ""}`} role="status">
              {message}
            </p>
          )}
        </div>

        {/* ── Side panel ── */}
        <aside className="side-panel">
          {/* Resources */}
          <section className="glass-card">
            <h2>Resources &amp; links</h2>
            <p>Keep references separate from your note body.</p>

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

            <button
              type="button"
              className="btn-secondary"
              style={{ width: "100%" }}
              onClick={addResource}
            >
              + Add resource
            </button>

            {resources.length > 0 && (
              <ul className="resource-list">
                {resources.map((item, index) => (
                  <li key={`${item.url}-${index}`}>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      {item.label}
                    </a>
                    <button
                      type="button"
                      aria-label={`Remove ${item.label}`}
                      onClick={() => setResources(cur => cur.filter((_, i) => i !== index))}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Attachment */}
          <section className="glass-card">
            <h2>Attachment</h2>
            <p>Upload one image or PDF as a separate downloadable attachment.</p>
            <label htmlFor="note-file" style={{ cursor: "pointer" }}>
              File
              <input
                id="note-file"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {file && (
              <small style={{ color: "var(--green)" }}>
                ✓ {file.name}
              </small>
            )}
            {attachments.length > 0 && (
              <ul className="attachment-manager" aria-label="Uploaded attachments">
                {attachments.map(attachment => (
                  <li key={attachment.id}>
                    <a href={attachment.url} target="_blank" rel="noreferrer">
                      {attachment.filename}
                    </a>
                    <button
                      type="button"
                      className="btn-danger btn-small"
                      onClick={() => deleteAttachment(attachment)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}
