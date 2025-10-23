"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { ActivityLog } from "@/types/admin";

export function ActivityLog() {
  const [rows, setRows] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    apiGet<ActivityLog[]>("/api/admin/activity/recent?limit=50")
      .then(d => { if (alive) { setRows(d); setLoading(false); } })
      .catch(e => { if (alive) { setErr(e.message); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Loading activity…</div>;
  if (err) return <div className="text-sm text-red-600">Error: {err}</div>;

  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div key={r.id} className="rounded-xl border p-3 text-sm">
          <div className="font-medium">{r.kind}</div>
          <div className="text-muted-foreground">At: {new Date(r.at).toLocaleString()}</div>
          <div className="text-muted-foreground">Listing: {r.listingId ?? "-"}</div>
          {r.meta ? <div className="text-muted-foreground">Meta: {r.meta}</div> : null}
        </div>
      ))}
    </div>
  );
}
