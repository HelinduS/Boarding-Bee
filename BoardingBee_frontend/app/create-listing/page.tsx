"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
import { Alert } from "../../components/ui/alert";
import { createListing } from "@/lib/listingsApi";

export default function CreateListingPage() {
  const router = useRouter();
  const { user, isOwner, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    title: "",
    location: "",
    price: "",
    description: "",
    facilities: "",
    isAvailable: true,
    images: [] as File[],
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login?redirect=/create-listing");
    } else if (!isOwner) {
      router.replace("/register?as=owner");
    }
  }, [isAuthenticated, isOwner, router]);

  if (!isAuthenticated || !isOwner) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setForm((prev) => ({ ...prev, images: Array.from(files) }));
    }
  };

  const validate = () => {
    const errs = [];
    if (!form.location) errs.push("Location is required");
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) errs.push("Valid price is required");
    if (!form.description) errs.push("Description is required");
    if (!form.facilities) errs.push("Facilities are required");
    if (!form.images.length) errs.push("At least one image is required");
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    if (!validate()) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("location", form.location);
    formData.append("price", form.price);
    formData.append("description", form.description);
    formData.append("facilities", form.facilities);
    formData.append("isAvailable", String(form.isAvailable));
    form.images.forEach((img) => formData.append("images", img));
    try {
      await createListing(formData, user?.token || "");
      setSuccess("Your listing has been created successfully.");
      setForm({ title: "", location: "", price: "", description: "", facilities: "", isAvailable: true, images: [] });
      setErrors([]);
      // Redirect to owner dashboard after successful creation
      router.push("/owner-dashboard");
    } catch (err: any) {
      setErrors([err?.message || "Failed to create listing"]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white/80 rounded-xl shadow-lg p-8 backdrop-blur-md">
      <h1 className="text-2xl font-bold mb-6 text-indigo-700">Create a New Listing</h1>
      {errors.length > 0 && <Alert variant="destructive" className="mb-4">{errors.map((e) => <div key={e}>{e}</div>)}</Alert>}
      {success && <Alert className="mb-4">{success}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block font-medium mb-1">Title</label>
          <Input name="title" id="title" value={form.title} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="location" className="block font-medium mb-1">Location</label>
          <Input name="location" id="location" value={form.location} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="price" className="block font-medium mb-1">Price</label>
          <Input name="price" id="price" type="number" min="1" value={form.price} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="description" className="block font-medium mb-1">Description</label>
          <Textarea name="description" id="description" value={form.description} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="facilities" className="block font-medium mb-1">Facilities (comma separated)</label>
          <Input name="facilities" id="facilities" value={form.facilities} onChange={handleChange} required />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox name="isAvailable" checked={form.isAvailable} onCheckedChange={checked => handleCheckboxChange({ target: { name: "isAvailable", checked: !!checked } } as any)} />
          <label htmlFor="isAvailable">Available</label>
        </div>
        <div>
          <label htmlFor="images" className="block font-medium mb-1">Images</label>
          <Input name="images" id="images" type="file" accept="image/*" multiple onChange={handleFileChange} required />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg shadow">
          {loading ? "Creating..." : "Create Listing"}
        </Button>
      </form>
    </div>
  );
}
