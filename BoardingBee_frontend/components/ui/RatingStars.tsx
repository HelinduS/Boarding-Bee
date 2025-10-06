"use client";
import React from "react";

export default function RatingStars({
  value,
  onChange,
  size = "text-2xl",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: string;
}) {
  return (
    <div aria-label="rating" role="radiogroup" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          onClick={() => onChange?.(n)}
          className={`${size} ${n <= value ? "text-yellow-500" : "text-gray-400"}`}
          title={`${n} star${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
