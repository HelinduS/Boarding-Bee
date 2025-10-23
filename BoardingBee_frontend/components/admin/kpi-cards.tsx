"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { Kpis } from "@/types/admin";
import { Users, Home, Clock, Star } from "lucide-react";
import ReviewsDialog from "@/components/admin/reviews-dialog";

export function KPICards() {
  const [data, setData] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [reviewsOpen, setReviewsOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    apiGet<Kpis>("/api/admin/reports/kpis")
      .then(d => { if (alive) { setData(d); setLoading(false); } })
      .catch(e => { if (alive) { setErr(e.message); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Loading KPIs…</div>;
  if (err) return <div className="text-sm text-red-500">Error: {err}</div>;
  if (!data) return null;

    return (
      <div className="rounded-2xl p-4 bg-muted/10"> 
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          <Kpi label="Total Users" value={data.totalUsers} icon={<Users className="w-5 h-5 text-slate-500" />} />
          <Kpi label="Total Listings" value={data.totalListings} icon={<Home className="w-5 h-5 text-slate-500" />} />
          <Kpi label="New Listings (30d)" value={data.newListings30} icon={<Home className="w-5 h-5 text-slate-500" />} />
          <div onClick={() => setReviewsOpen(true)}>
            <Kpi label="Reviews (30d)" value={data.reviews30} icon={<Star className="w-5 h-5 text-slate-500" />} />
          </div>
          <Kpi label="Inquiries (30d)" value={data.inquiries30} icon={<Clock className="w-5 h-5 text-slate-500" />} />
        </div>
        <ReviewsDialog open={reviewsOpen} onOpenChange={(o) => setReviewsOpen(o)} listingId={undefined} />
      </div>
    );
}

function Kpi({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-muted-foreground text-sm">{icon}</div>
      </div>

      <div className="mt-4 text-2xl font-semibold">{value}</div>
    </div>
  );
}
