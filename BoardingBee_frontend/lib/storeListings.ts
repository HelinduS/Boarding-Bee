import { jwtDecode } from "jwt-decode";
import type { Listing } from "@/types/listing.d";

export async function fetchListingsByOwner(ownerId: number, token: string): Promise<Listing[]> {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const res = await fetch(`${API}/api/listings/owner/${ownerId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch listings");
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.listings)) return data.listings;
  return [];
}

export async function fetchCurrentOwnerListings(): Promise<Listing[]> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No auth token found");
  const decoded: any = jwtDecode(token);
  const ownerId = decoded.sub;
  return fetchListingsByOwner(Number(ownerId), token);
}
