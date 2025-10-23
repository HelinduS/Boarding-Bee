"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { AdminNotification } from "@/types/admin";

export function SecurityAlerts() {
  const [rows, setRows] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    apiGet<AdminNotification[]>("/api/admin/notifications/failed?days=7")
      .then(d => { if (alive) { setRows(d); setLoading(false); } })
      .catch(e => { if (alive) { setErr(e.message); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Checking alerts…</div>;
  if (err) return <div className="text-sm text-red-600">Error: {err}</div>;
  if (rows.length === 0) return <div className="text-sm">No failed notifications in the last 7 days ✅</div>;

  return (
    <div className="space-y-2">
      {rows.map(n => (
        <div key={n.id} className="rounded-xl border p-3 text-sm">
          <div className="font-medium">{n.subject}</div>
          <div className="text-muted-foreground">Status: {n.status} • {new Date(n.createdAt).toLocaleString()}</div>
          <div className="text-muted-foreground truncate">{n.body}</div>
          {n.linkUrl ? <a className="text-blue-600 underline" href={n.linkUrl} target="_blank">Open</a> : null}
        </div>
      ))}
    </div>
  );
}
