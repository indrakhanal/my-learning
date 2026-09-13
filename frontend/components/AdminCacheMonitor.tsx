"use client";

import { useCallback, useEffect, useState } from "react";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
type CacheEvent = { at: string; key: string; source: "CACHE" | "DATABASE"; status: "HIT" | "MISS" | "BYPASS" | "ERROR" };
type CacheStatus = { enabled: boolean; ttlSeconds: number; hits: number; misses: number; bypasses: number; errors: number; hitRate: number; totalReads: number; events: CacheEvent[] };

export function AdminCacheMonitor({ token }: { token: string }) {
  const [status, setStatus] = useState<CacheStatus | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const response = await fetch(`${api}/cache/status`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (!response.ok) throw new Error("Could not load cache status");
      setStatus(await response.json()); setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load cache status"); }
  }, [token]);
  useEffect(() => { load(); const timer = window.setInterval(load, 10000); return () => window.clearInterval(timer); }, [load]);

  if (error) return <p className="login-error" role="alert">{error}</p>;
  if (!status) return <p aria-busy="true">Loading cache status…</p>;
  return <div>
    <div className="admin-page-header"><div><h1>Cache monitor</h1><p>Recent backend reads. The counters reset when the backend restarts.</p></div><button className="btn-secondary" onClick={load}>Refresh</button></div>
    <div className="dashboard-stats">
      <div className="glass-card stat-card total"><div className="stat-value">{status.enabled ? "ON" : "OFF"}</div><div className="stat-label">Redis</div></div>
      <div className="glass-card stat-card published"><div className="stat-value">{status.hits}</div><div className="stat-label">Cache hits</div></div>
      <div className="glass-card stat-card draft"><div className="stat-value">{status.misses}</div><div className="stat-label">Database reads</div></div>
      <div className="glass-card stat-card course"><div className="stat-value">{Math.round(status.hitRate * 100)}%</div><div className="stat-label">Hit rate</div></div>
    </div>
    <div className="admin-table-wrap glass-card" style={{ display: "block", marginTop: "1rem" }}>
      <table className="admin-table"><thead><tr><th>Time</th><th>Source</th><th>Status</th><th>Cache key</th></tr></thead><tbody>
        {status.events.map((event, index) => <tr key={`${event.at}-${index}`}><td>{new Date(event.at).toLocaleTimeString()}</td><td className="title-cell">{event.source === "CACHE" ? "Redis cache" : "PostgreSQL"}</td><td>{event.status}</td><td>{event.key}</td></tr>)}
        {!status.events.length && <tr><td colSpan={4}>No cache reads yet. Open a public note or course page.</td></tr>}
      </tbody></table>
    </div>
  </div>;
}
