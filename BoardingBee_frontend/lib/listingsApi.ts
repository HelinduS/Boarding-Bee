// Fetch listings by owner
export async function fetchListingsByOwner(ownerId: number, token?: string): Promise<Listing[]> {
  const res = await fetch(`${API_BASE}/owner/${ownerId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch listings for owner");
  const data = await res.json();
  // Support both { total, listings } and array response
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.listings)) return data.listings;
  return [];
}
import { Listing } from "@/types/listing";

// API base URL (from .env)
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || ""}/api/listings`;

// Fetch a single listing by ID
export async function fetchListing(id: number, token?: string): Promise<Listing> {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch listing");
  return res.json();
}

// Fetch all listings
export async function fetchListings(token?: string): Promise<Listing[]> {
  const res = await fetch(API_BASE, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch listings");
  return res.json();
}

// Create a new listing
export async function createListing(formData: FormData, token: string) {
  const res = await fetch(API_BASE, {
    method: "POST",
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// Update a listing (handles FormData for file upload)
export async function updateListing(id: number, data: any, token: string) {
  // If data is FormData (for file upload), send as multipart/form-data
  if (typeof FormData !== "undefined" && data instanceof FormData) {
  const res = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      body: data,
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw await res.json();
    return res.json();
  } else {
    // Otherwise, send as JSON
  const res = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  }
}

export async function deleteListing(id: number, token: string) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    // Try to parse error, fallback to status text
    let error;
    try {
      error = await res.json();
    } catch {
      error = res.statusText;
    }
    throw error;
  }
  // If 204 No Content, don't try to parse JSON
  if (res.status === 204) return;
  // If there is content, parse it
  const text = await res.text();
  return text ? JSON.parse(text) : undefined;
}

export async function renewListing(id: number, token: string) {
  const res = await fetch(`${API_BASE}/${id}/renew`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await res.json();
  return res.json();
}
