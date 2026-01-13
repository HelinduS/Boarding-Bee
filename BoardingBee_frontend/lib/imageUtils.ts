// Utility to resolve image URLs
// Converts relative API paths to full URLs

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Resolves an image URL - if it's a relative path starting with /api, 
 * prepends the API base URL. Otherwise returns as-is.
 */
export function resolveImageUrl(url: string | null | undefined, fallback: string = "/placeholder.jpg"): string {
  if (!url) return fallback;
  
  // If it's a relative API path, prepend the API base URL
  if (url.startsWith("/api/")) {
    return `${API_URL}${url}`;
  }
  
  // If it's already a full URL or other path, return as-is
  return url;
}

/**
 * Resolves an array of image URLs
 */
export function resolveImageUrls(urls: string[] | null | undefined, fallback: string = "/placeholder.jpg"): string[] {
  if (!urls || urls.length === 0) return [fallback];
  return urls.map(url => resolveImageUrl(url, fallback));
}
