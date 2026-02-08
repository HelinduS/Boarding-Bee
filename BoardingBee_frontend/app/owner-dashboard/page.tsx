"use client"

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Home, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  Building2, 
  Calendar as CalendarIcon, 
  Mail, 
  Search,
  Filter
} from "lucide-react"
import { ListingsTable } from "@/components/listings-table"
import { EmptyState } from "@/components/empty-state"
import { fetchCurrentUserData } from "@/lib/storeUserData"
import { fetchCurrentOwnerListings } from "@/lib/storeListings"
import { resolveImageUrl } from "@/lib/imageUtils"
import { fetchOwnerAppointments, confirmAppointment, rejectAppointment } from "@/lib/appointmentsOwnerApi"
import { toast } from "@/components/ui/use-toast"
import type { Listing } from "@/types/listing.d";

type Appointment = {
  id: number;
  listingId: number;
  listingTitle: string;
  userEmail: string;
  date: Date;
  status: string;
};

function OwnerDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Dialog States
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; listingId: number | null }>({ open: false, listingId: null })
  const [renewDialog, setRenewDialog] = useState<{ open: boolean; listingId: number | null }>({ open: false, listingId: null })
  const [appointmentDialog, setAppointmentDialog] = useState<{ open: boolean; appointmentId: number | null; action: 'confirm' | 'reject' | null }>({ open: false, appointmentId: null, action: null });
  
  // Data States
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentActionLoading, setAppointmentActionLoading] = useState(false);
  
  // UI States
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("listings")
  const itemsPerPage = 10

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : undefined;
        
        // 1. Fetch User
        const userData = await fetchCurrentUserData();
        const currentUser = { ...userData, token };
        setUser(currentUser);

        // 2. Fetch Listings
        const ownerListings: any = await fetchCurrentOwnerListings();
        let listingsArray: Listing[] = [];
        if (Array.isArray(ownerListings)) {
          listingsArray = ownerListings;
        } else if (ownerListings && Array.isArray(ownerListings.listings)) {
          listingsArray = ownerListings.listings;
        }
        setListings(listingsArray);

        // 3. Fetch Appointments (if user exists)
        if (currentUser.token) {
            setAppointmentsLoading(true);
            try {
                const appData = await fetchOwnerAppointments(currentUser.token);
                setAppointments(appData);
            } catch (e) {
                console.error("Failed to fetch appointments", e);
            } finally {
                setAppointmentsLoading(false);
            }
        }

      } catch (err: any) {
        setError(err?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Appointment Actions
  const handleAppointmentAction = async () => {
    if (!appointmentDialog.appointmentId || !appointmentDialog.action) return;
    
    setAppointmentActionLoading(true);
    try {
      if (appointmentDialog.action === 'confirm') {
        await confirmAppointment(appointmentDialog.appointmentId, user?.token);
        setAppointments((prev) => prev.map((a) => a.id === appointmentDialog.appointmentId ? { ...a, status: "confirmed" } : a));
        toast({ title: "Confirmed", description: "Appointment confirmed successfully." });
      } else {
        await rejectAppointment(appointmentDialog.appointmentId, user?.token);
        setAppointments((prev) => prev.map((a) => a.id === appointmentDialog.appointmentId ? { ...a, status: "rejected" } : a));
        toast({ title: "Rejected", description: "Appointment request rejected." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Action failed", variant: "destructive" });
    } finally {
      setAppointmentActionLoading(false);
      setAppointmentDialog({ open: false, appointmentId: null, action: null });
    }
  };

  // Stats Calculation
  const stats = useMemo(() => {
    const safeListings = Array.isArray(listings) ? listings : [];
    const safeAppointments = Array.isArray(appointments) ? appointments : [];
    return {
      total: safeListings.length,
      approved: safeListings.filter((l) => (l.status || '').toLowerCase() === "approved").length,
      pending: safeListings.filter((l) => (l.status || '').toLowerCase() === "pending").length,
      expired: safeListings.filter((l) => (l.status || '').toLowerCase() === "expired").length,
      rejected: safeListings.filter((l) => (l.status || '').toLowerCase() === "rejected").length,
      pendingAppointments: safeAppointments.filter((a) => (a.status || '').toLowerCase() === "pending").length,
      confirmedAppointments: safeAppointments.filter((a) => (a.status || '').toLowerCase() === "confirmed").length,
    };
  }, [listings, appointments]);

  // Filtering & Pagination
  const filteredListings = useMemo(() => {
    return listings.filter(l => 
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [listings, searchTerm]);

  const { totalPages, paginatedListings } = useMemo(() => {
    return {
      totalPages: Math.ceil(filteredListings.length / itemsPerPage),
      paginatedListings: filteredListings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    };
  }, [filteredListings, currentPage]);

  // Listing Actions
  const handleDelete = async (listingId: number) => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/api/listings/${listingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      toast({ title: "Deleted", description: "Listing has been removed." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeleteDialog({ open: false, listingId: null });
    }
  };

  const handleRenew = async (listingId: number) => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/api/listings/${listingId}/renew`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) throw new Error("Failed to renew");
      toast({ title: "Success", description: "Listing renewed successfully." });
      setRenewDialog({ open: false, listingId: null });
      // Ideally refetch listings here to update status in UI
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* --- Header Section --- */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                <Avatar className="h-24 w-24 border-4 border-indigo-50 shadow-lg">
                  <AvatarImage src={resolveImageUrl(user?.profileImage, "/placeholder.jpg")} alt={user?.username} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-2xl font-bold">
                    {user?.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <h1 className="text-3xl font-bold text-slate-900">
                            Welcome back, {user?.firstName || user?.username}!
                        </h1>
                        <Badge variant="outline" className="w-fit bg-indigo-50 text-indigo-700 border-indigo-200">
                            Owner Account
                        </Badge>
                    </div>
                    <p className="text-slate-500 flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Manage your properties and appointments
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => router.push("/user-profile")}>
                        Edit Profile
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => router.push("/create-listing")}>
                        <Plus className="h-4 w-4 mr-2" /> Post New Listing
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
                <StatCard label="Total Listings" value={stats.total} />
                <StatCard label="Live" value={stats.approved} color="text-green-600" />
                <StatCard label="Pending" value={stats.pending} color="text-amber-600" />
                <StatCard label="Expired" value={stats.expired} color="text-red-600" />
                <StatCard label="Requests" value={stats.pendingAppointments} color="text-indigo-600" highlight={stats.pendingAppointments > 0} />
                <StatCard label="Confirmed" value={stats.confirmedAppointments} color="text-blue-600" />
            </div>
        </div>
      </div>

      {/* --- Main Content Tabs --- */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="listings" value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            <div className="flex items-center justify-between">
                <TabsList
                  className="bg-white border shadow-sm p-1 flex gap-2 rounded-xl overflow-hidden animate-fade-in"
                  aria-label="Owner dashboard tabs"
                >
                  <TabsTrigger
                    value="listings"
                    className={`gap-2 px-6 py-2 text-sm font-semibold transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 hover:bg-indigo-50 hover:text-indigo-700`}
                    aria-label="My Listings"
                  >
                    <Home className="h-5 w-5" />
                    <span>Listings</span>
                    <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 font-bold">{stats.total}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="appointments"
                    className={`gap-2 px-6 py-2 text-sm font-semibold transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 hover:bg-indigo-50 hover:text-indigo-700 relative`}
                    aria-label="Appointments"
                  >
                    <CalendarIcon className="h-5 w-5" />
                    <span>Appointments</span>
                    {stats.pendingAppointments > 0 && (
                      <span className="absolute top-1 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                        {stats.pendingAppointments}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
            </div>

            {/* LISTINGS TAB */}
            <TabsContent value="listings" className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div>
                                <CardTitle>Property Listings</CardTitle>
                                <CardDescription>Manage availability, edits, and renewals.</CardDescription>
                            </div>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Search by title or location..." 
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {listings.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <>
                                <ListingsTable
                                    listings={paginatedListings}
                                    onEditAction={(id) => router.push(`/edit-details/${id}`)}
                                    onDeleteAction={(id) => setDeleteDialog({ open: true, listingId: id })}
                                    onViewAction={(id) => router.push(`/view-details/${id}`)}
                                    onRenewAction={(id) => setRenewDialog({ open: true, listingId: id })}
                                />
                                
                                {filteredListings.length === 0 && (
                                    <div className="text-center py-12 text-slate-500">
                                        No listings match your search.
                                    </div>
                                )}

                                {totalPages > 1 && (
                                    <div className="flex items-center justify-end gap-2 mt-4">
                                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
                                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* APPOINTMENTS TAB */}
            <TabsContent value="appointments">
                <Card>
                    <CardHeader>
                        <CardTitle>Appointment Requests</CardTitle>
                        <CardDescription>Manage viewings requested by potential boarders.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {appointmentsLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                        ) : appointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                <CalendarIcon className="h-12 w-12 mb-2 opacity-20" />
                                <p>No appointment requests yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {appointments.map((appt) => (
                                    <div key={appt.id} className="group border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all hover:border-indigo-200">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="space-y-1">
                                                <h3 className="font-semibold text-slate-900 line-clamp-1" title={appt.listingTitle}>
                                                    {appt.listingTitle}
                                                </h3>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    {new Date(appt.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <StatusBadge status={appt.status} />
                                        </div>
                                        
                                        <div className="bg-slate-50 rounded-lg p-3 mb-4 text-sm">
                                            <div className="flex items-center gap-2 text-slate-700 mb-1">
                                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="truncate">{appt.userEmail}</span>
                                            </div>
                                        </div>

                                        {appt.status.toLowerCase() === "pending" && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    className="w-full text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                                    onClick={() => setAppointmentDialog({ open: true, appointmentId: appt.id, action: 'confirm' })}
                                                >
                                                    Confirm
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() => setAppointmentDialog({ open: true, appointmentId: appt.id, action: 'reject' })}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                        {appt.status.toLowerCase() !== "pending" && (
                                            <div className="text-center text-xs text-slate-400 italic py-2">
                                                No actions available
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>

      {/* --- Dialogs --- */}
      
      {/* Appointment Action Dialog */}
      <AlertDialog open={appointmentDialog.open} onOpenChange={(open) => setAppointmentDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
                {appointmentDialog.action === 'confirm' ? 'Confirm Appointment' : 'Reject Request'}
            </AlertDialogTitle>
            <AlertDialogDescription>
                {appointmentDialog.action === 'confirm' 
                    ? "This will notify the user that their viewing is confirmed." 
                    : "Are you sure? This will notify the user that the request was declined."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={appointmentActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleAppointmentAction} 
                disabled={appointmentActionLoading}
                className={appointmentDialog.action === 'confirm' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
                {appointmentActionLoading ? "Processing..." : (appointmentDialog.action === 'confirm' ? "Confirm" : "Reject")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Listing Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your listing and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={() => deleteDialog.listingId && handleDelete(deleteDialog.listingId)}
                className="bg-red-600 hover:bg-red-700"
            >
                Delete Listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Renew Listing Dialog */}
      <AlertDialog open={renewDialog.open} onOpenChange={(open) => setRenewDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renew Listing</AlertDialogTitle>
            <AlertDialogDescription>
              This listing will be extended for another 6 months and moved to "Approved" status if it was expired.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => renewDialog.listingId && handleRenew(renewDialog.listingId)}>
                Renew
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// --- Sub-components for cleaner code ---

function StatCard({ label, value, color = "text-slate-900", highlight = false }: { label: string, value: number, color?: string, highlight?: boolean }) {
    return (
        <div className={`flex flex-col items-center justify-center p-4 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${highlight ? 'ring-2 ring-indigo-200 border-indigo-300' : 'border-slate-100'}`}>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
            <span className={`text-2xl font-bold mt-1 ${color}`}>{value}</span>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase();
    let variant = "outline";
    let className = "text-slate-600 border-slate-200";

    if (s === "confirmed" || s === "approved") {
        className = "bg-green-50 text-green-700 border-green-200 hover:bg-green-100";
    } else if (s === "pending") {
        className = "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
    } else if (s === "rejected" || s === "expired") {
        className = "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
    }

    return (
        <Badge variant="outline" className={`capitalize ${className}`}>
            {status}
        </Badge>
    )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  )
}

export default OwnerDashboardPage;