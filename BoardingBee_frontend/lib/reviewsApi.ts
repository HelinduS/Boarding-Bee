const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || ""}/api/listings`;

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
    // include method + full URL -> super helpful for 404s
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
  return fetchJson(
    `${API_BASE}/${listingId}/reviews?sort=${sort}&page=${page}&pageSize=${pageSize}`,
    { cache: "no-store" }
  );
}

export async function getRatingSummary(listingId: number): Promise<RatingSummary> {
  return fetchJson(`${API_BASE}/${listingId}/reviews/summary`, { cache: "no-store" });
}

export async function createOrUpdateReview(
  listingId: number,
  token: string | undefined,
  data: { rating: number; text?: string }
): Promise<ReviewItem> {
  return fetchJson(`${API_BASE}/${listingId}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
}
