// client-side mock API for the flow; replace with real endpoints later
export const authApi = {
  async requestReset(email: string): Promise<{ ok: boolean; code?: string }> {
    await new Promise((r) => setTimeout(r, 800));
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    if (typeof window !== "undefined") console.log(`Reset code for ${email}: ${code}`);
    return { ok: true, code };
  },
  async verifyCode(email: string, code: string): Promise<{ ok: boolean; token?: string }> {
    await new Promise((r) => setTimeout(r, 600));
    // accept any code for mock
    if (code?.length === 4) {
      const token = `mock-${Date.now()}`;
      return { ok: true, token };
    }
    return { ok: false };
  },
  async resetPassword(email: string, token: string, newPassword: string): Promise<{ ok: boolean }> {
    await new Promise((r) => setTimeout(r, 800));
    return { ok: Boolean(token && newPassword?.length >= 8) };
  },
};