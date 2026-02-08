

import { fetchListing } from "@/lib/listingsApi";
import ListingDetailsClient from "@/components/ui/ListingDetailsClient";
import { cookies } from "next/headers";


interface PageParams {
  id: string | string[];
}

export default async function ListingDetailsPage({ params }: { params: Promise<PageParams> }) {
  // SSR: fetch listing data from .NET backend API
  const resolvedParams = await params;
  const listingId = Array.isArray(resolvedParams.id) ? Number(resolvedParams.id[0]) : Number(resolvedParams.id);
  if (!listingId || Number.isNaN(listingId)) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-red-600">Invalid listing ID.</div>;
  }

  // Optionally get user token from cookies (for auth)
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  let listing = null;
  let error = null;
  try {
    listing = await fetchListing(listingId, token);
  } catch (err: any) {
    error = typeof err?.message === "string" ? err.message : "Failed to load listing.";
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-red-600">{error}</div>
    );
  }
  if (!listing) {
    return null;
  }

  // Pass listing and user info to client component
  return <ListingDetailsClient listing={listing} user={{ token }} />;
}
