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

  const [selected, setSelected] = useState<number[]>([]);

  const toggleSelect = (id: number, checked: boolean) => {
    setSelected(s => checked ? Array.from(new Set([...s, id])) : s.filter(x => x !== id));
  };

  const approve = async (listingId: number) => {
    await apiPost(`/api/admin/listings/approve`, { listingId });
    await load();
  };

  const reject = async (listingId: number, reasonFromPrompt?: string) => {
    const reason = reasonFromPrompt ?? (prompt("Reason for rejection (optional):") || "");
    await apiPost(`/api/admin/listings/reject`, { listingId, reason });
    await load();
  };

  const bulkApprove = async () => {
    if (selected.length === 0) return;
    // call approve for each selected id (backend bulk endpoints optional)
    await Promise.all(selected.map(id => apiPost(`/api/admin/listings/approve`, { listingId: id })));
    setSelected([]);
    await load();
  };

  const bulkReject = async () => {
    if (selected.length === 0) return;
    const reason = prompt("Reason for bulk rejection (optional):") || "";
    await Promise.all(selected.map(id => apiPost(`/api/admin/listings/reject`, { listingId: id, reason })));
    setSelected([]);
    await load();
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading moderation queue…</div>;
  if (err) return <div className="text-sm text-red-600">Error: {err}</div>;
  if (items.length === 0) return <div className="text-sm">No pending listings 🎉</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button data-testid="bulk-approve-button" disabled={selected.length===0} onClick={bulkApprove} className="rounded-lg bg-green-600 text-white px-3 py-1.5 disabled:opacity-50">Bulk Approve</button>
          <button data-testid="bulk-reject-button" disabled={selected.length===0} onClick={bulkReject} className="rounded-lg border px-3 py-1.5 disabled:opacity-50">Bulk Reject</button>
        </div>
        <div className="text-sm text-muted-foreground">Total: {total}</div>
      </div>

      {items.map(l => (
        <div key={l.id} data-testid={`listing-card-${l.id}`} className="rounded-xl border p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input data-testid={`bulk-select-checkbox-${l.id}`} type="checkbox" onChange={(e)=>toggleSelect(l.id, e.target.checked)} checked={selected.includes(l.id)} />
            <div>
              <div className="font-medium">{l.title}</div>
              <div className="text-sm text-muted-foreground">
                {l.location} • Rs.{Number(l.price).toFixed(2)} • created {new Date(l.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button data-testid={`reject-button-${l.id}`} onClick={() => reject(l.id)} className="rounded-lg border px-3 py-1.5">Reject</button>
            <button data-testid={`approve-button-${l.id}`} onClick={() => approve(l.id)} className="rounded-lg bg-green-600 text-white px-3 py-1.5">Approve</button>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-50">Prev</button>
          <button disabled={page*pageSize>=total} onClick={()=>setPage(p=>p+1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}
