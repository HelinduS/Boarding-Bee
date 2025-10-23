"use client";
import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";
import type { ActivityLog } from "@/types/admin";
import { Badge } from "@/components/ui/badge";
import { Home, Check, X as XIcon, Edit3, Repeat, Key, Mail, Star } from "lucide-react";

export function ActivityLog() {
  const [rows, setRows] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all"|"listing"|"user"|"review"|"inquiry">("all");

  useEffect(() => {
    let alive = true;
    apiGet<ActivityLog[]>('/api/admin/activity/recent?limit=200')
      .then(d => { if (alive) { setRows(d); setLoading(false); } })
      .catch((e: any) => { if (alive) { setErr(e.message); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const handler = () => {
      setLoading(true);
      apiGet<ActivityLog[]>('/api/admin/activity/recent?limit=200')
        .then(d => { setRows(d); setLoading(false); })
        .catch((e: any) => { setErr(e.message); setLoading(false); });
    };
    window.addEventListener('activity:changed', handler as EventListener);
    return () => window.removeEventListener('activity:changed', handler as EventListener);
  }, []);

  const parseEmailFromMeta = (meta?: string | null) => {
    if (!meta) return null;
    const m = meta.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return m ? m[0] : null;
  };

  const kindGroup = (kindStr: string) => {
    if (/Listing/i.test(kindStr)) return "listing" as const;
    if (/User/i.test(kindStr)) return "user" as const;
    if (/Review/i.test(kindStr)) return "review" as const;
    if (/Inquiry/i.test(kindStr)) return "inquiry" as const;
    return "listing" as const;
  };

  const iconForKind = (kindStr: string) => {
    if (/ListingCreate/i.test(kindStr)) return <Home className="h-5 w-5 text-black" />;
  if (/ListingApprove/i.test(kindStr)) return <Check className="h-5 w-5 text-green-600" />;
  if (/ListingReject/i.test(kindStr)) return <XIcon className="h-5 w-5 text-red-600" />;
    if (/ListingUpdate/i.test(kindStr)) return <Edit3 className="h-5 w-5 text-indigo-600" />;
    if (/ListingRenew/i.test(kindStr)) return <Repeat className="h-5 w-5 text-indigo-600" />;
    if (/UserLogin/i.test(kindStr)) return <Key className="h-5 w-5 text-yellow-600" />;
    if (/InquiryCreate/i.test(kindStr)) return <Mail className="h-5 w-5 text-purple-600" />;
    if (/ReviewCreate/i.test(kindStr)) return <Star className="h-5 w-5 text-amber-500" />;
    return <Home className="h-5 w-5 text-black" />;
  };

  const friendlyMessage = (r: ActivityLog, kindStr: string) => {
    if (r.listingTitle) {
      if (/ListingCreate/i.test(kindStr)) return `Created listing "${r.listingTitle}"`;
      if (/ListingApprove/i.test(kindStr)) return `Approved listing "${r.listingTitle}"`;
      if (/ListingReject/i.test(kindStr)) return `Rejected listing "${r.listingTitle}"`;
      if (/ListingUpdate/i.test(kindStr)) return `Updated listing "${r.listingTitle}"`;
      if (/ListingRenew/i.test(kindStr)) return `Renewed listing "${r.listingTitle}"`;
    }
    if (/UserLogin/i.test(kindStr)) return `User logged in`;
    if (r.meta) return r.meta;
    return kindStr;
  };

  const filtered = useMemo(() => {
    const q = (query || "").toLowerCase();
    return rows.filter(r => {
      const kindStr = (r.kind ?? "").toString();
      const group = kindGroup(kindStr);
      if (kindFilter !== "all" && group !== kindFilter) return false;

      // prefer email, then username for searching
      const actor = r.actorEmail ?? r.actorUsername ?? parseEmailFromMeta(r.meta) ?? (r.actorUserId ? `user ${r.actorUserId}` : "system");
      const hay = [actor, r.listingTitle, kindStr, r.meta].filter(Boolean).join(" ").toLowerCase();
      if (!q) return true;
      return hay.includes(q);
    });
  }, [rows, query, kindFilter]);

  const formatDate = (s?: string | null) => {
    if (!s) return "";
    const d = new Date(s);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading activity…</div>;
  if (err) return <div className="text-sm text-red-600">Error: {err}</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <input
          placeholder="Search activities..."
          className="flex-1 border rounded px-3 py-2"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as any)} className="border rounded px-3 py-2">
          <option value="all">All Activities</option>
          <option value="listing">Listing</option>
          <option value="user">User</option>
          <option value="review">Review</option>
          <option value="inquiry">Inquiry</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map(r => {
          const kindStr = (r.kind ?? "").toString();
          const actor = r.actorEmail ?? r.actorUsername ?? parseEmailFromMeta(r.meta) ?? (r.actorUserId ? `user ${r.actorUserId}` : "system");
          const icon = iconForKind(kindStr);
          const tag = kindGroup(kindStr);
          const msg = friendlyMessage(r, kindStr);

          return (
          <div key={r.id} className="rounded-xl border p-4">
            <div className="flex items-start">
              <div className="mr-4 mt-1">{icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-sm">{actor}</div>
                    <Badge variant="outline" className="text-xs">{tag}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDate(r.at)}</div>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {r.listingId ? <a href={`/view-details/${r.listingId}`} className="font-medium text-muted-foreground hover:underline">{msg.includes('"') ? msg : msg}</a> : msg}
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
