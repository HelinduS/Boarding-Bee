"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Home, Plus, ChevronLeft, ChevronRight, AlertCircle, Building2 } from "lucide-react"
import { ListingsTable } from "@/components/listings-table"
import { EmptyState } from "@/components/empty-state"

// Mock data - replace with actual API calls
const mockListings = [
  {
    id: "1",
    title: "Cozy Room near University of Colombo",
    location: "Colombo 03",
    price: 25000,
    availability: "Available",
    status: "Approved",
    lastUpdated: "2024-01-15",
    expiresAt: "2024-06-15",
    ownerId: "current-user",
  },
  {
    id: "2",
    title: "Modern Apartment in Kandy",
    location: "Kandy",
    price: 35000,
    availability: "Occupied",
    status: "Approved",
    lastUpdated: "2024-01-10",
    expiresAt: "2024-05-10",
    ownerId: "current-user",
  },
  {
    id: "3",
    title: "Student Hostel Room",
    location: "Galle",
    price: 18000,
    availability: "Available",
    status: "Pending",
    lastUpdated: "2024-01-20",
    expiresAt: "2024-04-20",
    ownerId: "current-user",
  },
  {
    id: "4",
    title: "Luxury Boarding House",
    location: "Negombo",
    price: 45000,
    availability: "Available",
    status: "Expired",
    lastUpdated: "2023-12-01",
    expiresAt: "2024-01-01",
    ownerId: "current-user",
  },
]

const mockOwner = {
  name: "Priya Jayawardena",
  email: "priya.jayawardena@gmail.com",
  phone: "+94 77 123 4567",
  location: "Colombo",
  avatar: "/sri-lankan-woman.jpg",
}

export default function OwnerDashboard() {
  const router = useRouter()
  const [listings, setListings] = useState(mockListings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; listingId: string | null }>({
    open: false,
    listingId: null,
  })
  const [renewDialog, setRenewDialog] = useState<{ open: boolean; listingId: string | null }>({
    open: false,
    listingId: null,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Calculate summary stats
  const stats = useMemo(() => ({
    total: listings.length,
    approved: listings.filter((l) => l.status === "Approved").length,
    pending: listings.filter((l) => l.status === "Pending").length,
    expired: listings.filter((l) => l.status === "Expired").length,
  }), [listings])

  // Pagination
  const { totalPages, paginatedListings } = useMemo(() => ({
    totalPages: Math.ceil(listings.length / itemsPerPage),
    paginatedListings: listings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  }), [listings, currentPage])

  const handleDelete = async (listingId: string) => {
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

  const handleRenew = async (listingId: string) => {
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

  const handleEdit = (listingId: string) => {
    router.push(`/owner/listings/${listingId}/edit`)
  }

  const handleView = (listingId: string) => {
    router.push(`/listings/${listingId}`)
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-header text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white/20">
                <AvatarImage src={mockOwner.avatar || "/placeholder.svg"} alt={mockOwner.name} />
                <AvatarFallback className="bg-white/20 text-white text-lg">
                  {mockOwner.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-balance">{mockOwner.name}</h1>
                <p className="text-white/80 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Boarding Owner Dashboard
                </p>
                <p className="text-white/60 text-sm">
                  {mockOwner.email} • {mockOwner.phone}
                </p>
              </div>
            </div>
            <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              Edit Profile
            </Button>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                My Listings
              </CardTitle>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => router.push("/owner/listings/create")}>
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
                  onEdit={handleEdit}
                  onDelete={(id) => setDeleteDialog({ open: true, listingId: id })}
                  onView={handleView}
                  onRenew={(id) => setRenewDialog({ open: true, listingId: id })}
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
              onClick={() => deleteDialog.listingId && handleDelete(deleteDialog.listingId)}
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
