"use client"
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Home, Plus, ChevronLeft, ChevronRight, AlertCircle, Building2 } from "lucide-react"
import { ListingsTable } from "@/components/listings-table"
import { EmptyState } from "@/components/empty-state"
import { fetchCurrentUserData } from "@/lib/storeUserData"
import { fetchCurrentOwnerListings } from "@/lib/storeListings"
import type { Listing } from "@/types/listing.d"


function OwnerDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; listingId: number | null }>({
    open: false,
    listingId: null,
  })
  const [renewDialog, setRenewDialog] = useState<{ open: boolean; listingId: number | null }>({
    open: false,
    listingId: null,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch user and listings for owner
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const userData = await fetchCurrentUserData();
        setUser(userData);
        const ownerListings: any = await fetchCurrentOwnerListings();
        let listingsArray: Listing[] = [];
        if (Array.isArray(ownerListings)) {
          listingsArray = ownerListings;
        } else if (ownerListings && Array.isArray(ownerListings.listings)) {
          listingsArray = ownerListings.listings;
        } else {
          listingsArray = [];
        }
        console.log("[OwnerDashboard] listings is array:", Array.isArray(listingsArray), listingsArray);
        setListings(listingsArray);
      } catch (err: any) {
        setError(err?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate summary stats (safe for non-array listings)
  const stats = useMemo(() => {
    const safeListings = Array.isArray(listings) ? listings : [];
    return {
      total: safeListings.length,
      approved: safeListings.filter((l) => (l.status || '').toLowerCase() === "approved").length,
      pending: safeListings.filter((l) => (l.status || '').toLowerCase() === "pending").length,
      expired: safeListings.filter((l) => (l.status || '').toLowerCase() === "expired").length,
      rejected: safeListings.filter((l) => (l.status || '').toLowerCase() === "rejected").length,
    };
  }, [listings]);

  // Pagination (safe for non-array listings)
  const { totalPages, paginatedListings } = useMemo(() => {
    const safeListings = Array.isArray(listings) ? listings : [];
    return {
      totalPages: Math.ceil(safeListings.length / itemsPerPage),
      paginatedListings: safeListings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    };
  }, [listings, currentPage]);

  const handleDelete = async (listingId: number) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setListings((prev) => prev.filter((l) => l.id !== listingId))
      setDeleteDialog({ open: false, listingId: null })
    } catch (err) {
      console.error("Delete listing error:", err)
      setError("Failed to delete listing. Please try again.")
    }
  }

  const handleRenew = async (listingId: number) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const newExpirationDate = new Date()
      newExpirationDate.setMonth(newExpirationDate.getMonth() + 6)
      const formattedDate = newExpirationDate.toISOString().split('T')[0]
      
      setListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, status: "Approved", expiresAt: formattedDate } : l)),
      )
      setRenewDialog({ open: false, listingId: null })
    } catch (err) {
      console.error("Renew listing error:", err)
      setError("Failed to renew listing. Please try again.")
    }
  }

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  const handleEdit = (listingId: number) => {
    router.push(`/edit-details/${listingId}`)
  }

  const handleView = (listingId: number) => {
    router.push(`/view-details/${listingId}`)
  }



  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header with Owner Data and Stats Side by Side */}
      <div className="container mx-auto px-6 pt-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Owner Data Card */}
          <div className="flex-1 rounded-2xl shadow-lg bg-gradient-to-r from-indigo-100 via-purple-200 to-indigo-200 text-indigo-900 p-10 flex flex-col justify-between min-h-[340px]">
            <div className="flex flex-col h-full justify-between gap-12">
              <div className="flex items-center gap-10">
                <Avatar className="h-28 w-28 border-4 border-purple-200">
                  <AvatarImage src={user?.profileImage || "/placeholder.jpg"} alt={user?.username ?? "User"} />
                  <AvatarFallback className="bg-purple-200 text-purple-700 text-3xl">
                    {user?.firstName || user?.lastName
                      ? `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() || user?.username?.[0] || "U"
                      : user?.username?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-4">
                  <h1 className="text-4xl font-extrabold text-balance leading-tight">
                    {user?.firstName || user?.lastName
                      ? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
                      : user?.username ?? "User"}
                  </h1>
                  <p className="text-purple-800 flex items-center gap-3 text-xl font-medium">
                    <Building2 className="h-6 w-6" />
                    Boarding Owner Dashboard
                  </p>
                  <p className="text-purple-700 text-lg font-normal">
                    {user?.email ?? user?.username ?? "-"}
                  </p>
                </div>
              </div>
              <div className="self-end mt-10">
                <a href="/user-profile">
                  <Button variant="secondary" className="bg-white/60 hover:bg-white/80 text-purple-900 border-purple-200 text-lg px-6 py-2">
                    Edit Profile
                  </Button>
                </a>
              </div>
            </div>
          </div>
          {/* Combined Stats Card - Improved UI, no bg color */}
          <div className="flex-1 rounded-2xl border border-slate-200 shadow-xl p-8 flex flex-col justify-center">
            <h2 className="text-xl font-bold text-purple-900 mb-6 tracking-tight text-center">Listing Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {/* Stat Block */}
              <div className="flex flex-col items-center gap-1 p-3 rounded-xl border border-slate-100 shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md hover:border-purple-300 cursor-pointer">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</span>
                <span className="text-3xl font-extrabold text-slate-900">{stats.total}</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 rounded-xl border border-slate-100 shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md hover:border-purple-300 cursor-pointer">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Approved</span>
                <span className="text-3xl font-extrabold text-green-600">{stats.approved}</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 rounded-xl border border-slate-100 shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md hover:border-purple-300 cursor-pointer">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pending</span>
                <span className="text-3xl font-extrabold text-yellow-600">{stats.pending}</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 rounded-xl border border-slate-100 shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md hover:border-purple-300 cursor-pointer">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Expired</span>
                <span className="text-3xl font-extrabold text-red-600">{stats.expired}</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 rounded-xl border border-slate-100 shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md hover:border-purple-300 cursor-pointer">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Rejected</span>
                <span className="text-3xl font-extrabold text-red-700">{stats.rejected}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              {error}
              <Button variant="outline" size="sm" onClick={handleRetry}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ...removed summary cards, now combined in header... */}

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                My Listings
              </CardTitle>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => router.push("/create-listing")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Listing
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {listings.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <ListingsTable
                  listings={paginatedListings}
                  onEditAction={handleEdit}
                  onDeleteAction={(id) => setDeleteDialog({ open: true, listingId: id })}
                  onViewAction={handleView}
                  onRenewAction={(id) => setRenewDialog({ open: true, listingId: id })}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, listings.length)} of {listings.length} listings
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open: boolean) => setDeleteDialog({ open, listingId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this listing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteDialog.listingId) {
                  await handleDelete(deleteDialog.listingId);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Renew Confirmation Dialog */}
      <AlertDialog open={renewDialog.open} onOpenChange={(open: boolean) => setRenewDialog({ open, listingId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renew Listing</AlertDialogTitle>
            <AlertDialogDescription>
              This will extend your listing for another 6 months and reactivate it if expired.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => renewDialog.listingId && handleRenew(renewDialog.listingId)}>
              Renew Listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-header">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full bg-white/20" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 bg-white/20" />
              <Skeleton className="h-4 w-32 bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default OwnerDashboardPage;
