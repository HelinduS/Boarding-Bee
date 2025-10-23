// Real API for owner appointment management
// Fetch appointments for all listings owned by the user (by owner email)
export async function fetchOwnerAppointments(token?: string) {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  // Get owner email from token
  let ownerEmail = "";
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      ownerEmail = payload.email || payload.Email || payload.sub || "";
    } catch {
      ownerEmail = "";
    }
  }
  if (!ownerEmail) throw new Error("Owner email not found in token");
  const res = await fetch(`${API}/api/appointments/owner/${encodeURIComponent(ownerEmail)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error("Failed to fetch appointments");
  const data = await res.json();
  // Ensure date is a Date object
  return Array.isArray(data)
    ? data.map((a) => ({ ...a, date: new Date(a.date) }))
    : [];
}

// Confirm an appointment by id
export async function confirmAppointment(appointmentId: number, token?: string) {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const res = await fetch(`${API}/api/appointments/${appointmentId}/confirm`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error("Failed to confirm appointment");
  return await res.json();
}

// Reject an appointment by id
export async function rejectAppointment(appointmentId: number, token?: string) {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const res = await fetch(`${API}/api/appointments/${appointmentId}/reject`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error("Failed to reject appointment");
  return await res.json();
}
