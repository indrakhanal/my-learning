"use client";

import { createContext, useContext, useEffect, useState } from "react";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const storageKey = "courseAccessToken";
const deviceStorageKey = "courseAccessDeviceId";
const CourseAccessContext = createContext<string | null>(null);

function getDeviceId() {
  let deviceId = window.localStorage.getItem(deviceStorageKey);
  if (!deviceId) { deviceId = crypto.randomUUID(); window.localStorage.setItem(deviceStorageKey, deviceId); }
  return deviceId;
}

export function courseAccessHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "X-Device-ID": getDeviceId() };
}

function ProtectedCourseSurface({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const preventCopy = (event: Event) => event.preventDefault();
    const preventShortcuts = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ["c", "x", "s", "p", "u"].includes(event.key.toLowerCase())) event.preventDefault();
      if (event.key === "PrintScreen") event.preventDefault();
    };
    const onVisibilityChange = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("copy", preventCopy);
    document.addEventListener("cut", preventCopy);
    document.addEventListener("contextmenu", preventCopy);
    document.addEventListener("dragstart", preventCopy);
    document.addEventListener("keydown", preventShortcuts);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("copy", preventCopy); document.removeEventListener("cut", preventCopy);
      document.removeEventListener("contextmenu", preventCopy); document.removeEventListener("dragstart", preventCopy);
      document.removeEventListener("keydown", preventShortcuts); document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
  return <div className={`course-protected-content${hidden ? " course-protected-hidden" : ""}`}>{children}</div>;
}

export function useCourseAccessToken() {
  return useContext(CourseAccessContext);
}

export function CourseAccessGate({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [accessError, setAccessError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) { setChecking(false); return; }
    fetch(`${api}/courses`, { headers: courseAccessHeaders(saved), cache: "no-store" })
      .then(response => {
        if (response.ok) setToken(saved);
        else {
          window.localStorage.removeItem(storageKey);
          setAccessError(response.status === 401 || response.status === 403
            ? "Your course access has expired. Please verify your email again."
            : "We couldn't verify your course access. Please try again.");
        }
      })
      .catch(() => {
        window.localStorage.removeItem(storageKey);
        setAccessError("Cannot reach the course service. Please try again.");
      })
      .finally(() => setChecking(false));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true); setMessage("");
    try {
      const response = await fetch(`${api}/course-access/verify`, {
        method: "POST", headers: { "Content-Type": "application/json", "X-Device-ID": getDeviceId() }, body: JSON.stringify({ email }),
      });
      const json = await response.json();
      if (!response.ok) { setMessage(json.error ?? "This email does not have course access."); return; }
      window.localStorage.setItem(storageKey, json.token);
      setToken(json.token);
    } catch { setMessage("Cannot reach the server. Please try again."); }
    finally { setSubmitting(false); }
  }

  if (checking) return <div className="access-check-state" aria-busy="true" aria-live="polite"><span className="loading-spinner" aria-hidden="true" /><p>Checking course access…</p></div>;
  if (!token) return (
    <div className="login-wrap">
      <div className="glass-card login-card fade-in">
        <div className="login-logo"><div className="login-logo-icon" aria-hidden="true">🔒</div><h1>Course access</h1><p>Enter your registered email to continue.</p></div>
        <form onSubmit={submit} className="login-form">
          <label htmlFor="course-access-email">Email address<input id="course-access-email" type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" /></label>
          <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Checking…" : "Continue →"}</button>
        </form>
        {(accessError || message) && <p className="login-error" role="alert">{accessError || message}</p>}
      </div>
    </div>
  );
  return <CourseAccessContext.Provider value={token}><ProtectedCourseSurface>{children}</ProtectedCourseSurface></CourseAccessContext.Provider>;
}
