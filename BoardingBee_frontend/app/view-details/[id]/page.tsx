"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, MapPin, Phone, Mail, Wifi, Car, Utensils, Shirt, Star, Calendar } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { fetchListing } from "@/lib/listingsApi";
import { useAuth } from "@/context/authContext"

import ReviewsSection from "@/components/ui/ReviewsSection";

const amenityIcons = {
  WiFi: Wifi,
  AC: Car,
  Meals: Utensils,
  Laundry: Shirt,
  Parking: Car,
  Security: Star,
}

export default function ListingDetails() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const listingId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listing, setListing] = useState<any>(null);

  // helper for numeric id to pass to ReviewsSection
  const numericListingId = Array.isArray(listingId) ? Number(listingId[0]) : Number(listingId);

  useEffect(() => {
    async function loadListing() {
      setLoading(true);
      try {
        if (listingId) {
          const id = Array.isArray(listingId) ? Number(listingId[0]) : Number(listingId);
          if (!isNaN(id)) {
            const data = await fetchListing(id, user?.token);
            setListing(data);
          } else {
            setError("Invalid listing ID.");
          }
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load listing.");
      } finally {
        setLoading(false);
      }
    }
    loadListing();
  }, [listingId, user?.token]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 0 }).format(price)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-96 bg-muted animate-pulse rounded-lg" />
              <Card>
                <CardContent className="p-6 space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-4 bg-muted animate-pulse rounded" />
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-4 bg-muted animate-pulse rounded" />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-balance">{listing.title}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4" />
              {listing.location}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <img
                  src={listing.images?.[0] || "https://boardingbee.blob.core.windows.net/images/boarding.jpeg"}
                  alt={listing.title}
                  className="w-full h-96 object-cover rounded-lg"
                />
              </div>
              {listing.images?.slice(1).map((image: string, index: number) => (
                <img
                  key={index}
                  src={image || "https://boardingbee.blob.core.windows.net/images/boarding.jpeg"}
                  alt={`${listing.title} - Image ${index + 2}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About this place</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{listing.description}</p>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {listing.amenities?.map((amenity: string) => {
                    const IconComponent = amenityIcons[amenity as keyof typeof amenityIcons] || Star;
                    return (
                      <div key={amenity} className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-primary" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ⤵️ NEW: Ratings & Reviews */}
            {!isNaN(numericListingId) && (
              <Card>
                <CardHeader>
                  <CardTitle>Ratings & Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewsSection
                    listingId={numericListingId}
                    token={user?.token}
                    isAuthenticated={!!user?.token}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing & Availability */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 0 }).format(listing.price)}
                    </div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge
                      variant={listing.availability === "Available" ? "default" : "secondary"}
                      className={listing.availability === "Available" ? "bg-green-100 text-green-800" : ""}
                    >
                      {listing.availability}
                    </Badge>
                  </div>

                  <div className="pt-4 border-t">
                    <Button className="w-full bg-primary hover:bg-primary/90" size="lg">
                      Contact Owner
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Owner Information */}
            <Card>
              <CardHeader>
                <CardTitle>Owner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={listing.ownerAvatar && listing.ownerAvatar.trim() !== "" ? listing.ownerAvatar : "/placeholder-avatar.png"}
                        alt={listing.ownerName}
                        onError={(e) => { e.currentTarget.src = "/placeholder.jpg"; }}
                      />
                      <AvatarFallback>
                        {listing.ownerName?.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{listing.ownerName}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {listing.ownerRating} ({listing.ownerTotalReviews} reviews)
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Joined {listing.ownerJoinedDate ? formatDate(listing.ownerJoinedDate) : "-"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{listing.contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{listing.contactEmail}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
