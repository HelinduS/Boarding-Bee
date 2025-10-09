// lib/authApi.ts
const RAW_API = process.env.NEXT_PUBLIC_API_URL || "";
// Normalize: remove trailing slash to avoid `//api/...`
const API = RAW_API.replace(/\/+$/, "");
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true" || !API;

// ---- types (unchanged public surface) ----
type OkResp = { ok: true };
type ErrResp = { ok: false; error?: string };
type ResetReqResp = (OkResp & { code?: string }) | ErrResp;
type VerifyResp = (OkResp & { token?: string }) | ErrResp;
type ResetResp = OkResp | ErrResp;

// Safe JSON helper so non-JSON bodies don’t crash
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {} as any;
  }
}

async function handleRes(res: Response) {
  const data = await safeJson(res);
  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      `${res.status} ${res.statusText}` ||
      "Request failed";
    return { ok: false as const, error: msg, data };
  }
  return { ok: true as const, data };
}

// ---------------------- MOCK MODE ----------------------
const mockApi = {
  async requestReset(email: string): Promise<ResetReqResp> {
    await new Promise((r) => setTimeout(r, 400));
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.log(`[MOCK] Reset code for ${email}: ${code}`);
    }
    return { ok: true, code };
  },

  async verifyCode(_email: string, code: string): Promise<VerifyResp> {
    await new Promise((r) => setTimeout(r, 300));
    if (code?.length === 4) {
      return { ok: true, token: `mock-${Date.now()}` };
    }
    return { ok: false, error: "Invalid code" };
  },

  async resetPassword(
    _email: string,
    token: string,
    newPassword: string
  ): Promise<ResetResp> {
    await new Promise((r) => setTimeout(r, 400));
    if (!token) return { ok: false, error: "Missing token" };
    if (!newPassword || newPassword.length < 8) {
      return { ok: false, error: "Password must be at least 8 characters" };
    }
    return { ok: true };
  },
};

// --------------------- REAL BACKEND ---------------------
// Endpoints expected by your backend:
//   POST ${API}/api/password/forgot  { email }
//   POST ${API}/api/password/verify  { email, token }
//   POST ${API}/api/password/reset   { email, token, newPassword, confirmPassword }
const realApi = {
  async requestReset(email: string): Promise<ResetReqResp> {
    try {
      const res = await fetch(`${API}/api/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const { ok, data, error } = await handleRes(res);
      // Some environments return a demo code; if absent, just return ok
      return ok ? { ok: true, code: data?.code } : { ok: false, error };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Network error" };
    }
  },

  async verifyCode(email: string, code: string): Promise<VerifyResp> {
    try {
      const res = await fetch(`${API}/api/password/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: code }),
      });
      const { ok, data, error } = await handleRes(res);
      if (!ok) return { ok: false, error };
      // Expecting { valid: boolean, token?: string }
      if (!data?.valid) return { ok: false, error: "Invalid or expired code" };
      return { ok: true, token: data?.token };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Network error" };
    }
  },

  async resetPassword(
    email: string,
    token: string,
    newPassword: string
  ): Promise<ResetResp> {
    try {
      const res = await fetch(`${API}/api/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          newPassword,
          confirmPassword: newPassword, // keep if backend expects confirm
        }),
      });
      const { ok, error } = await handleRes(res);
      return ok ? { ok: true } : { ok: false, error };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Network error" };
    }
  },
};

// ---------------------- EXPORT ----------------------
export const authApi = USE_MOCK ? mockApi : realApi;
