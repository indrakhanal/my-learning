"use client";

import { useState, useEffect, useCallback } from "react";
import { NoteEditor, type EditableNote } from "../../components/NoteEditor";
import { AdminDashboard } from "../../components/AdminDashboard";
import { AdminNoteList } from "../../components/AdminNoteList";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function Admin() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [view, setView] = useState<"dashboard" | "notes" | "editor">("dashboard");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [notes, setNotes] = useState<EditableNote[]>([]);

  const fetchNotes = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${api}/notes`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setNotes(await r.json());
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchNotes();
  }, [token, fetchNotes]);

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
            <p>Access your learning notes dashboard</p>
          </div>

          <form onSubmit={login} className="login-form">
            <label htmlFor="admin-email">
              Email Address
              <input
                id="admin-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </label>

            <label htmlFor="admin-password">
              Password
              <input
                id="admin-password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </label>

            <button type="submit" className="btn-primary" disabled={loggingIn} style={{ marginTop: "0.5rem" }}>
              {loggingIn ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          {message && (
            <p className="login-error" role="alert">{message}</p>
          )}
        </div>
      </div>
    );
  }

  /* ── Admin Shell ── */
  return (
    <div className="admin-layout fade-in">
      {/* Sidebar / Tab Strip */}
      <aside className="glass-card admin-sidebar" aria-label="Admin navigation">
        <h2>Admin Menu</h2>

        <button
          id="admin-nav-dashboard"
          className={`admin-nav-btn${view === "dashboard" ? " active" : ""}`}
          onClick={() => setView("dashboard")}
        >
          📊 Dashboard
        </button>

        <button
          id="admin-nav-notes"
          className={`admin-nav-btn${view === "notes" ? " active" : ""}`}
          onClick={() => setView("notes")}
        >
          📋 Manage Notes
        </button>

        <button
          id="admin-nav-create"
          className={`admin-nav-btn${view === "editor" && !editingNoteId ? " active" : ""}`}
          onClick={() => { setEditingNoteId(null); setView("editor"); }}
        >
          ✏️ New Note
        </button>

        <div className="admin-sidebar-divider hide-mobile" />

        <button
          id="admin-nav-logout"
          className="admin-nav-logout"
          onClick={() => setToken("")}
          aria-label="Sign out"
        >
          ↩ Sign out
        </button>
      </aside>

      {/* Content */}
      <div className="admin-content">

        {view === "dashboard" && (
          <div>
            <div className="admin-page-header">
              <div>
                <h1>Dashboard</h1>
                <p>Welcome back! Here's an overview of your notes.</p>
              </div>
            </div>
            <AdminDashboard notes={notes} />

            {message && (
              <p className="form-message" style={{ marginTop: "1rem" }}>{message}</p>
            )}
          </div>
        )}

        {view === "notes" && (
          <div>
            <div className="admin-page-header">
              <div>
                <h1>Manage Notes</h1>
                <p>Edit, publish, or create new learning notes.</p>
              </div>
              <button
                className="btn-primary"
                onClick={() => { setEditingNoteId(null); setView("editor"); }}
                id="admin-create-note-btn"
              >
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
          <div>
            <NoteEditor
              token={token}
              note={notes.find(note => note.id === editingNoteId)}
              onSaved={() => {
                setMessage("Note saved successfully.");
                fetchNotes();
                setView("notes");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
