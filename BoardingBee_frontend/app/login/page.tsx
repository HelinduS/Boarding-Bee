"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { jwtDecode } from "jwt-decode"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/context/authContext"

interface JwtPayload {
  sub: string
  role: string
  iat?: number
  exp?: number
}

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Authentication failed")

      const accessToken = data.token || data.access_token;
      localStorage.setItem("token", accessToken)

      const decodedToken = jwtDecode<JwtPayload>(accessToken)
      const userRole = decodedToken.role
      const userId = decodedToken.sub
      // You may want to fetch user details from backend if needed

      login({
        id: Number(userId),
        username,
        email: username,
        role: userRole,
        token: accessToken,
      })

      if (userRole === "ADMIN") router.push("/admindas/dashboard")
      else if (userRole === "USER") router.push("/")
      else if (userRole === "OWNER") router.push("/owner-dashboard")
      else throw new Error("Unknown role")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-purple-200 to-blue-200 relative pt-16">
      {/* Glass effect overlay */}
      <div className="absolute inset-0 backdrop-blur-xl bg-white/50" />

      {/* Absolutely positioned back button */}
      <div className="absolute top-0 left-0 z-20 p-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-indigo-700 hover:text-blue-500 flex items-center gap-2 text-lg font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
      </div>

      <div className="relative flex w-full max-w-7xl mx-auto overflow-hidden rounded-3xl m-4 border border-white/30 shadow-2xl bg-white/20 backdrop-blur-xl">
        {/* Left side - Login Form */}
        <div className="flex w-full items-center justify-center p-12 md:w-1/2">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-blue-600 mb-4">Boarding Bee</h1>
              <p className="text-gray-700">Welcome Back, Please Sign in to your account</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="username">Email Address</Label>
                <Input
                  id="username"
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter Your Email"
                  className="h-12 rounded-lg border-gray-300 px-4 
                             outline-none focus:outline-none 
                             focus:border-blue-600 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter Your Password"
                  className="h-12 rounded-lg border-gray-300 px-4 
                             outline-none focus:outline-none 
                             focus:border-blue-600 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-700">
                    Remember me
                  </Label>
                </div>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              {/* Buttons */}
              <div className="flex space-x-4">
                <Button
                  type="submit"
                  className="flex-1 h-12 rounded-lg bg-blue-600 text-white 
                             hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 rounded-lg border-blue-600 text-blue-600 
                             hover:bg-blue-50 bg-transparent"
                  onClick={() => router.push("/register")}
                >
                  Sign Up
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 rounded-lg border-green-600 text-green-700 hover:bg-green-50 bg-transparent"
                  onClick={() => router.push("/register-owner")}
                >
                  Register as Owner
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right side - Illustration */}
        <div className="hidden md:flex md:w-1/2 md:items-center md:justify-center 
                        relative overflow-hidden bg-gradient-to-br from-purple-400 via-blue-500 to-indigo-600 
                        backdrop-blur-xl bg-white/10 border-l border-white/20">
          <div className="relative z-10 text-center text-white px-8">
            {/* Centered logo */}
            <div className="flex justify-center mb-8">
              <Image
                src="/images/dcd8b9a7-3418-48ae-b4d4-0bd8b038ab47.png"
                alt="Boarding Bee Logo"
                width={180}
                height={180}
                priority
              />
            </div>

            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-4">Explore the World</h2>
              <p className="text-xl opacity-90">
                Discover Endless Boarding Possibilities in One Platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
