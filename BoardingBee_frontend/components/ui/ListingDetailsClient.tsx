"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MapPin, Phone, Mail, Wifi, Car, Utensils, Shirt, Star, Calendar as CalendarIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReviewsSection from "@/components/ui/ReviewsSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { createAppointment } from "@/lib/appointmentsApi";
import { resolveImageUrl } from "@/lib/imageUtils";

const amenityIcons = {
  WiFi: Wifi,
  AC: Car,
  Meals: Utensils,
  Laundry: Shirt,
  Parking: Car,
  Security: Star,
};

import type { Listing } from "@/types/listing";

interface User {
  email?: string;
  token?: string;
}

export default function ListingDetailsClient({ listing, user }: { listing: Listing; user: User }) {
  const router = useRouter();
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [booking, setBooking] = useState<boolean>(false);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const numericListingId = typeof listing.id === "string" ? Number(listing.id) : listing.id;

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 0 }).format(price);

  const handleBookAppointment = async () => {
    if (!selectedDate) return;
    setBooking(true);
    try {
      await createAppointment({
        listingId: numericListingId,
        date: selectedDate,
        userEmail: user?.email ?? "",
        token: user?.token,
      });
      toast({ title: "Appointment requested!", description: `Your appointment for ${format(selectedDate, "dd MMMM yyyy")}` });
      setAppointmentDialogOpen(false);
      setSelectedDate(undefined);
    } catch (err: any) {
      toast({ title: "Failed to book appointment", description: typeof err?.message === "string" ? err.message : "Please try again later.", variant: "destructive" });
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-balance">{listing.title}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4" />
              {listing.location}
            </p>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Image Gallery */}
            <div className="mb-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-full max-w-3xl mx-auto cursor-zoom-in" onClick={() => {
                  setLightboxImg(resolveImageUrl(Array.isArray(listing.images) && listing.images.length > 0 ? listing.images[0] : undefined, "/placeholder.jpg"));
                  setLightboxOpen(true);
                }}>
                  <img
                    src={resolveImageUrl(Array.isArray(listing.images) && listing.images.length > 0 ? listing.images[0] : undefined, "/placeholder.jpg")}
                    alt={listing.title}
                    className="w-full h-136 object-cover rounded-2xl shadow-lg border border-slate-200 transition hover:brightness-90"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 w-full max-w-3xl mx-auto">
                  {listing.images?.slice(1).map((image: string) => (
                    <div
                      key={image}
                      className="cursor-zoom-in"
                      onClick={() => {
                        setLightboxImg(resolveImageUrl(image, "/placeholder.jpg"));
                        setLightboxOpen(true);
                      }}
                    >
                      <img
                        src={resolveImageUrl(image, "/placeholder.jpg")}
                        alt={listing.title}
                        className="w-full h-40 object-cover rounded-2xl shadow border border-slate-100 transition hover:brightness-90"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Lightbox Dialog for full image view */}
            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
              <DialogContent className="max-w-3xl p-0 bg-transparent shadow-none border-none flex items-center justify-center">
                <DialogTitle className="sr-only">Full size image</DialogTitle>
                {lightboxImg && (
                  <img
                    src={lightboxImg}
                    alt="Full size"
                    className="max-h-[80vh] max-w-full rounded-2xl shadow-xl"
                    style={{ margin: "0 auto" }}
                    onClick={() => setLightboxOpen(false)}
                  />
                )}
              </DialogContent>
            </Dialog>
            {/* Ratings & Reviews */}
            {!Number.isNaN(numericListingId) && (
              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-indigo-900 mb-4">Ratings & Reviews</h2>
                <ReviewsSection
                  listingId={numericListingId}
                  token={user?.token}
                  isAuthenticated={!!user?.token}
                  renderSummary={({ average, count }) => (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 p-6 rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Star className="h-6 w-6 text-yellow-400" />
                        <span className="text-2xl font-bold text-indigo-900">{typeof average === 'number' ? average.toFixed(1) : "-"}</span>
                        <span className="text-base text-indigo-700">({count} review{count === 1 ? "" : "s"})</span>
                      </div>
                      <Button className="bg-indigo-700 hover:bg-indigo-800 text-white shadow-md" size="sm">
                        Write a Review
                      </Button>
                    </div>
                  )}
                />
              </section>
            )}
          </div>
          {/* Sidebar */}
          <aside className="w-full lg:w-120 shrink-0 lg:sticky lg:top-24 self-start">
            <div className="bg-linear-to-br from-white via-indigo-50 to-purple-50 rounded-2xl shadow-xl border border-slate-200 p-10 mb-8">
              <div className="mb-6">
                <div className="text-3xl font-bold text-indigo-900">{formatPrice(listing.price)}</div>
                <div className="text-base text-indigo-700">per month</div>
              </div>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-base font-medium text-indigo-900">Status:</span>
                <Badge
                  variant={listing.availability === "Available" ? "default" : "secondary"}
                  className={listing.availability === "Available" ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-600"}
                >
                  {listing.availability}
                </Badge>
              </div>
              <div className="flex items-center gap-5 mb-4">
                <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
                  <AvatarImage
                    src={
                      (listing.owner?.avatar && listing.owner.avatar.trim() !== "") ? listing.owner.avatar :
                      (listing as any).ownerAvatar && (listing as any).ownerAvatar.trim() !== "" ? (listing as any).ownerAvatar :
                      "/placeholder.jpg"
                    }
                    alt={listing.owner?.name || (listing as any).ownerName || "Owner"}
                    className="object-cover w-full h-full"
                    onError={(e) => { e.currentTarget.src = "/placeholder.jpg"; }}
                  />
                </Avatar>
                <div className="flex flex-col min-w-0 gap-1">
                  <div className="font-semibold text-lg text-indigo-900 truncate">{listing.owner?.name || (listing as any).ownerName || "Unknown Owner"}</div>
                  <div className="flex items-center gap-2 text-sm text-indigo-700">
                    <Phone className="h-4 w-4" />
                    <span className="truncate">{listing.contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-indigo-700">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{listing.contactEmail}</span>
                  </div>
                </div>
              </div>
              <Button className="bg-indigo-700 hover:bg-indigo-800 text-white shadow-md w-full" onClick={() => setAppointmentDialogOpen(true)}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
            </div>
            {/* About this place card */}
            <Card className="rounded-2xl shadow-xl border border-slate-200 mb-8">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-xl font-semibold text-indigo-900">About this place</h3>
                <p className="text-muted-foreground leading-relaxed">{listing.description}</p>
              </CardContent>
            </Card>
            {/* Amenities card */}
            <Card className="rounded-2xl shadow-xl border border-slate-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-indigo-900 mb-4">Amenities</h3>
                <div className="grid grid-cols-2 gap-3">
                  {listing.amenities?.map((amenity: string) => {
                    const IconComponent = amenityIcons[amenity as keyof typeof amenityIcons] || Star;
                    return (
                      <div key={amenity} className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2 shadow-sm">
                        <IconComponent className="h-4 w-4 text-indigo-700" />
                        <span className="text-sm text-indigo-900 font-medium">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
      {/* Appointment Booking Dialog */}
      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a date to book your appointment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="relative w-full max-w-xs mx-auto">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date: Date | undefined) => {
                  if (date && date >= startOfMonth && date <= endOfMonth) {
                    setSelectedDate(date);
                  } else {
                    setSelectedDate(undefined);
                  }
                }}
                min={startOfMonth.toISOString().slice(0, 10)}
                max={endOfMonth.toISOString().slice(0, 10)}
                className="pl-10 pr-3 py-2 border rounded w-full focus:ring-2 focus:ring-indigo-400 bg-white text-gray-900"
              />
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleBookAppointment}
              disabled={!selectedDate || booking}
              className="bg-indigo-700 hover:bg-indigo-800 text-white shadow-md"
            >
              {booking ? "Booking..." : "Confirm Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
