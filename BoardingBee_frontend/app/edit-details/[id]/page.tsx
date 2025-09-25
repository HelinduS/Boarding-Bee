"use client"

import type React from "react"

import { useState, useEffect, ChangeEvent } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { fetchListing, updateListing } from "@/lib/listingsApi";
import { useAuth } from "@/context/authContext";

// Mock data
const mockListing = {
  id: "1",
  title: "Cozy Room near University of Colombo",
  description:
    "A comfortable and well-furnished room perfect for students. Located just 5 minutes walk from the University of Colombo campus.",
  location: "Colombo 03",
  price: 25000,
  availability: "Available",
  status: "Approved",
  amenities: ["WiFi", "AC", "Meals", "Laundry"],
  images: ["/placeholder.svg?height=300&width=400"],
  contactPhone: "+94 77 123 4567",
  contactEmail: "owner@example.com",
}

export default function EditListing() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth();
  const listingId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    price: "",
    availability: "",
    contactPhone: "",
    contactEmail: "",
    // Add more fields as needed
  })
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);

  // Remove an existing image from the UI (mark for removal)
  function handleRemoveExistingImage(url: string) {
    setRemovedImages((prev) => [...prev, url]);
  }

  // Fetch listing data from API
  useEffect(() => {
    async function loadListing() {
      setLoading(true);
      try {
        const data = await fetchListing(listingId, user?.token);
        setFormData({
          title: data.title || "",
          description: data.description || "",
          location: data.location || "",
          price: data.price !== undefined && data.price !== null ? String(data.price) : "",
          availability: data.availability || "",
          contactPhone: data.contactPhone || "",
          contactEmail: data.contactEmail || "",
        });
        // Handle images: support both array and CSV string
        let imgs: string[] = [];
        if (Array.isArray(data.images)) {
          imgs = data.images as string[];
        } else if (typeof data.images === "string") {
          imgs = (data.images as string).split(",").map((s: string) => s.trim()).filter(Boolean);
        }
        setExistingImages(imgs);
        setRemovedImages([]); // reset removed images on load
      } catch (err) {
        setError("Failed to load listing data.");
      } finally {
        setLoading(false);
      }
    }
    if (listingId) loadListing();
  }, [listingId, user?.token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let dataToSend: any = formData;
      // If images are selected or images are removed, use FormData
      if (images.length > 0 || removedImages.length > 0) {
        const formDataObj = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          formDataObj.append(key, value);
        });
        images.forEach((file) => {
          formDataObj.append("images", file);
        });
        // Send removed images as a comma-separated string
        if (removedImages.length > 0) {
          formDataObj.append("removedImages", removedImages.join(","));
        }
        dataToSend = formDataObj;
      } else {
        // Ensure price is a number for JSON
        dataToSend = { ...formData, price: Number(formData.price) };
      }
      await updateListing(listingId, dataToSend, user?.token || "");
      setSuccess(true);
      setTimeout(() => {
        router.push("/owner-dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Failed to update listing. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  // Handle file input change
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

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
          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent className="space-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-balance">Edit Listing</h1>
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              Listing updated successfully! Redirecting to dashboard...
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Listing Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter listing title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="e.g., Colombo 03"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Monthly Rent (LKR) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="25000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability">Availability *</Label>
                  <Select
                    value={formData.availability}
                    onValueChange={(value) => handleInputChange("availability", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Occupied">Occupied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone *</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                    placeholder="+94 77 123 4567"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    placeholder="owner@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your boarding place..."
                  rows={4}
                  required
                />
              </div>

              {/* Existing images with remove option */}
              <div className="space-y-2">
                <Label>Uploaded Images</Label>
                {existingImages.filter(url => !removedImages.includes(url)).length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {existingImages.filter(url => !removedImages.includes(url)).map((url, idx) => (
                      <div key={url + idx} className="relative group">
                        <img
                          src={url}
                          alt={`Listing image ${idx + 1}`}
                          className="h-24 w-32 object-cover rounded border"
                          style={{ background: '#f3f3f3' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(url)}
                          className="absolute top-1 right-1 bg-white/80 hover:bg-red-500 hover:text-white text-red-500 rounded-full p-1 shadow group-hover:opacity-100 opacity-80 transition"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">No images uploaded yet.</div>
                )}
              </div>

              {/* Image upload */}
              <div className="space-y-2">
                <Label htmlFor="images">Add Images</Label>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {images.map((file, idx) => (
                      <span key={file.name + idx} className="text-xs bg-muted px-2 py-1 rounded">
                        {file.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 pt-6">
                <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
