"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import type { AdminPendingResponse, Listing } from "@/types/admin";

export function ModerationQueue() {
  const [items, setItems] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet<AdminPendingResponse>(`/api/admin/listings/pending?page=${page}&pageSize=${pageSize}`);
      setItems(data.items);
      setTotal(data.total);
      setErr(null);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  const approve = async (listingId: number) => {
    await apiPost(`/api/admin/listings/approve`, { listingId });
    await load();
  };

  const reject = async (listingId: number) => {
    const reason = prompt("Reason for rejection (optional):") || "";
    await apiPost(`/api/admin/listings/reject`, { listingId, reason });
    await load();
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading moderation queue…</div>;
  if (err) return <div className="text-sm text-red-600">Error: {err}</div>;
  if (items.length === 0) return <div className="text-sm">No pending listings 🎉</div>;

  return (
    <div className="space-y-4">
      {items.map(l => (
        <div key={l.id} className="rounded-xl border p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">{l.title}</div>
            <div className="text-sm text-muted-foreground">
              {l.location} • Rs.{Number(l.price).toFixed(2)} • created {new Date(l.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => reject(l.id)} className="rounded-lg border px-3 py-1.5">Reject</button>
            <button onClick={() => approve(l.id)} className="rounded-lg bg-green-600 text-white px-3 py-1.5">Approve</button>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-muted-foreground">Total: {total}</div>
        <div className="flex gap-2">
          <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-50">Prev</button>
          <button disabled={page*pageSize>=total} onClick={()=>setPage(p=>p+1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}
