"use client";
import React, { useEffect, useState } from "react";
import { getRatingSummary, getReviews, type ReviewsPage, type RatingSummary } from "@/lib/reviewsApi";
import RatingSummaryCard from "@/components/ui/RatingSummaryCard";
import ReviewForm from "@/components/ui/ReviewForm";
import ReviewsList from "@/components/ui/ReviewsList";

export default function ReviewsSection({
  listingId,
  token,
  isAuthenticated,
}: {
  listingId: number;
  token?: string;
  isAuthenticated: boolean;
}) {
  const [summary, setSummary] = useState<RatingSummary>({ average: 0, count: 0, histogram: {1:0,2:0,3:0,4:0,5:0} });
  const [list, setList] = useState<ReviewsPage>({ items: [], total: 0, page: 1, pageSize: 10 });

  async function load(p = 1) {
    const [s, r] = await Promise.all([getRatingSummary(listingId), getReviews(listingId, p, 10, "recent")]);
    setSummary(s); setList(r);
  }

  useEffect(() => { load(1); }, [listingId]);

  return (
    <div className="space-y-4">
      <RatingSummaryCard data={summary} />
      <ReviewForm listingId={listingId} token={token} isAuthenticated={isAuthenticated} onSaved={() => load(list.page)} />
      <ReviewsList items={list.items} page={list.page} pageSize={list.pageSize} total={list.total} onPageChange={(p) => load(p)} />
    </div>
  );
}
