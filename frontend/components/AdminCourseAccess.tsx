"use client";

import { useEffect, useState } from "react";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
type AccessEmail = { id: string; email: string; duration: "MONTH" | "YEAR"; expiresAt: string; createdAt: string };

export function AdminCourseAccess({ token }: { token: string }) {
  const [emails, setEmails] = useState<AccessEmail[]>([]);
  const [email, setEmail] = useState("");
  const [duration, setDuration] = useState<"MONTH" | "YEAR">("MONTH");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function load() {
    const response = await fetch(`${api}/course-access/emails`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (response.ok) setEmails(await response.json());
  }
  useEffect(() => { load().catch(() => setMessage("Could not load access emails.")); }, [token]);

  async function add(event: React.FormEvent) {
    event.preventDefault(); setMessage(""); setError(false);
    const response = await fetch(`${api}/course-access/emails`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ email, duration }) });
    const json = await response.json();
    if (!response.ok) { setError(true); setMessage(json.error ?? "Could not add email."); return; }
    setEmail(""); setDuration("MONTH"); setMessage("Access email added."); load();
  }

  async function remove(id: string) {
    const response = await fetch(`${api}/course-access/emails/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) { setError(true); setMessage("Could not remove email."); return; }
    setMessage("Access revoked."); load();
  }

  return <div>
    <div className="admin-page-header"><div><h1>Course access</h1><p>Only these email addresses can open published courses.</p></div></div>
    <form onSubmit={add} className="glass-card compose-card" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
      <label htmlFor="access-email" style={{ flex: "1 1 260px" }}>Add email<input id="access-email" type="email" value={email} onChange={event => setEmail(event.target.value)} required placeholder="learner@example.com" /></label>
      <label htmlFor="access-duration" style={{ flex: "0 1 170px" }}>Access duration<select id="access-duration" value={duration} onChange={event => setDuration(event.target.value as "MONTH" | "YEAR")}><option value="MONTH">1 month</option><option value="YEAR">1 year</option></select></label>
      <button className="btn-primary" type="submit" style={{ alignSelf: "end" }}>Add access</button>
    </form>
    {message && <p className={`form-message${error ? " error" : ""}`} role="status">{message}</p>}
    <div className="admin-table-wrap glass-card" style={{ display: "block", marginTop: "1rem" }}><table className="admin-table"><thead><tr><th>Email</th><th>Added</th><th>Actions</th></tr></thead><tbody>
      {emails.map(item => <tr key={item.id}><td className="title-cell">{item.email}</td><td>{item.duration === "MONTH" ? "1 month" : "1 year"} · Expires {new Date(item.expiresAt).toLocaleDateString()}</td><td><button className="btn-danger btn-small" onClick={() => { if (window.confirm(`Revoke access for ${item.email}?`)) remove(item.id); }}>Revoke</button></td></tr>)}
      {!emails.length && <tr><td colSpan={3}>No course access emails yet.</td></tr>}
    </tbody></table></div>
  </div>;
}
