"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { ActivitySeriesPoint } from "@/types/admin";

export function ReportsSection() {
  const [rows, setRows] = useState<ActivitySeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    apiGet<ActivitySeriesPoint[]>("/api/admin/reports/activity/series?days=14")
      .then(d => { if (alive) { setRows(d); setLoading(false); } })
      .catch(e => { if (alive) { setErr(e.message); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Loading report…</div>;
  if (err) return <div className="text-sm text-red-600">Error: {err}</div>;
  if (rows.length === 0) return <div className="text-sm">No activity yet.</div>;

  return (
    <div className="rounded-2xl border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-2">Date</th>
            <th className="text-left p-2">Kind</th>
            <th className="text-left p-2">Count</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{new Date(r.d).toLocaleDateString()}</td>
              <td className="p-2">{r.kind}</td>
              <td className="p-2">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
