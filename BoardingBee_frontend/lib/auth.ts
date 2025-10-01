// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false
  return !!localStorage.getItem("token")
}

// Get the authentication token
// Get the authentication token
export const getToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

// Set the authentication token
// Set the authentication token
export const setToken = (token: string): void => {
  if (typeof window === "undefined") return
  localStorage.setItem("token", token)
}

// Remove the authentication token (logout)
// Remove the authentication token (logout)
export const removeToken = (): void => {
  if (typeof window === "undefined") return
  localStorage.removeItem("token")
}

// Get authorization headers for API requests
// Get authorization headers for API requests
export const getAuthHeaders = (): HeadersInit => {
  const token = getToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

