const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const authApi = {
  async requestReset(email: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${API}/api/password/forgot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return { ok: res.ok };
  },
  async verifyCode(email: string, token: string): Promise<{ ok: boolean; token?: string }> {
    const res = await fetch(`${API}/api/password/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
    });
    const data = await res.json();
    // If valid, return ok and the token (for reset-password page)
    return { ok: !!data.valid, token: data.valid ? token : undefined };
  },
  async resetPassword(email: string, token: string, newPassword: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${API}/api/password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, newPassword, confirmPassword: newPassword }),
    });
    return { ok: res.ok };
  },
};