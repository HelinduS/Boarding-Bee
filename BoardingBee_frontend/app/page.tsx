"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import ListingCard from "@/components/ui/ListingCard";

type Listing = {
  id: number;
  title: string;
  location: string;
  price: number;
  availability: "Available" | "Unavailable" | string;
  thumbnailUrl: string;
  rating: number;
  description: string;
};

export default function Home() {
  const router = useRouter();
  const { user, isOwner } = useAuth();
  // Dummy data (can be lifted to props later)
  const dummyListings: Listing[] = [
    {
      id: 1,
      title: "Sunny Studio in Colombo",
      location: "Colombo 07, Sri Lanka",
      price: 25000,
      availability: "Available",
      thumbnailUrl: "/images/login-background.jpg",
      rating: 4.7,
      description:
        "A bright, modern studio apartment in the heart of the city. Close to all amenities and public transport. Perfect for students or young professionals.",
    },
    {
      id: 2,
      title: "Cozy Room near University",
      location: "Kandy, Sri Lanka",
      price: 18000,
      availability: "Available",
      thumbnailUrl: "/images/mango.jpg",
      rating: 4.2,
      description:
        "Comfortable room in a shared house. Walking distance to university. Utilities included.",
    },
    {
      id: 3,
      title: "Luxury Apartment",
      location: "Galle Face, Colombo",
      price: 60000,
      availability: "Unavailable",
      thumbnailUrl: "/images/dcd8b9a7-3418-48ae-b4d4-0bd8b038ab47.png",
      rating: 5.0,
      description:
        "Spacious luxury apartment with sea view. 3 bedrooms, 2 bathrooms, fully furnished.",
    },
  ];

  // ---------------- UI State ----------------
  const [location, setLocation] = useState("");
  const [debouncedLocation, setDebouncedLocation] = useState(location);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"relevance" | "price_asc" | "price_desc" | "rating_desc">("relevance");

  // Debounce location input for smoother typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocation(location), 250);
    return () => clearTimeout(t);
  }, [location]);

  // Helpers
  const toNumberOrNull = (v: string) => (v === "" ? null : Number(v));
  const nf = useMemo(() => new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }), []);

  // --------------- Filtering + Sorting ---------------
  const filteredListings = useMemo(() => {
    const min = toNumberOrNull(minPrice);
    const max = toNumberOrNull(maxPrice);

    let out = dummyListings.filter((l) => {
      const matchesLocation =
        debouncedLocation.trim() === "" ||
        l.location.toLowerCase().includes(debouncedLocation.trim().toLowerCase()) ||
        l.title.toLowerCase().includes(debouncedLocation.trim().toLowerCase());

      const matchesMin = min === null || l.price >= min;
      const matchesMax = max === null || l.price <= max;
      const matchesAvail = !availableOnly || String(l.availability).toLowerCase() === "available";

      return matchesLocation && matchesMin && matchesMax && matchesAvail;
    });

    switch (sortBy) {
      case "price_asc":
        out = [...out].sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        out = [...out].sort((a, b) => b.price - a.price);
        break;
      case "rating_desc":
        out = [...out].sort((a, b) => b.rating - a.rating);
        break;
      case "relevance":
      default:
        // keep original order for now (you can plug in a scoring later)
        break;
    }

    return out;
  }, [debouncedLocation, minPrice, maxPrice, availableOnly, sortBy, dummyListings]);

  const totalCount = dummyListings.length;
  const resultCount = filteredListings.length;

  const clearAll = () => {
    setLocation("");
    setMinPrice("");
    setMaxPrice("");
    setAvailableOnly(false);
    setSortBy("relevance");
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-purple-200 to-blue-200 relative">
      {/* Subtle pattern overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-20 [background:radial-gradient(circle_at_1px_1px,_#ffffff_1px,_transparent_1px)] [background-size:16px_16px]" />
      {/* Glass sheet */}
      <div className="absolute inset-0 backdrop-blur-xl bg-white/50" />

      <div className="relative flex w-full max-w-7xl mx-auto overflow-hidden rounded-3xl m-4 border border-white/40 shadow-2xl bg-white/20 backdrop-blur-xl">
        <div className="flex flex-col w-full p-6 md:p-8 gap-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-blue-700 mb-2">
              Find Your Next Boarding
            </h1>
            <p className="text-gray-700">
              Browse the latest listings and filter by your needs
            </p>
          </div>

          {/* Filter Bar */}
          <section className="sticky top-[88px] z-10 -mx-2 px-2">
            <div className="rounded-xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg p-2 md:p-3">
              <div className="flex flex-col gap-2">
                {/* Row 1: Search + Count */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  {/* Search */}
                  <label className="group relative w-full md:max-w-xl">
                    <span className="sr-only">Search by location or title</span>
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2">
                      {/* magnifier */}
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

                  {/* Results pill */}
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <span className="text-[11px] text-slate-600">Results</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-semibold shadow-sm">
                      {filteredListings.length}/{dummyListings.length}
                    </span>
                  </div>
                </div>

                {/* Row 2: Price inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

                  {/* Availability toggle chip */}
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
                </div>

                {/* Row 3: Sort segmented + Clear */}
                <div className="flex flex-col-reverse gap-2 md:flex-row md:items-center md:justify-between">
                  {/* Segmented control */}
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
                      <span className="inline-flex items-center gap-1">
                        {/* price up icon */}
                        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden><path d="M7 20V4m0 0l-3 3m3-3l3 3M17 4v16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                        Price
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortBy("price_desc")}
                      className={`px-2.5 py-1.5 text-xs transition border-l border-slate-200/70 ${sortBy==="price_desc" ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}
                      title="High → Low"
                    >
                      <span className="inline-flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden><path d="M7 4v16m0 0l-3-3m3 3l3-3M17 4v16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                        Price
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortBy("rating_desc")}
                      className={`px-2.5 py-1.5 text-xs transition border-l border-slate-200/70 ${sortBy==="rating_desc" ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}
                      title="Highest first"
                    >
                      <span className="inline-flex items-center gap-1">
                        {/* star */}
                        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden><path d="M12 17.3l-5.2 3.1 1.4-5.9-4.4-3.8 5.9-.5L12 4l2.3 6.2 5.9.5-4.4 3.8 1.4 5.9z" fill="currentColor"/></svg>
                        Rating
                      </span>
                    </button>
                  </div>

                  {/* Clear button + active filters summary */}
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-slate-600">
                      {minPrice || maxPrice || availableOnly || location
                        ? <>Active:{" "}
                            {location && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 mr-1">“{location}”</span>}
                            {minPrice && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border-amber-200 mr-1">min {minPrice}</span>}
                            {maxPrice && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border-amber-200 mr-1">max {maxPrice}</span>}
                            {availableOnly && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">available</span>}
                          </>
                        : <span className="opacity-70">No active filters</span>}
                    </div>

                    <button
                      onClick={() => { setLocation(""); setMinPrice(""); setMaxPrice(""); setAvailableOnly(false); setSortBy("relevance"); }}
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
          {filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[300px]">
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  title={listing.title}
                  location={listing.location}
                  price={listing.price}
                  availability={listing.availability as "Available" | "Unavailable"}
                  thumbnailUrl={listing.thumbnailUrl}
                  rating={listing.rating}
                  description={listing.description}
                  onClick={() => alert(`Navigate to details for ${listing.title}`)}
                />
              ))}
            </div>
          ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center text-center gap-3 bg-white/60 backdrop-blur p-10 rounded-2xl border border-blue-100">
              <div className="text-6xl">🧐</div>
              <h3 className="text-xl font-semibold text-blue-800">No listings match your filters</h3>
              <p className="text-gray-700 max-w-md">
                Try widening your price range, removing the availability filter, or searching a broader location.
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