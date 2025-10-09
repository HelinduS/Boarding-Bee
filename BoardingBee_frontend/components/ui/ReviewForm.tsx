"use client";
import React, { useState } from "react";
import RatingStars from "@/components/ui/RatingStars";
import { createOrUpdateReview } from "@/lib/reviewsApi";

export default function ReviewForm({
  listingId,
  token,
  isAuthenticated,
  onSaved,
}: {
  listingId: number;
  token?: string;
  isAuthenticated: boolean;
  onSaved?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = isAuthenticated && rating >= 1 && rating <= 5 && !loading;

  async function submit() {
    if (!canSubmit || !token) return;
    setLoading(true);
    try {
      await createOrUpdateReview(listingId, token, { rating, text: text.trim() || undefined });
      setText("");
      onSaved?.();
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) return <div className="text-sm text-gray-600">Please log in to leave a review.</div>;

  return (
    <div className="border rounded-lg p-3 space-y-3">
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
          className={`px-3 py-1 rounded text-white ${canSubmit ? "bg-blue-600" : "bg-gray-400 cursor-not-allowed"}`}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
