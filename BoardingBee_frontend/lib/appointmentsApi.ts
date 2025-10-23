// Real API for appointment creation
export async function createAppointment({ listingId, date, userEmail, token }: { listingId: number, date: Date, userEmail: string, token?: string }) {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  // Optionally get userId from token if needed by backend
  let userId: number | undefined = undefined;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload.sub ? Number(payload.sub) : undefined;
    } catch {}
  }
  const payload = {
    listingId,
    date: date.toISOString(),
    userEmail,
    userId,
    status: "pending"
  };
  const res = await fetch(`${API}/api/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create appointment");
  return await res.json();
}
