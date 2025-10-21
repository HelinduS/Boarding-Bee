"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { Kpis } from "@/types/admin";

export function KPICards() {
  const [data, setData] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    apiGet<Kpis>("/api/admin/reports/kpis")
      .then(d => { if (alive) { setData(d); setLoading(false); } })
      .catch(e => { if (alive) { setErr(e.message); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Loading KPIs…</div>;
  if (err) return <div className="text-sm text-red-600">Error: {err}</div>;
  if (!data) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      <Kpi label="Total Users" value={data.totalUsers} />
      <Kpi label="Total Listings" value={data.totalListings} />
      <Kpi label="New Listings (30d)" value={data.newListings30} />
      <Kpi label="Reviews (30d)" value={data.reviews30} />
      <Kpi label="Inquiries (30d)" value={data.inquiries30} />
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
