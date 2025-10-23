export const API_BASE = process.env.NEXT_PUBLIC_API_URL|| "";

/** Replace this with your real auth-token source if different */
export function getToken(): string | null {
  if (typeof window !== "undefined") {
    // historic variants: some code writes 'token' while older code expects 'access_token'
    return localStorage.getItem("access_token") || localStorage.getItem("token");
  }
  return null;
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(body || res.statusText || "Request failed");
    // attach status for callers that want to inspect it
    (err as any).status = res.status;
    throw err;
  }
  return res.json();
}

export async function apiPost<T = any>(path: string, body: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(text || res.statusText || "Request failed");
    (err as any).status = res.status;
    throw err;
  }
  return res.json();
}
