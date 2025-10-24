"use client";
import { useEffect, useState } from "react";
import { Phone, Mail, Home, Users } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/context/authContext";
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

// Move Avatar out of parent component
function Avatar({ url, name }: { readonly url?: string | null; readonly name: string }) {
  return (
    <span className="inline-flex items-center">
      {url ? (
        <img src={url} alt={name} className="w-6 h-6 rounded-full mr-2" />
      ) : (
        <span className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-2 text-xs font-bold">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      {name}
    </span>
  );
}
export function SecurityAlerts() {
  const { user } = useAuth();
  const [owners, setOwners] = useState<OwnerSummary[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [totals, setTotals] = useState<{ totalListings?: number; assignedListings?: number; unassignedListings?: number; orphanedListings?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"owners" | "users">("owners");

  useEffect(() => {
    let alive = true;
    apiGet<AdminUsersSummaryResponse>("/api/admin/users/summary", user?.token)
      .then(d => {
        if (!alive) return;
        // debug: show raw payload in browser console for troubleshooting
        try { console.debug("/api/admin/users/summary", d); } catch {}

        // defensive mapping: coerce counts to numbers and normalize fields
        const mappedOwners: OwnerSummary[] = (d.owners || []).map((o: any) => ({
          userId: Number(o.userId || o.id || 0),
          name: o.name || o.username || "",
          email: o.email || null,
          phone: o.phone || o.phoneNumber || null,
          profileImage: o.profileImage || o.profileImageUrl || null,
          totalListings: Number(o.totalListings ?? o.listingsCount ?? 0) || 0,
          totalReviews: Number(o.totalReviews ?? o.reviewCount ?? 0) || 0,
          role: o.role ?? null,
        }));

        const mappedUsers: UserSummary[] = (d.users || []).map((u: any) => ({
          userId: Number(u.userId || u.id || 0),
          name: u.name || u.username || "",
          email: u.email || null,
          phone: u.phone || u.phoneNumber || null,
          profileImage: u.profileImage || u.profileImageUrl || null,
          reviewCount: Number(u.reviewCount ?? u.totalReviews ?? 0) || 0,
          totalReviews: Number(u.totalReviews ?? u.reviewCount ?? 0) || 0,
          role: u.role ?? null,
        }));

        // if there are unassigned listings, insert a pseudo-owner entry at the top
        if ((d.unassignedListings ?? 0) > 0) {
          const pseudo = {
            userId: -1,
            name: `Unassigned listings`,
            email: null,
            phone: null,
            profileImage: null,
            totalListings: Number(d.unassignedListings ?? 0),
            totalReviews: 0,
            role: 'system',
          } as any;
          setOwners([pseudo as OwnerSummary, ...mappedOwners]);
        } else {
          setOwners(mappedOwners);
        }
        setUsers(mappedUsers);
        setTotals({
          totalListings: Number(d.totalListings ?? 0),
          assignedListings: Number(d.assignedListings ?? 0),
          unassignedListings: Number(d.unassignedListings ?? 0),
          orphanedListings: Number(d.orphanedListings ?? 0),
        });
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
  }, [user?.token]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading users…</div>;
  if (err) return <div className="text-sm text-red-600">Error: {err}</div>;

  function Avatar({ url, name }: { url?: string | null; name: string }) {
    if (url) return <img src={url} alt={name} className="w-10 h-10 rounded-full object-cover" />;
    return <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700">{name.charAt(0) || "U"}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-2 flex gap-2">
        <button
          onClick={() => setTab("owners")}
          className={`flex-1 py-2 rounded-lg ${tab === "owners" ? "bg-indigo-500 text-white shadow-md font-bold" : "text-muted-foreground"}`}
        >
            <div className="flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />
            <span>Owners ({owners.length})</span>
          </div>
        </button>
        <button
          onClick={() => setTab("users")}
          className={`flex-1 py-2 rounded-lg ${tab === "users" ? "bg-indigo-500 text-white shadow-md font-bold" : "text-muted-foreground"}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Users className="w-4 h-4" />
            <span>Users ({users.length})</span>
          </div>
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
                  <div className="text-2xl font-bold text-amber-600">{o.totalListings ?? 0}</div>
                  <div className="text-xs text-muted-foreground">{(o.totalReviews ?? 0)} reviews</div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Phone className="w-4 h-4" />{o.phone || "-"}</div>
                <div className="flex items-center gap-2"><Mail className="w-4 h-4" />{o.email || "-"}</div>
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
                  <div className="text-2xl font-bold text-amber-600">{(u.reviewCount ?? u.totalReviews) ?? 0}</div>
                  <div className="text-xs text-muted-foreground">reviews</div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Phone className="w-4 h-4" />{u.phone || "-"}</div>
                <div className="flex items-center gap-2"><Mail className="w-4 h-4" />{u.email || "-"}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
