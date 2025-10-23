"use client";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { Check, X as XIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { ListingDetail } from "@/types/admin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import type { AdminPendingResponse, Listing } from "@/types/admin";

export function ModerationQueue() {
  const [items, setItems] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [totals, setTotals] = useState<{ pending: number; approved: number; rejected: number }>({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"pending"|"approved"|"rejected">("pending");
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; listingId: number | null }>({ open: false, listingId: null });
  const [rejectReason, setRejectReason] = useState("");
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; listingId?: number | null; listing?: ListingDetail | null }>({ open: false, listingId: null, listing: null });
  const pageSize = 10;

  const loadList = async (tab: "pending"|"approved"|"rejected") => {
    setLoading(true);
    try {
      const url = `/api/admin/listings/${tab}?page=${page}&pageSize=${pageSize}`;
      const data = await apiGet<AdminPendingResponse>(url);
      setItems(data.items);
      setTotal(data.total);
      setTotals(t => ({ ...t, [tab]: data.total }));
      setErr(null);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadList(activeTab); /* eslint-disable-next-line */ }, [page, activeTab]);

  // load totals for all tabs on mount so labels show counts
  const loadCounts = async () => {
    try {
      const p = await apiGet<AdminPendingResponse>(`/api/admin/listings/pending?page=1&pageSize=1`);
      const a = await apiGet<AdminPendingResponse>(`/api/admin/listings/approved?page=1&pageSize=1`);
      const r = await apiGet<AdminPendingResponse>(`/api/admin/listings/rejected?page=1&pageSize=1`);
      setTotals({ pending: p.total, approved: a.total, rejected: r.total });
    } catch (e) {
      // ignore count errors — UI will still work
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  const changeTab = (tab: "pending"|"approved"|"rejected") => {
    // reset paging when user switches tab
    setPage(1);
    setActiveTab(tab);
  };

  const [selected, setSelected] = useState<number[]>([]);

  const toggleSelect = (id: number, checked: boolean) => {
    setSelected(s => checked ? Array.from(new Set([...s, id])) : s.filter(x => x !== id));
  };

  const approve = async (listingId: number) => {
    try {
      await apiPost(`/api/admin/listings/approve`, { listingId });
      await loadList(activeTab);
      await loadCounts();
      // notify other components (activity log) that something changed
      try { window.dispatchEvent(new CustomEvent('activity:changed')); } catch {}
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  };

  const reject = async (listingId: number) => {
    // open modal to collect reason
    setRejectReason("");
    setRejectDialog({ open: true, listingId });
  };

  const openDetails = async (listingId: number) => {
    // open dialog and fetch full listing details
    setDetailDialog({ open: true, listingId, listing: null });
    try {
      const d = await apiGet<ListingDetail>(`/api/listings/${listingId}`);
      setDetailDialog({ open: true, listingId, listing: d });
    } catch (e) {
      setDetailDialog({ open: true, listingId, listing: null });
    }
  };

  const confirmReject = async () => {
    if (!rejectDialog.listingId) {
      setRejectDialog({ open: false, listingId: null });
      return;
    }
    try {
      setLoading(true);
      await apiPost(`/api/admin/listings/reject`, { listingId: rejectDialog.listingId, reason: rejectReason || "" });
      setRejectDialog({ open: false, listingId: null });
      // refresh list and counts
      await loadList(activeTab);
      await loadCounts();
    } catch (e: any) {
      setErr(e?.message || "Failed to reject listing");
    } finally {
      setLoading(false);
    }
    try { window.dispatchEvent(new CustomEvent('activity:changed')); } catch {}
  };

  const toggleSelect = (id: number) => {
    setSelected(s => ({ ...s, [id]: !s[id] }));
  };

  const toggleSelectAll = () => {
    const next = !selectAll;
    setSelectAll(next);
    if (next) {
      const map: Record<number, boolean> = {};
      items.forEach(i => map[i.id] = true);
      setSelected(map);
    } else {
      setSelected({});
    }
  };

  const renderAmenities = (csv?: string | null) => {
    if (!csv) return null;
    const parts = csv.split(",").map(p => p.trim()).filter(Boolean).slice(0,3);
    return (
      <div className="flex gap-2 mt-2">
        {parts.map((a, idx) => (
          <span key={idx} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">{a}</span>
        ))}
        {csv.split(",").length > 3 && <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">+{csv.split(",").length - 3} more</span>}
      </div>
    );
  };

  const getStatusText = (status: any) => {
    if (!status && status !== 0) return "unknown";
    if (typeof status === "string") return status;
    // backend may return enum as number; map to string labels
    switch (Number(status)) {
      case 0: return "Pending";
      case 1: return "Approved";
      case 2: return "Expired";
      case 3: return "Rejected";
      default: return String(status);
    }
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

  // counts per tab
  const approvedCount = totals.approved;
  const rejectedCount = totals.rejected;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Listing Moderation</h2>
          <p className="text-sm text-muted-foreground">Review and approve pending listings</p>
        </div>
        
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-full bg-gray-100 p-1 flex items-center space-x-2">
          <button onClick={() => changeTab("pending")} className={`px-4 py-2 rounded-full ${activeTab === "pending" ? "bg-white shadow" : "bg-transparent"}`}>
            Pending ({totals.pending})
          </button>
          <button onClick={() => changeTab("approved")} className={`px-4 py-2 rounded-full ${activeTab === "approved" ? "bg-white shadow" : "bg-transparent"}`}>
            Approved ({approvedCount})
          </button>
          <button onClick={() => changeTab("rejected")} className={`px-4 py-2 rounded-full ${activeTab === "rejected" ? "bg-white shadow" : "bg-transparent"}`}>
            Rejected ({rejectedCount})
          </button>
        </div>
      </div>

      

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.length === 0 ? (
          <div className="col-span-2 rounded-xl border p-6 text-sm text-muted-foreground">No listings in this tab.</div>
        ) : (
          items.map(l => (
            <div key={l.id} className="w-full rounded-xl border p-4 flex items-center gap-4">
              <div>
                <input type="checkbox" checked={!!selected[l.id]} onChange={() => toggleSelect(l.id)} />
              </div>
              <div className="w-28 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                <img src={l.imagesCsv ? l.imagesCsv.split(',')[0] : '/placeholder.svg'} alt={l.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-medium">{l.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">{l.location} • Rs. {Number(l.price).toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{l.ownerId ? `Owner ${l.ownerId}` : "Unknown"} • {new Date(l.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground capitalize">{getStatusText(l.status).toLowerCase()}</div>
                </div>
                {renderAmenities(l.amenitiesCsv)}
                <div className="flex gap-3 mt-4">
                  <button onClick={() => openDetails(l.id)} className="rounded-md px-3 py-1.5 text-sm border">View Details</button>
                  {activeTab !== "approved" && (
                    <button onClick={() => approve(l.id)} className="rounded-md px-3 py-1.5 text-sm bg-green-600 text-white">Approve</button>
                  )}
                  {activeTab !== "rejected" && (
                    <button onClick={() => reject(l.id)} className="rounded-md px-3 py-1.5 text-sm bg-red-600 text-white">Reject</button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        <div className="col-span-2 flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">Total: {total}</div>
          <div className="flex gap-2">
            <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-50">Prev</button>
            <button disabled={page*pageSize>=total} onClick={()=>setPage(p=>p+1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {/* Reject reason dialog */}
      <AlertDialog open={rejectDialog.open} onOpenChange={(open: boolean) => setRejectDialog({ open, listingId: open ? rejectDialog.listingId : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Listing</AlertDialogTitle>
            <AlertDialogDescription>Please provide a reason for rejection. This will be sent to the owner.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="block text-sm font-medium mb-2">Rejection Reason</label>
            <Textarea placeholder="e.g., Images are unclear, missing required information..." value={rejectReason} onChange={(e) => setRejectReason((e.target as HTMLTextAreaElement).value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReject} className="bg-destructive text-white">Confirm Rejection</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Listing Details Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(open: boolean) => setDetailDialog({ open, listingId: open ? detailDialog.listingId : null, listing: open ? detailDialog.listing : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">{detailDialog.listing ? detailDialog.listing.title : "Listing Details"}</DialogTitle>
            <DialogDescription>Full listing details</DialogDescription>
          </DialogHeader>

          {detailDialog.listing ? (
            <div className="space-y-6">
              <div className="w-full h-56 bg-gray-100 rounded-lg overflow-hidden">
                <img src={detailDialog.listing.images && detailDialog.listing.images.length ? detailDialog.listing.images[0] : '/placeholder.svg'} alt={String(detailDialog.listing.title)} className="w-full h-full object-cover" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div className="font-medium">{detailDialog.listing.location}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Price</div>
                  <div className="font-medium">Rs. {Number(detailDialog.listing.price).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Owner</div>
                  <div className="font-medium">{detailDialog.listing.ownerName ?? 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{detailDialog.listing.contactEmail ?? "-"}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Description</div>
                <div className="mt-1">{detailDialog.listing.description}</div>
              </div>

              {detailDialog.listing.amenities && detailDialog.listing.amenities.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground">Facilities</div>
                  <div className="mt-2 flex gap-2 flex-wrap">{detailDialog.listing.amenities.map((a: string, i: number) => <span key={i} className="px-2 py-1 rounded-full bg-gray-100 text-sm">{a.trim()}</span>)}</div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 mt-4">
                <button onClick={() => { if (detailDialog.listingId) approve(detailDialog.listingId as number); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => { if (detailDialog.listingId) { setRejectDialog({ open: true, listingId: detailDialog.listingId as number }); } }} className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-rose-600 text-white">
                  <XIcon className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Loading details…</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
