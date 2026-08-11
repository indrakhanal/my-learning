"use client"; 
import { useState, useEffect, useCallback } from "react"; 
import { NoteEditor, type EditableNote } from "../../components/NoteEditor";
import { AdminDashboard } from "../../components/AdminDashboard";
import { AdminNoteList } from "../../components/AdminNoteList";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function Admin() { 
  const [token, setToken] = useState(""); 
  const [message, setMessage] = useState("");
  const [view, setView] = useState<"dashboard" | "notes" | "editor">("dashboard");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [notes, setNotes] = useState<EditableNote[]>([]);

  const fetchNotes = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${api}/notes`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const data = await r.json();
        setNotes(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchNotes();
    }
  }, [token, fetchNotes]);

  async function publishNote(id: string) {
    const note = notes.find(item => item.id === id);
    if (!note) return;
    const response = await fetch(`${api}/notes/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ title: note.title, content: note.content, status: "PUBLISHED", tags: note.tags.map(item => item.tag.name), resources: note.resources }) });
    if (!response.ok) return setMessage((await response.json()).error ?? "Could not publish note");
    setMessage("Note published."); fetchNotes();
  }

  async function login(form: FormData) { 
    const r = await fetch(`${api}/auth/login`, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) 
    }); 
    const json = await r.json(); 
    if (!r.ok) return setMessage(json.error); 
    setToken(json.token); 
    setMessage(""); 
  } 

  if (!token) return (
    <div style={{ maxWidth: "400px", margin: "4rem auto" }}>
      <section className="glass-card">
        <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>Admin Sign In</h1>
        <form action={login} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label>Email Address</label>
            <input name="email" type="email" placeholder="you@example.com" required />
          </div>
          <div>
            <label>Password</label>
            <input name="password" type="password" placeholder="••••••••" required />
          </div>
          <button className="btn-primary" style={{ marginTop: "1rem" }}>Sign in</button>
        </form>
        {message && <p style={{ color: "var(--danger)", marginTop: "1.5rem", textAlign: "center" }}>{message}</p>}
      </section>
    </div>
  );

  return (
    <div className="admin-layout">
      <aside className="glass-card admin-sidebar">
        <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "var(--text-secondary)" }}>Admin Menu</h2>
        <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>Dashboard</button>
        <button className={view === "notes" ? "active" : ""} onClick={() => setView("notes")}>Manage Notes</button>
        <button className={view === "editor" ? "active" : ""} onClick={() => { setEditingNoteId(null); setView("editor"); }}>Create New Note</button>
        <div style={{ flexGrow: 1 }}></div>
        <button onClick={() => setToken("")} style={{ color: "var(--danger)" }}>Sign out</button>
      </aside>

      <div className="admin-content">
        {view === "dashboard" && (
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back! Here's an overview of your notes.</p>
            <AdminDashboard notes={notes} />
          </div>
        )}

        {view === "notes" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h1>Manage Notes</h1>
              <button className="btn-primary" onClick={() => { setEditingNoteId(null); setView("editor"); }}>Create Note</button>
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
            <h1>{editingNoteId ? "Edit note" : "Create New Note"}</h1>
            <NoteEditor 
              token={token} 
              note={notes.find(note => note.id === editingNoteId)}
              onSaved={() => { 
                setMessage("Note saved successfully."); 
                fetchNotes();
                setView("notes");
              }} 
            />
            {message && <p style={{ color: "var(--success)", marginTop: "1rem" }}>{message}</p>}
          </div>
        )}
      </div>
    </div>
  ); 
}
