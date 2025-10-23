"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { OwnerSummary, UserSummary, AdminUsersSummaryResponse } from "@/types/admin";

type RawUser = {
  id: number;
  username: string;
  email: string;
  phoneNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  role?: string | null;
};

export function SecurityAlerts() {
  const [owners, setOwners] = useState<OwnerSummary[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"owners" | "users">("owners");

  useEffect(() => {
    let alive = true;
    apiGet<AdminUsersSummaryResponse>("/api/admin/users/summary")
      .then(d => {
        if (!alive) return;
        setOwners(d.owners || []);
        setUsers(d.users || []);
        setLoading(false);
      })
      .catch(e => {
        if (!alive) return;
        const status = (e as any)?.status;
        if (status === 401) setErr("Unauthorized — please sign in as an admin");
        else setErr((e as any)?.message || String(e));
        setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Loading users…</div>;
  if (err) return <div className="text-sm text-red-600">Error: {err}</div>;

  function Avatar({ url, name }: { url?: string | null; name: string }) {
    if (url) return <img src={url} alt={name} className="w-10 h-10 rounded-full object-cover" />;
    return <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700">{name.charAt(0) || "U"}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white p-2 flex gap-2">
        <button onClick={() => setTab("owners")} className={`flex-1 py-2 rounded ${tab === "owners" ? "bg-gray-100 font-semibold" : "text-muted-foreground"}`}>
          Owners ({owners.length}){owners.length ? <span className="ml-2 text-xs text-muted-foreground">of {owners.length}</span> : null}
        </button>
        <button onClick={() => setTab("users")} className={`flex-1 py-2 rounded ${tab === "users" ? "bg-gray-100 font-semibold" : "text-muted-foreground"}`}>
          Users ({users.length}){users.length ? <span className="ml-2 text-xs text-muted-foreground">of {owners.length + users.length}</span> : null}
        </button>
      </div>

      <div className="space-y-3">
        {tab === "owners" && owners.map(o => (
          <div key={o.userId} className="rounded-xl border p-4 flex items-start gap-4">
            <Avatar url={o.profileImage} name={o.name} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-lg">{o.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-amber-600">{o.totalReviews ?? 0}</div>
                  <div className="text-xs text-muted-foreground">of {o.totalListings} listings</div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M2 20v-2a6 6 0 016-6h8a6 6 0 016 6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>{o.phone || "-"}</div>
                <div className="flex items-center gap-2"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>{o.email || "-"}</div>
              </div>
            </div>
          </div>
        ))}

        {tab === "users" && users.map(u => (
          <div key={u.userId} className="rounded-xl border p-4 flex items-start gap-4">
            <Avatar url={u.profileImage} name={u.name} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-lg">{u.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-amber-600">{(u.reviewCount ?? u.totalReviews) ?? 0}</div>
                  <div className="text-xs text-muted-foreground">reviews</div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M2 20v-2a6 6 0 016-6h8a6 6 0 016 6v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>{u.phone || "-"}</div>
                <div className="flex items-center gap-2"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>{u.email || "-"}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
