"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, RefreshCw } from "lucide-react"
import { deleteListing, renewListing } from "@/lib/listingsApi";
import { useAuth } from "@/context/authContext";

interface Listing {
  id: number
  title: string
  location: string
  price: number
  availability: string
  status: string
  lastUpdated?: string
  expiresAt?: string
  ownerId?: string
}

interface ListingsTableProps {
  readonly listings: Listing[]
  onEditAction: (id: number) => void
  onDeleteAction: (id: number) => void
  onViewAction: (id: number) => void
  onRenewAction: (id: number) => void
}

// Table to display property listings
export function ListingsTable({ listings, onEditAction, onDeleteAction, onViewAction, onRenewAction }: Readonly<ListingsTableProps>) {
  const { user } = useAuth();

  // Delete a listing and update UI
  const handleDelete = async (id: number) => {
    try {
  await deleteListing(id, user?.token || "");
  onDeleteAction(id);
    } catch {
      // Optionally handle error
    }
  };

  // Example: handle renew with API
  const handleRenew = async (id: number) => {
    try {
  await renewListing(id, user?.token || "");
  onRenewAction(id);
    } catch {
      // Optionally handle error
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>
      case "Pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "Expired":
        return <Badge variant="destructive" className="bg-red-400">Expired</Badge>
      case "Rejected":
        return <Badge variant="destructive" className="bg-red-600">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getAvailabilityBadge = (availability: string) => {
    return availability === "Available" 
      ? <Badge variant="secondary" className="bg-blue-50 text-blue-700">Available</Badge>
      : <Badge variant="secondary" className="bg-gray-100 text-gray-700">Occupied</Badge>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium">Title</th>
            <th className="text-left py-3 px-4 font-medium">Location</th>
            <th className="text-left py-3 px-4 font-medium">Price</th>
            <th className="text-left py-3 px-4 font-medium">Status</th>
            <th className="text-left py-3 px-4 font-medium">Availability</th>
            <th className="text-left py-3 px-4 font-medium">Expires</th>
            <th className="text-right py-3 px-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => (
            <tr key={listing.id} className="border-b hover:bg-muted/50">
              <td className="py-3 px-4">
                <div className="font-medium">{listing.title}</div>
              </td>
              <td className="py-3 px-4 text-muted-foreground">{listing.location}</td>
              <td className="py-3 px-4 font-medium">Rs. {listing.price.toLocaleString()}</td>
              <td className="py-3 px-4">{getStatusBadge(listing.status)}</td>
              <td className="py-3 px-4">{getAvailabilityBadge(listing.availability)}</td>
              <td className="py-3 px-4 text-muted-foreground">{listing.expiresAt}</td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onViewAction(listing.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEditAction(listing.id)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  {listing.status === "Expired" && (
                    <Button variant="ghost" size="sm" onClick={() => handleRenew(listing.id)}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(listing.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}