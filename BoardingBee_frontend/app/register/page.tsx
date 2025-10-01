"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Progress } from "../../components/ui/progress"

// ---------- Row helper (moved OUTSIDE to keep component identity stable) ----------
type RowProps = {
  label: string
  htmlFor?: string
  required?: boolean
  children: React.ReactNode
}

const Row = React.memo(function Row({ label, htmlFor, required = false, children }: RowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[180px,1fr] gap-2 items-center">
      <Label htmlFor={htmlFor} className="sm:text-right sm:pr-4">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div>{children}</div>
    </div>
  )
})

// ---------- Page ----------
type FormData = {
  username: string
  email: string
  password: string
  confirmPassword: string
  phoneNumber: string
  firstName: string
  lastName: string
  permanentAddress: string
  gender: string
  emergencyContact: string
  userType: string
  institutionCompany: string
  location: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    firstName: "",
    lastName: "",
    permanentAddress: "",
    gender: "",
    emergencyContact: "",
    userType: "",
    institutionCompany: "",
    location: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState<0 | 1 | 2>(0)

  const steps = useMemo(
    () => [
      { key: "account", title: "Account", fields: ["username", "email", "password", "confirmPassword", "userType"] },
      { key: "personal", title: "Personal", fields: ["firstName", "lastName", "gender", "institutionCompany", "location"] },
      { key: "contact", title: "Contact", fields: ["phoneNumber", "emergencyContact", "permanentAddress"] },
    ],
    []
  )

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step, steps.length])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateStep = (s: number) => {
    const requiredByStep: Record<number, Array<keyof FormData>> = {
      0: ["username", "email", "password", "confirmPassword", "userType"],
      1: ["firstName", "lastName", "gender", "institutionCompany", "location"],
      2: ["phoneNumber", "emergencyContact", "permanentAddress"],
    }

    for (const key of requiredByStep[s]) {
      if (!formData[key] || String(formData[key]).trim() === "") {
        setError("Please fill in all required fields for this step.")
        return false
      }
    }
    if (s === 0 && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    setError("")
    return true
  }

  const next = () => {
    if (!validateStep(step)) return
    setStep((s) => (s < 2 ? ((s + 1) as typeof step) : s))
  }

  const back = () => setStep((s) => (s > 0 ? ((s - 1) as typeof step) : s))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(2)) return

    try {
      setLoading(true)
      setError("")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
          firstName: formData.firstName,
          lastName: formData.lastName,
          permanentAddress: formData.permanentAddress,
          gender: formData.gender,
          emergencyContact: formData.emergencyContact,
          userType: formData.userType,
          institutionCompany: formData.institutionCompany,
          location: formData.location,
          Role: "User",
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Registration failed")
      router.push("/login?registered=true")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 to-blue-200 relative pt-16">
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

      <Card className="w-full max-w-3xl shadow-xl border border-gray-200 rounded-2xl bg-white/90 backdrop-blur-md">
        <CardHeader className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-indigo-700">Create an account</CardTitle>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              {steps.map((st, i) => (
                <div key={st.key} className="flex items-center gap-2">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center border ${i <= step ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-300"}`}>
                    {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`${i === step ? "font-semibold text-indigo-700" : ""}`}>{st.title}</span>
                  {i < steps.length - 1 && <span className="mx-2 text-gray-300">—</span>}
                </div>
              ))}
            </div>
          </div>
          <CardDescription className="text-gray-500">
            Step {step + 1} of {steps.length}: {steps[step].title}
          </CardDescription>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="p-6 pt-2">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 0 && (
              <div className="space-y-4">
                <Row label="Username" htmlFor="username" required>
                  <Input id="username" name="username" value={formData.username} onChange={handleChange} placeholder="Choose a username" required />
                </Row>
                <Row label="Email" htmlFor="email" required>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required />
                </Row>
                <Row label="Password" htmlFor="password" required>
                  <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Create a password" required />
                </Row>
                <Row label="Confirm Password" htmlFor="confirmPassword" required>
                  <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" required />
                </Row>
                <Row label="User Type" required>
                  <Select value={formData.userType} onValueChange={(value) => setFormData((p) => ({ ...p, userType: value }))}>
                    <SelectTrigger className="w-full justify-end">
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent side="bottom" align="end" className="w-full">
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="working-professional">Working Professional</SelectItem>
                      <SelectItem value="job-seeker">Job Seeker</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <Row label="First Name" htmlFor="firstName" required>
                  <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Enter your first name" required />
                </Row>
                <Row label="Last Name" htmlFor="lastName" required>
                  <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Enter your last name" required />
                </Row>
                <Row label="Gender" required>
                  <div className="flex flex-wrap gap-6">
                    {["male", "female", "other", "prefer-not-to-say"].map((g) => (
                      <label key={g} className="flex items-center gap-2">
                        <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={handleChange} required />
                        <span className="capitalize">{g.replace(/-/g, " ")}</span>
                      </label>
                    ))}
                  </div>
                </Row>
                <Row label="Institution/Company" htmlFor="institutionCompany" required>
                  <Input id="institutionCompany" name="institutionCompany" value={formData.institutionCompany} onChange={handleChange} placeholder="Your institution or company" required />
                </Row>
                <Row label="Location" htmlFor="location" required>
                  <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="Your location" required />
                </Row>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Row label="Phone Number" htmlFor="phoneNumber" required>
                  <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Enter your phone number" required />
                </Row>
                <Row label="Emergency Contact" htmlFor="emergencyContact" required>
                  <Input id="emergencyContact" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} placeholder="Emergency contact number" required />
                </Row>
                <Row label="Permanent Address" htmlFor="permanentAddress" required>
                  <Input id="permanentAddress" name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} placeholder="Enter your permanent address" required />
                </Row>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" onClick={back} disabled={step === 0}>
                Back
              </Button>

              {step < steps.length - 1 ? (
                <Button type="button" onClick={next}>
                  Next
                </Button>
              ) : (
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
                  {loading ? "Creating account..." : "Register"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center p-0 pb-6">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-700 hover:underline font-medium">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}