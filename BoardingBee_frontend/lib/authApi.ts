// lib/authApi.ts
const API = process.env.NEXT_PUBLIC_API_URL || "";
const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === "true" || !API; // fallback to mock if no API base

type OkResp = { ok: true };
type ErrResp = { ok: false; error?: string };
type ResetReqResp = OkResp | ErrResp & { code?: string };
type VerifyResp = (OkResp & { token?: string }) | ErrResp;
type ResetResp = OkResp | ErrResp;

function safeJson(res: Response) {
  return res
    .json()
    .catch(() => ({} as any)); // guard non-JSON bodies
}

async function handleRes(res: Response) {
  const data = await safeJson(res);
  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      `Request failed (${res.status})`;
    return { ok: false, error: msg, data } as const;
  }
  return { ok: true, data } as const;
}

// ---------------------- MOCK MODE ----------------------
const mockApi = {
  async requestReset(email: string): Promise<ResetReqResp> {
    await new Promise((r) => setTimeout(r, 500));
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.log(`[MOCK] Reset code for ${email}: ${code}`);
    }
    return { ok: true, code };
  },

  async verifyCode(email: string, code: string): Promise<VerifyResp> {
    await new Promise((r) => setTimeout(r, 400));
    if (code?.length === 4) {
      const token = `mock-${Date.now()}`;
      return { ok: true, token };
    }
    return { ok: false, error: "Invalid code" };
  },

  async resetPassword(
    email: string,
    token: string,
    newPassword: string
  ): Promise<ResetResp> {
    await new Promise((r) => setTimeout(r, 500));
    if (!token) return { ok: false, error: "Missing token" };
    if (!newPassword || newPassword.length < 8) {
      return { ok: false, error: "Password must be at least 8 characters" };
    }
    return { ok: true };
  },
};

// --------------------- REAL BACKEND ---------------------
const realApi = {
  async requestReset(email: string): Promise<ResetReqResp> {
    try {
      const res = await fetch(`${API}/api/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const { ok, data, error } = await handleRes(res);
      // Some backends may return a masked code only in non-prod; ignore if absent
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
        body: JSON.stringify({ email, code }), // use "code" as param name
      });
      const { ok, data, error } = await handleRes(res);
      if (!ok) return { ok: false, error };
      // Expect backend to return { valid: boolean, token?: string }
      const valid = Boolean(data?.valid);
      if (!valid) return { ok: false, error: "Invalid or expired code" };
      return { ok: true, token: data?.token }; // token may be returned or generated on reset
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
          confirmPassword: newPassword, // if backend requires confirm
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