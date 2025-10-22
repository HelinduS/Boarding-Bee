import React from "react";

export default function ListingsLoadingSkeleton() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .shimmer {
          position: relative;
          overflow: hidden;
        }
        .shimmer::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(220,220,220,0.3) 50%, rgba(255,255,255,0) 100%);
          animation: shimmer 1.5s infinite;
          background-size: 400px 100%;
        }
      `}</style>
      <div className="w-full max-w-[1600px] xl:max-w-[1800px] 2xl:max-w-[2000px] mx-auto px-2 sm:px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/40 shadow-xl bg-white/60 backdrop-blur-xl p-6 flex flex-col gap-4 animate-pulse shimmer">
            <div className="h-40 w-full rounded-xl bg-gray-100 shimmer" />
            <div className="h-6 w-2/3 rounded bg-gray-200 shimmer" />
            <div className="h-4 w-1/2 rounded bg-gray-100 shimmer" />
            <div className="h-4 w-1/3 rounded bg-gray-100 shimmer" />
            <div className="h-5 w-1/4 rounded bg-gray-100 shimmer" />
          </div>
        ))}
      </div>
    </>
  );
}