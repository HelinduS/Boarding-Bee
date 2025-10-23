import { jwtDecode } from "jwt-decode";

export interface UserData {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  // add more fields as needed
}

export async function fetchUserDataById(userId: number, token?: string): Promise<UserData> {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const res = await fetch(`${API}/api/Users/${userId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error("Failed to fetch user data");
  return await res.json();
}

export async function fetchCurrentUserData(): Promise<UserData> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No auth token found");
  const decoded: any = jwtDecode(token);
  const userId = decoded.sub;
  return fetchUserDataById(Number(userId), token);
}
