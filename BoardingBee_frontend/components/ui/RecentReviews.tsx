"use client"

import React, { useEffect, useState } from "react";
import { getReviews, type ReviewItem } from "@/lib/reviewsApi";
import RatingStars from "@/components/ui/RatingStars";

export default function RecentReviews({ listingIds }: { listingIds: number[] }) {
  const [items, setItems] = useState<Array<{ listingId: number; listingTitle?: string; review?: ReviewItem }>>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const out: Array<{ listingId: number; listingTitle?: string; review?: ReviewItem }> = [];
      for (const id of listingIds.slice(0, 6)) {
        try {
          const page = await getReviews(id, 1, 1, "recent");
          if (!alive) return;
          const r = page.items && page.items.length ? page.items[0] : undefined;
          out.push({ listingId: id, review: r });
        } catch (e) {
          out.push({ listingId: id, review: undefined });
        }
      }
      if (!alive) return;
      setItems(out.filter(x => !!x.review));
    })();
    return () => { alive = false; };
  }, [listingIds]);

  if (!items || items.length === 0) return <div className="text-sm text-muted-foreground">No recent reviews yet.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((it, idx) => (
        <div key={idx} className="border rounded-lg p-3 bg-white/80">
          <div className="flex items-center justify-between">
            <div className="font-medium">Listing #{it.listingId}</div>
            <div className="text-sm text-muted-foreground">{new Date(it.review!.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm">{it.review!.username ?? `User ${it.review!.userId}`}</div>
            <div className="flex items-center gap-2"><RatingStars value={it.review!.rating} /></div>
          </div>
          {it.review!.text && <p className="mt-2 text-sm text-gray-700">{it.review!.text}</p>}
        </div>
      ))}
    </div>
  );
}
