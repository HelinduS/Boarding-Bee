"use client";

import React, { useMemo, useState, useEffect } from "react";
import ListingCard from "@/components/ui/ListingCard";
import RecentReviews from "@/components/ui/RecentReviews";
import ListingsLoadingSkeleton from "@/components/ListingsLoadingSkeleton";
import { useRouter } from "next/navigation";
import { fetchAllListings } from "@/lib/listingsApi";
import { resolveImageUrl } from "@/lib/imageUtils";

type Listing = {
  id: number;
  title: string;
  location: string;
  price: number;
  availability: "Available" | "Unavailable" | "Occupied";
  status: "Approved" | "Pending" | "Expired" | string;
  thumbnailUrl: string;
  rating: number | null;
  reviewCount: number;
  description?: string | null;
};

export default function Home() {
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingListings(true);
    setFetchError(null);

    fetchAllListings()
      .then((data: any) => {
        const apiListings = Array.isArray(data?.listings) ? data.listings : (Array.isArray(data) ? data : []);

        const mapped: Listing[] = apiListings.map((l: any) => {
          const availability =
            (typeof l.isAvailable === "boolean"
              ? l.isAvailable
              : String(l.availability || "").toLowerCase() === "available")
              ? "Available"
              : (String(l.availability || "").toLowerCase() === "occupied" ? "Occupied" : "Unavailable");

          const images: string[] = Array.isArray(l.images) ? l.images : [];

          // Always use the first listing image for thumbnail
          return {
            id: Number(l.id),
            title: l.title,
            location: l.location,
            price: Number(l.price),
            availability,
            status: String(l.status || ""),
            thumbnailUrl: resolveImageUrl(images.length > 0 ? images[0] : undefined, "/placeholder.jpg"),
            rating: typeof l.rating === "number" ? l.rating : null, // from backend DTO
            reviewCount: Number(l.reviewCount ?? 0),                 // from backend DTO
            description: l.description ?? null,
          };
        });

        setListings(mapped);
      })
      .catch((err) => setFetchError(err?.message || "Failed to fetch listings"))
      .finally(() => setLoadingListings(false));
  }, []);

  // ---------------- UI State ----------------
  const [location, setLocation] = useState("");
  const [debouncedLocation, setDebouncedLocation] = useState(location);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [reviewsOnly, setReviewsOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] =
    useState<"relevance" | "price_asc" | "price_desc" | "rating_desc">("relevance");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocation(location), 250);
    return () => clearTimeout(t);
  }, [location]);

  const toNumberOrNull = (v: string) => (v === "" ? null : Number(v));

  // --------------- Filtering + Sorting ---------------
  const filteredListings = useMemo(() => {
    const min = toNumberOrNull(minPrice);
    const max = toNumberOrNull(maxPrice);

    // Always show only Approved listings on Home
    let out = listings.filter((l) => String(l.status).toLowerCase() === "approved");

    out = out.filter((l) => {
      const matchesLocation =
        debouncedLocation.trim() === "" ||
        l.location.toLowerCase().includes(debouncedLocation.trim().toLowerCase()) ||
        l.title.toLowerCase().includes(debouncedLocation.trim().toLowerCase());

      const matchesMin = min === null || l.price >= min;
      const matchesMax = max === null || l.price <= max;
      const matchesAvail = !availableOnly || l.availability === "Available";

      const matchesReviewsOnly = !reviewsOnly || (l.reviewCount ?? 0) > 0;
      const matchesMinRating = minRating <= 0 || (l.rating ?? 0) >= minRating;

      return (
        matchesLocation &&
        matchesMin &&
        matchesMax &&
        matchesAvail &&
        matchesReviewsOnly &&
        matchesMinRating
      );
    });

    switch (sortBy) {
      case "price_asc":
        out = [...out].sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        out = [...out].sort((a, b) => b.price - a.price);
        break;
      case "rating_desc":
        out = [...out].sort(
          (a, b) => (b.rating ?? -Infinity) - (a.rating ?? -Infinity)
        );
        break;
      case "relevance":
      default:
        break;
    }

    return out;
  }, [debouncedLocation, minPrice, maxPrice, availableOnly, reviewsOnly, minRating, sortBy, listings]);

  const clearAll = () => {
    setLocation("");
    setMinPrice("");
    setMaxPrice("");
    setAvailableOnly(false);
    setReviewsOnly(false);
    setMinRating(0);
    setSortBy("relevance");
  };

  return (
  <div className="min-h-screen flex bg-gradient-to-br from-purple-200 to-blue-200 relative overflow-hidden overflow-y-auto scroll-py-0">
      <div className="pointer-events-none absolute inset-0 opacity-20 [background:radial-gradient(circle_at_1px_1px,_#ffffff_1px,_transparent_1px)] [background-size:16px_16px]" />
      <div className="absolute inset-0 backdrop-blur-xl bg-white/50" />

      {/* Card background effect */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 mt-8 w-[95vw] max-w-[1600px] xl:max-w-[1800px] 2xl:max-w-[2000px] h-[95%] rounded-3xl bg-white/60 shadow-2xl backdrop-blur-2xl border border-white/40 z-0" />

  <div className="relative z-10 flex w-full max-w-[1600px] xl:max-w-[1800px] 2xl:max-w-[2000px] mx-auto overflow-hidden rounded-3xl px-2 sm:px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-20 border border-white/40 shadow-2xl bg-white/20 backdrop-blur-xl">
  <div className="flex flex-col w-full p-2 sm:p-4 md:p-8 gap-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-blue-700 mb-2">
              Find Your Next Boarding
            </h1>
            <p className="text-lg text-gray-700">
              Browse the latest listings and filter by your needs
            </p>
          </div>
          {/* Hero Section */}
          <section className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600/90 to-blue-700/90 p-8 md:p-16 shadow-2xl border border-white/20">
            {/* Decorative background elements */}
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-yellow-400/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-yellow-300 text-sm font-medium mb-6 backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                  New boardings added today
                </div>

                <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 drop-shadow-sm">
                  <span className="block text-yellow-400">Boarding Bee 🐝</span>
                  <span className="block">Find Your <span className="text-yellow-300">Perfect Stay</span></span>
                </h1>

                <p className="text-lg md:text-xl text-blue-50 max-w-xl mb-6 leading-relaxed opacity-90">
                  Sri Lanka's trusted platform for students and professionals. <span className="font-semibold text-yellow-200">Verified listings</span>, <span className="font-semibold text-yellow-200">authentic reviews</span>, and <span className="font-semibold text-yellow-200">secure bookings</span> — all in one place.
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-2">
                  {/* Primary Action: Scroll to listings */}
                  <button 
                    onClick={() => document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-bold px-8 py-4 rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:scale-95"
                  >
                    Explore Listings
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>

                  {/* Secondary Action: Info */}
                  <button
                    onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold backdrop-blur-md border border-white/10 transition-all"
                  >
                    How it works
                  </button>

                  {/* Tertiary Action: Conversion for Hosts */}
                  <button
                    onClick={() => router.push('/create-listing')}
                    className="px-8 py-4 rounded-2xl bg-indigo-500/40 hover:bg-indigo-500/60 text-white font-semibold backdrop-blur-md border border-indigo-400/30 transition-all shadow-lg"
                  >
                    Post a Listing
                  </button>
                </div>

                <div className="flex items-center gap-3 justify-center lg:justify-start mt-2">
                  <span className="inline-flex items-center gap-1 text-green-200 text-sm font-semibold">
                    <span className="text-lg">✓</span> 100% Secure & Verified
                  </span>
                  <span className="inline-flex items-center gap-1 text-yellow-200 text-sm font-semibold">
                    <span className="text-lg">★</span> Trusted by thousands
                  </span>
                </div>
              </div>

              {/* Right Side: Visual Element (Hidden on mobile or smaller screens) */}
              <div className="hidden lg:flex flex-1 justify-end relative">
                <div className="relative w-72 h-72 md:w-80 md:h-80 bg-white/10 rounded-[2.5rem] border border-white/20 backdrop-blur-3xl rotate-3 flex items-center justify-center overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/20 to-transparent" />
                  {/* Animated Bee/House Illustration */}
                  <div className="text-8xl animate-bounce-slow">🐝</div>
                  {/* Floating "Trust" Badge */}
                  <div className="absolute bottom-6 -left-8 bg-white p-4 rounded-2xl shadow-2xl -rotate-6 animate-float">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">✓</div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Verified</p>
                        <p className="text-sm font-bold text-slate-800">100% Secure</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* Filter Bar */}
          <section className="sticky top-[88px] z-10 -mx-2 px-2">
            <div className="rounded-xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg p-3 md:p-5">
              <div className="flex flex-col gap-2">
                {/* Row 1: Search + Count */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <label className="group relative w-full md:max-w-xl">
                    <span className="sr-only">Search by location or title</span>
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2">
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden className="opacity-60">
                        <path d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search location or title…"
                      className="w-full rounded-lg border border-slate-200/70 bg-white/80 pl-8 pr-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-400 transition"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </label>

                  <div id="listings" className="flex items-center gap-2 self-start md:self-auto">
                    <span className="text-[11px] text-slate-600">Results</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-semibold shadow-sm">
                      {filteredListings.length}/{listings.length}
                    </span>
                  </div>
                </div>

                {/* Row 2: Price + toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  {/* Min */}
                  <label className="relative">
                    <span className="text-xs font-medium text-slate-600">Min price</span>
                    <div className="mt-1 flex items-center rounded-lg border border-slate-200/70 bg-white/80 shadow-sm focus-within:ring-2 focus-within:ring-blue-200/60 focus-within:border-blue-400 transition">
                      <span className="pl-2 pr-1 text-slate-500 text-xs">LKR</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="15000"
                        className="w-full bg-transparent py-1 pr-2 text-sm outline-none"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                      />
                    </div>
                  </label>

                  {/* Max */}
                  <label className="relative">
                    <span className="text-xs font-medium text-slate-600">Max price</span>
                    <div className="mt-1 flex items-center rounded-lg border border-slate-200/70 bg-white/80 shadow-sm focus-within:ring-2 focus-within:ring-blue-200/60 focus-within:border-blue-400 transition">
                      <span className="pl-2 pr-1 text-slate-500 text-xs">LKR</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="40000"
                        className="w-full bg-transparent py-1 pr-2 text-sm outline-none"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                      />
                    </div>
                  </label>

                  {/* Availability */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      aria-pressed={availableOnly}
                      onClick={() => setAvailableOnly(v => !v)}
                      className={[
                        "w-full h-8 rounded-lg border transition shadow-sm text-sm",
                        availableOnly
                          ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500"
                          : "bg-white/80 text-slate-700 border-slate-200/70 hover:bg-slate-50"
                      ].join(" ")}
                    >
                      {availableOnly ? "✓ Available only" : "Show: All / Available"}
                    </button>
                  </div>

                  {/* Reviews only */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      aria-pressed={reviewsOnly}
                      onClick={() => setReviewsOnly(v => !v)}
                      className={[
                        "w-full h-8 rounded-lg border transition shadow-sm text-sm",
                        reviewsOnly
                          ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-500"
                          : "bg-white/80 text-slate-700 border-slate-200/70 hover:bg-slate-50"
                      ].join(" ")}
                    >
                      {reviewsOnly ? "✓ Has reviews" : "Has reviews: any"}
                    </button>
                  </div>
                </div>

                {/* Row 3: Sort + Min rating + Clear */}
                <div className="flex flex-col-reverse gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="inline-flex overflow-hidden rounded-lg border border-slate-200/70 bg-white/80 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setSortBy("relevance")}
                      className={`px-2.5 py-1.5 text-xs transition ${sortBy==="relevance" ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}
                    >
                      Relevance
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortBy("price_asc")}
                      className={`px-2.5 py-1.5 text-xs transition border-l border-slate-200/70 ${sortBy==="price_asc" ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}
                      title="Low → High"
                    >
                      Price ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortBy("price_desc")}
                      className={`px-2.5 py-1.5 text-xs transition border-l border-slate-200/70 ${sortBy==="price_desc" ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}
                      title="High → Low"
                    >
                      Price ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortBy("rating_desc")}
                      className={`px-2.5 py-1.5 text-xs transition border-l border-slate-200/70 ${sortBy==="rating_desc" ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}
                      title="Highest first"
                    >
                      Rating
                    </button>
                  </div>

                  {/* Min rating select + Clear */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-600">
                      Min rating:
                      <select
                        className="ml-1 rounded border border-slate-200/70 bg-white/80 text-xs py-1 px-2"
                        value={minRating}
                        onChange={(e) => setMinRating(Number(e.target.value))}
                      >
                        <option value={0}>Any</option>
                        <option value={1}>1+</option>
                        <option value={2}>2+</option>
                        <option value={3}>3+</option>
                        <option value={4}>4+</option>
                      </select>
                    </label>

                    <button
                      onClick={clearAll}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200/70 bg-white/80 hover:bg-slate-100 transition shadow-sm"
                      title="Clear filters"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Listings grid */}
          {loadingListings ? (
            <ListingsLoadingSkeleton />
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center text-center gap-3 bg-white/60 backdrop-blur p-10 rounded-2xl border border-red-200">
              <div className="text-6xl">😢</div>
              <h3 className="text-xl font-semibold text-red-800">Failed to load listings</h3>
              <p className="text-gray-700 max-w-md">{fetchError}</p>
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-8 min-h-[300px]">
              {filteredListings.map((l) => (
                <ListingCard
                  key={l.id}
                  title={l.title}
                  location={l.location}
                  price={l.price}
                  availability={l.availability}
                  thumbnailUrl={l.thumbnailUrl}
                  rating={l.rating}
                  reviewCount={l.reviewCount}
                  description={l.description ?? undefined}
                  onClick={() => router.push(`/view-details/${l.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center gap-3 bg-white/60 backdrop-blur p-10 rounded-2xl border border-blue-100">
              <div className="text-6xl">🧐</div>
              <h3 className="text-xl font-semibold text-blue-800">No listings match your filters</h3>
              <p className="text-gray-700 max-w-md">
                Try widening your price range, removing filters, or searching a broader location.
              </p>
              <button
                onClick={clearAll}
                className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}