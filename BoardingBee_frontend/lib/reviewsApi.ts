// BoardingBee_frontend/lib/reviewsApi.ts

// Prefer env, but when UI runs on localhost use local API by default.
// Also trim trailing slashes to avoid `//api`.
const isBrowser = typeof window !== "undefined";
const isLocalUI =
  isBrowser &&
  (window.location.hostname === "localhost" ||
   window.location.hostname === "127.0.0.1");

const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL ||
  (isLocalUI ? "http://localhost:5000" : "")
).replace(/\/$/, "");

export const API_BASE = `${API_ROOT}/api/listings`;

if (isBrowser) {
  // Helpful during dev; remove if you prefer
  console.log("[reviewsApi] API_BASE =", API_BASE);
}

export type ReviewItem = {
  id: number;
  userId: number;
  username?: string | null;
  rating: number;
  text?: string | null;
  createdAt: string;
};

export type ReviewsPage = {
  items: ReviewItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type RatingSummary = {
  average: number;
  count: number;
  histogram: Record<number, number>;
};

// --- small helper to show real backend errors ---
async function fetchJson(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  const text = await res.text(); // read once

  if (!res.ok) {
    let msg = text;
    try {
      msg = (JSON.parse(text)?.message as string) || text;
    } catch {
      /* if not JSON, leave raw text */
    }
    const method = (init?.method || "GET").toUpperCase();
    throw new Error(`${method} ${res.url} -> ${res.status} ${res.statusText} — ${msg || "no error body"}`);
  }

  return text ? JSON.parse(text) : {};
}

export async function getReviews(
  listingId: number,
  page = 1,
  pageSize = 10,
  sort: "recent" | "top" = "recent"
): Promise<ReviewsPage> {
  const url = `${API_BASE}/${listingId}/reviews?sort=${sort}&page=${page}&pageSize=${pageSize}`;
  return fetchJson(url, { cache: "no-store" });
}

export async function getRatingSummary(listingId: number): Promise<RatingSummary> {
  const url = `${API_BASE}/${listingId}/reviews/summary`;
  return fetchJson(url, { cache: "no-store" });
}

export async function createOrUpdateReview(
  listingId: number,
  token: string | undefined,
  data: { rating: number; text?: string }
): Promise<ReviewItem> {
  const url = `${API_BASE}/${listingId}/reviews`;
  return fetchJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
}
