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
      <div className="rounded-2xl p-4 bg-gradient-to-br from-gray-50 to-white"> 
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          <Kpi 
            label="Total Users" 
            value={data.totalUsers} 
            icon={<Users className="w-5 h-5" />} 
            gradient="from-blue-500 to-blue-600"
            delay={0}
          />
          <Kpi 
            label="Total Listings" 
            value={data.totalListings} 
            icon={<Home className="w-5 h-5" />} 
            gradient="from-green-500 to-emerald-600"
            delay={100}
          />
          <Kpi 
            label="New Listings (30d)" 
            value={data.newListings30} 
            icon={<Home className="w-5 h-5" />} 
            gradient="from-purple-500 to-violet-600"
            delay={200}
          />
          <div onClick={() => setReviewsOpen(true)} className="cursor-pointer">
            <Kpi 
              label="Reviews (30d)" 
              value={data.reviews30} 
              icon={<Star className="w-5 h-5" />} 
              gradient="from-yellow-500 to-orange-500"
              delay={300}
            />
          </div>
          <Kpi 
            label="Inquiries (30d)" 
            value={data.inquiries30} 
            icon={<Clock className="w-5 h-5" />} 
            gradient="from-pink-500 to-rose-600"
            delay={400}
          />
        </div>
        <ReviewsDialog open={reviewsOpen} onOpenChange={(o) => setReviewsOpen(o)} listingId={undefined} />
      </div>
    );
}

function Kpi({ label, value, icon, gradient, delay = 0 }: { label: string; value: number; icon?: React.ReactNode; gradient?: string; delay?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = value / steps;
    const stepDuration = duration / steps;
    
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div 
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-1 group animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{label}</div>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient || 'from-gray-500 to-gray-600'} text-white shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
          {icon}
        </div>
      </div>

      <div className="relative">
        <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 origin-left">
          {count}
        </div>
        {/* Animated underline */}
        <div className={`h-1 bg-gradient-to-r ${gradient || 'from-gray-500 to-gray-600'} rounded-full mt-2 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
      </div>

      {/* Decorative corner gradient */}
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${gradient || 'from-gray-500 to-gray-600'} opacity-5 rounded-bl-full transition-all duration-500 group-hover:opacity-10 group-hover:w-24 group-hover:h-24`} />
    </div>
  );
}
