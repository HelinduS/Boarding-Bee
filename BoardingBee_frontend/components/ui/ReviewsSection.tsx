"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  getRatingSummary,
  getReviews,
  type ReviewsPage,
  type RatingSummary,
} from "@/lib/reviewsApi";
import RatingSummaryCard from "@/components/ui/RatingSummaryCard";
import ReviewForm from "@/components/ui/ReviewForm";
import ReviewsList from "@/components/ui/ReviewsList";

// Tiny helper to read userId from JWT without any library
function decodeJwtUserId(token?: string): number | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    // map common claims used by backend
    const raw =
      json?.nameid ??
      json?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ??
      json?.id ??
      json?.userId ??
      json?.sub;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export default function ReviewsSection({
  listingId,
  token,
  isAuthenticated,
}: {
  listingId: number;
  token?: string;
  isAuthenticated: boolean;
}) {
  const [summary, setSummary] = useState<RatingSummary>({
    average: 0,
    count: 0,
    histogram: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });

  const [list, setList] = useState<ReviewsPage>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
  });

  const userId = useMemo(() => decodeJwtUserId(token), [token]);

  async function load(p = 1) {
    const [s, r] = await Promise.all([
      getRatingSummary(listingId),
      getReviews(listingId, p, 10, "recent"),
    ]);
    setSummary(s);
    setList(r);
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  // If logged-in user already reviewed this listing, find that review
  const myReview = useMemo(
    () => (userId ? list.items.find((it) => it.userId === userId) : undefined),
    [list.items, userId]
  );

  return (
    <div className="space-y-4">
      <RatingSummaryCard data={summary} />

      <ReviewForm
        listingId={listingId}
        token={token}
        isAuthenticated={isAuthenticated}
        alreadyReviewed={!!myReview}
        prefill={
          myReview ? { rating: myReview.rating, text: myReview.text || "" } : undefined
        }
        onSaved={() => load(list.page)}
      />

      <ReviewsList
        items={list.items}
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        onPageChange={(p) => load(p)}
      />
    </div>
  );
}
