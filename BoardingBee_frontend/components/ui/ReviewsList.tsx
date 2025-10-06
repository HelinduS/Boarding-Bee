"use client";
import React from "react";
import RatingStars from "@/components/ui/RatingStars";
import type { ReviewItem } from "@/lib/reviewsApi";

export default function ReviewsList({
  items,
  page,
  pageSize,
  total,
  onPageChange,
}: {
  items: ReviewItem[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="space-y-3">
      {items.length === 0 && <div className="text-sm text-gray-600">No reviews yet. Be the first!</div>}
      {items.map((r) => (
        <div key={r.id} className="border rounded p-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">{r.username ?? `User #${r.userId}`}</div>
            <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
          </div>
          <div className="mt-1"><RatingStars value={r.rating} /></div>
          {r.text && <p className="mt-2 text-sm whitespace-pre-wrap">{r.text}</p>}
        </div>
      ))}
      {pages > 1 && (
        <div className="flex gap-2 justify-end">
          <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={page<=1} onClick={()=>onPageChange(page-1)}>
            Prev
          </button>
          <span className="text-sm self-center">Page {page} / {pages}</span>
          <button className="px-2 py-1 border rounded disabled:opacity-50" disabled={page>=pages} onClick={()=>onPageChange(page+1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
