"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export default function RegisterOwnerPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    business: "",
    location: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Username: form.username,
          FirstName: form.firstName,
          LastName: form.lastName,
          Email: form.email,
          Password: form.password,
          UserType: "Owner",
          Role: "Owner",
          InstitutionCompany: form.business,
          Location: form.location,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      setSuccess("Registration successful! You can now log in as an owner.");
      setForm({ username: "", firstName: "", lastName: "", email: "", password: "", confirmPassword: "", business: "", location: "" });
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white/80 rounded-xl shadow-lg p-8 backdrop-blur-md">
      <h1 className="text-2xl font-bold mb-6 text-indigo-700">Register as Owner</h1>
      {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}
      {success && <Alert className="mb-4">{success}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
        <div className="flex gap-2">
          <Input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required />
          <Input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required />
        </div>
        <Input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <Input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <Input name="confirmPassword" type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} required />
        <Input name="business" placeholder="Business/Company (optional)" value={form.business} onChange={handleChange} />
        <Input name="location" placeholder="Location (optional)" value={form.location} onChange={handleChange} />
        <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg shadow">
          {loading ? "Registering..." : "Register as Owner"}
        </Button>
      </form>
      <div className="flex justify-center mt-6">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-indigo-700 hover:underline font-medium">Login</a>
        </p>
      </div>
    </div>
  );
}
