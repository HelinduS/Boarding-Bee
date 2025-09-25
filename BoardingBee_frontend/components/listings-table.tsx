"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, RefreshCw } from "lucide-react"

interface Listing {
  id: string
  title: string
  location: string
  price: number
  availability: string
  status: string
  lastUpdated: string
  expiresAt: string
  ownerId: string
}

interface ListingsTableProps {
  listings: Listing[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onView: (id: string) => void
  onRenew: (id: string) => void
}

export function ListingsTable({ listings, onEdit, onDelete, onView, onRenew }: ListingsTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>
      case "Pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "Expired":
        return <Badge variant="destructive" className="bg-red-400">Expired</Badge>
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
                  <Button variant="ghost" size="sm" onClick={() => onView(listing.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(listing.id)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  {listing.status === "Expired" && (
                    <Button variant="ghost" size="sm" onClick={() => onRenew(listing.id)}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onDelete(listing.id)}>
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