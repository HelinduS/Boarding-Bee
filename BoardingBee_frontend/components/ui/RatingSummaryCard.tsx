"use client";
import React from "react";
import type { RatingSummary } from "@/lib/reviewsApi";

export default function RatingSummaryCard({ data }: { data: RatingSummary }) {
  const bars = [5, 4, 3, 2, 1];
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-end gap-3">
        <div className="text-4xl font-semibold">{(data?.average ?? 0).toFixed(1)}</div>
        <div className="text-sm text-gray-600">
          {data?.count ?? 0} review{(data?.count ?? 0) === 1 ? "" : "s"}
        </div>
      </div>
      <div className="space-y-1">
        {bars.map((b) => {
          const v = data?.histogram?.[b] ?? 0;
          const total = data?.count || 1;
          const pct = Math.round((v / total) * 100);
          return (
            <div key={b} className="flex items-center gap-2">
              <span className="w-8 text-sm">{b}★</span>
              <div className="flex-1 bg-gray-200 h-2 rounded">
                <div className="h-2 rounded bg-yellow-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-10 text-right text-xs text-gray-600">{v}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
