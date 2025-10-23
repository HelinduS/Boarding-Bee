"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { apiGet } from "@/lib/api"

function Stars({ value }: { value?: number | null }) {
  const v = Math.round((value || 0) * 2) / 2; // half-star precision
  const full = Math.floor(v);
  const half = v - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-1 text-yellow-500">
      {Array.from({ length: full }).map((_, i) => <svg key={i} className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.852L19.335 24 12 20.201 4.665 24 6 15.6 0 9.748l8.332-1.73z" /></svg>)}
      {half && <svg className="w-4 h-4" viewBox="0 0 24 24"><defs><linearGradient id="half"><stop offset="50%" stopColor="currentColor"/><stop offset="50%" stopColor="transparent"/></linearGradient></defs><path d="M12 .587l3.668 7.431L24 9.748l-6 5.852L19.335 24 12 20.201 4.665 24 6 15.6 0 9.748l8.332-1.73z" fill="url(#half)" stroke="currentColor"/></svg>}
      {Array.from({ length: empty }).map((_, i) => <svg key={i} className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.852L19.335 24 12 20.201 4.665 24 6 15.6 0 9.748l8.332-1.73z" /></svg>)}
    </div>
  )
}

export default function ReviewsDialog({ open, onOpenChange, listingId }: { open: boolean; onOpenChange: (open: boolean) => void; listingId?: number | null }) {
  const [listing, setListing] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    (async () => {
      if (listingId) {
        try {
          const l = await apiGet(`/api/listings/${listingId}`);
          if (!alive) return;
          setListing(l);
        } catch (e) { }

        try {
          // Request reviews with a large pageSize to get all items in one call when possible.
          // Backend returns a paged shape { items: [], total, page, pageSize } or an array directly.
          let resp: any = null;
          try {
            resp = await apiGet<any>(`/api/listings/${listingId}/reviews?page=1&pageSize=1000`);
          } catch (e) {
            // fallback to other possible endpoints
            try { resp = await apiGet<any>(`/api/reviews?listingId=${listingId}&page=1&pageSize=1000`); } catch { resp = null; }
          }

          if (!alive) return;
          if (!resp) {
            setReviews([]);
          } else if (Array.isArray(resp)) {
            setReviews(resp);
          } else if (resp.items && Array.isArray(resp.items)) {
            setReviews(resp.items);
          } else {
            // try to find an items-like property
            const maybe = Object.values(resp).find((v: any) => Array.isArray(v));
            setReviews(maybe || []);
          }
        } catch (e) {
          if (!alive) return;
          setReviews([]);
        } finally { if (alive) setLoading(false); }
      } else {
        // Admin mode: fetch ALL reviews from the database (no status filter)
        try {
          let resp: any = null;
          try { resp = await apiGet<any>(`/api/admin/reviews?page=1&pageSize=1000`); } catch { resp = await apiGet<any>(`/api/reviews?page=1&pageSize=1000`); }
          if (!alive) return;
          if (!resp) {
            setReviews([]);
          } else if (Array.isArray(resp)) {
            setReviews(resp);
          } else if (resp.items && Array.isArray(resp.items)) {
            setReviews(resp.items);
          } else {
            const maybe = Object.values(resp).find((v: any) => Array.isArray(v));
            setReviews(maybe || []);
          }
        } catch (e) {
          if (!alive) return;
          setReviews([]);
        } finally { if (alive) setLoading(false); }
      }
    })();
    return () => { alive = false; };
  }, [open, listingId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{listingId ? `Reviews` : `All Reviews (${reviews ? reviews.length : 0})`}</DialogTitle>
          <DialogDescription>{listingId ? `Recent reviews for the selected listing` : `All reviews in the database. Use the search box to filter by reviewer, email, listing or comment.`}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading reviews…</div>
        ) : (
          <div className="space-y-4">
            <div className="mb-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by reviewer name, listing, or comment..."
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            {listing && (
              <div className="rounded-md border p-3 bg-yellow-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg">{listing.title}</div>
                    <div className="text-sm text-muted-foreground">Listing: <span className="font-medium">{listing.title}</span> • <span className="font-medium">Location: {listing.location}</span></div>
                  </div>
                  <div className="text-sm text-muted-foreground">Total reviews: {reviews ? reviews.length : 0}</div>
                </div>
              </div>
            )}

            <div className="max-h-[480px] overflow-auto space-y-3 pr-4">
              {reviews && reviews.length > 0 ? (
                  reviews.filter(r => {
                    if (!search) return true;
                    const s = search.toLowerCase();
                    const reviewer = (r.reviewerName ?? r.userName ?? r.userEmail ?? "").toString().toLowerCase();
                    const comment = (r.comment ?? r.body ?? "").toString().toLowerCase();
                    const listingText = (listing?.title ?? r.listingTitle ?? r.listing?.title ?? "").toString().toLowerCase();
                    return reviewer.includes(s) || comment.includes(s) || listingText.includes(s);
                  }).map((r, i) => (
                  <div key={i} className="p-4 rounded-lg border bg-yellow-50">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="font-semibold">{r.reviewerName ?? r.userName ?? `User ${r.userId ?? ''}`}</div>
                          {r.userEmail && <div className="px-2 py-0.5 text-xs bg-white border rounded-full text-muted-foreground">{r.userEmail}</div>}
                          <div className="flex items-center"><Stars value={r.rating ?? r.score ?? null} /></div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">Listing: <span className="font-medium">{r.listingTitle ?? listing?.title ?? ''}</span> • <span className="font-medium">Location: {r.listingLocation ?? listing?.location ?? ''}</span></div>
                        <div className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">{r.comment ?? r.body ?? ''}</div>
                        <div className="text-xs text-muted-foreground mt-2">{new Date(r.createdAt ?? r.at ?? r.date).toLocaleDateString()}</div>
                      </div>
                      <div className="text-sm">
                        <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">{r.status ?? 'Pending'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No reviews found.</div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
