// components/ui/progress.tsx
"use client";

import * as React from "react";

type ProgressProps = {
  value?: number;            // 0–100
  className?: string;
  label?: string;            // optional accessible label
};

export function Progress({ value = 0, className = "", label }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-label={label ?? "Progress"}
      className={`w-full h-2 rounded-full bg-gray-200 overflow-hidden ${className}`}
    >
      <div
        className="h-full rounded-full bg-indigo-600 transition-[width] duration-300 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}