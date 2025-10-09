"use client";

import React, { useEffect, useState } from "react";
import RatingStars from "@/components/ui/RatingStars";
import { createOrUpdateReview, getMyReview } from "@/lib/reviewsApi";

type Prefill = { rating?: number; text?: string };

export default function ReviewForm({
  listingId,
  token,
  isAuthenticated,
  alreadyReviewed = false,   // optional hint from parent
  prefill,                   // optional initial values
  onSaved,
}: {
  listingId: number;
  token?: string;
  isAuthenticated: boolean;
  alreadyReviewed?: boolean;
  prefill?: Prefill;
  onSaved?: () => void;
}) {
  const [rating, setRating] = useState<number>(prefill?.rating ?? 0);
  const [text, setText] = useState<string>(prefill?.text ?? "");
  const [loading, setLoading] = useState(false);
  const [hasExisting, setHasExisting] = useState<boolean>(alreadyReviewed);

  // If parent sends new prefill later, keep in sync
  useEffect(() => {
    if (typeof prefill?.rating === "number") setRating(prefill.rating);
    if (typeof prefill?.text === "string") setText(prefill.text);
    if (prefill && typeof prefill.rating === "number") setHasExisting(true);
  }, [prefill?.rating, prefill?.text]);

  // If not prefilled, ask backend if I already reviewed this listing
  useEffect(() => {
    let cancelled = false;

    async function loadMyReview() {
      if (!isAuthenticated || !token) return;
      try {
        const me = await getMyReview(listingId, token); // 200 => { rating, text, ... } or null for 204
        if (!cancelled && me) {
          if (typeof me.rating === "number") setRating(me.rating);
          if (typeof me.text === "string") setText(me.text);
          setHasExisting(true);
        }
      } catch {
        // 204/404/network -> ignore (assume no previous review)
      }
    }

    // Only hit backend if we don't already have prefill or a hint
    if (!alreadyReviewed && !prefill) {
      loadMyReview();
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token, listingId, alreadyReviewed, prefill]);

  const canSubmit = isAuthenticated && rating >= 1 && rating <= 5 && !loading;

  async function submit() {
    if (!canSubmit || !token) return;
    setLoading(true);
    try {
      await createOrUpdateReview(listingId, token, {
        rating,
        text: text.trim() || undefined,
      });
      setHasExisting(true); // we just created/updated it
      onSaved?.();
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="text-sm text-gray-600">
        Please log in to leave a review.
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">
          {hasExisting ? "Update your review" : "Leave a review"}
        </span>
        {hasExisting && (
          <span className="text-xs text-gray-500">You’ve reviewed this listing</span>
        )}
      </div>

      <RatingStars value={rating} onChange={setRating} />

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your review (optional)"
        maxLength={1000}
        className="w-full border rounded p-2 min-h-[80px]"
      />

      <div className="flex justify-between text-xs text-gray-500">
        <span>{text.length}/1000</span>
        <button
          onClick={submit}
          disabled={!canSubmit}
          className={`px-3 py-1 rounded text-white ${
            canSubmit ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {hasExisting ? "Update review" : "Submit"}
        </button>
      </div>
    </div>
  );
}
