"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertTriangle, Bell, Eye, Mail, MessageSquare, Shield, Upload, Phone, MapPin } from "lucide-react"
import { toast } from "sonner"

interface UserData {
  firstName: string
  lastName: string
  permanentAddress: string
  gender: string
  mobileNumber: string
  emailAddress: string
  emergencyContact: string
  userType: string
  institutionCompany: string
  location: string
  profileImage: string
}

interface SettingsData {
  emailNotifications: boolean
  smsNotifications: boolean
  profileVisibility: boolean
  showContactInfo: boolean
}

export function UserProfile() {
  const [userData, setUserData] = useState<UserData>({
    firstName: "Vidath",
    lastName: "Theekshana",
    permanentAddress: "49C Maharagama Road, Piliyandala",
    gender: "male",
    mobileNumber: "+94 77 123 4567",
    emailAddress: "vidaththeekshana@email.com",
    emergencyContact: "+94 71 987 6543",
    userType: "student",
    institutionCompany: "Sri Lanka Institute of Information Technology",
    location: "Malabe",
    profileImage: "",
  })

  const [settings, setSettings] = useState<SettingsData>({
    emailNotifications: true,
    smsNotifications: true,
    profileVisibility: true,
    showContactInfo: true,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // ---- NEW: simple email validation + error state ----
  const [errors, setErrors] = useState<{ email?: string }>({})

  const isValidEmail = (email: string) => {
    // Simple RFC5322-ish check: covers common formats without being too strict
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  }
  // ----------------------------------------------------

  const handleInputChange = (field: keyof UserData, value: string) => {
    setUserData((prev) => ({ ...prev, [field]: value }))

    // Live-validate email while editing (only touches email field)
    if (field === "emailAddress") {
      if (!value.trim()) {
        setErrors((e) => ({ ...e, email: "Email is required." }))
      } else if (!isValidEmail(value.trim())) {
        setErrors((e) => ({ ...e, email: "Please enter a valid email address (e.g., name@example.com)." }))
      } else {
        // clear email error
        setErrors((e) => ({ ...e, email: undefined }))
      }
    }
  }

  const handleSettingChange = (setting: keyof SettingsData, value: boolean) => {
    setSettings((prev) => ({ ...prev, [setting]: value }))
  }

  const handleSave = async () => {
    // Block save on invalid email
    const email = userData.emailAddress?.trim() ?? ""
    if (!email || !isValidEmail(email)) {
      setErrors((e) => ({
        ...e,
        email: !email ? "Email is required." : "Please enter a valid email address (e.g., name@example.com).",
      }))
      toast.error("Invalid email format. Please correct it before saving.")
      return
    }

    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsEditing(false)
    setIsSaving(false)
    toast("Profile Updated: Your profile information has been successfully updated.")
  }

  const handleDeleteAccount = () => {
    toast(
      <div className="text-destructive">
        <strong>Account Deletion</strong>
        <div>This action requires additional confirmation.</div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="w-full bg-[#D9EAFD] border-b border-[#BCCCDC] shadow-sm">
        <div className="container mx-auto px-6 py-8 w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-[#334155]">Profile Settings</h1>
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="border-[#BCCCDC] text-[#334155]">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving || !!errors.email}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 ring-2 ring-[#BCCCDC]">
              <AvatarImage src={userData.profileImage || "/placeholder.svg"} />
              <AvatarFallback className="text-lg bg-[#BCCCDC] text-[#334155]">
                {userData.firstName[0]}
                {userData.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-[#334155]">
                {userData.firstName} {userData.lastName}
              </h2>
              <div className="flex items-center gap-4 mt-2 text-[#9AA6B2]">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>{userData.emailAddress}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{userData.mobileNumber}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{userData.location}</span>
                </div>
              </div>
              <div className="mt-3">
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-transparent border-[#BCCCDC] text-[#334155]"
                  >
                    <Upload className="h-4 w-4" />
                    Change Photo
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Personal Information */}
            <Card className="shadow-md bg-[#F8FAFC] border border-[#BCCCDC]">
              <CardHeader>
                <CardTitle className="text-[#334155]">Personal Information</CardTitle>
                <CardDescription className="text-[#9AA6B2]">
                  Your basic personal details and identification information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-[#334155]">First Name</Label>
                    <Input
                      id="firstName"
                      value={userData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      disabled={!isEditing}
                      className="border-[#BCCCDC] focus-visible:ring-[#9AA6B2]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[#334155]">Last Name</Label>
                    <Input
                      id="lastName"
                      value={userData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      disabled={!isEditing}
                      className="border-[#BCCCDC] focus-visible:ring-[#9AA6B2]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permanentAddress" className="text-[#334155]">Permanent Address</Label>
                  <Textarea
                    id="permanentAddress"
                    value={userData.permanentAddress}
                    onChange={(e) => handleInputChange("permanentAddress", e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                    className="border-[#BCCCDC] focus-visible:ring-[#9AA6B2]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-[#334155]">Gender</Label>
                  <Select
                    value={userData.gender}
                    onValueChange={(value: string) => handleInputChange("gender", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="border-[#BCCCDC] focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#F8FAFC] border border-[#BCCCDC] text-[#334155]">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="shadow-md bg-[#F8FAFC] border border-[#BCCCDC]">
              <CardHeader>
                <CardTitle className="text-[#334155]">Contact Information</CardTitle>
                <CardDescription className="text-[#9AA6B2]">
                  How boarding owners and other users can reach you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber" className="text-[#334155]">Mobile Number</Label>
                    <Input
                      id="mobileNumber"
                      value={userData.mobileNumber}
                      onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                      disabled={!isEditing}
                      placeholder="+94 77 123 4567"
                      className="border-[#BCCCDC] focus-visible:ring-[#9AA6B2]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailAddress" className="text-[#334155]">Email Address</Label>
                    <Input
                      id="emailAddress"
                      type="email"
                      value={userData.emailAddress}
                      onChange={(e) => handleInputChange("emailAddress", e.target.value)}
                      disabled={!isEditing}
                      aria-invalid={!!errors.email}
                      className={`border-[#BCCCDC] focus-visible:ring-[#9AA6B2] ${errors.email ? "border-destructive" : ""}`}
                    />
                    {errors.email && (
                      <p className="text-destructive text-xs mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContact" className="text-[#334155]">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={userData.emergencyContact}
                    onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                    disabled={!isEditing}
                    placeholder="+94 71 987 6543"
                    className="border-[#BCCCDC] focus-visible:ring-[#9AA6B2]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Academic & Professional */}
            <Card className="shadow-md bg-[#F8FAFC] border border-[#BCCCDC]">
              <CardHeader>
                <CardTitle className="text-[#334155]">Academic & Professional Information</CardTitle>
                <CardDescription className="text-[#9AA6B2]">
                  Your current status and institutional affiliations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="userType" className="text-[#334155]">Status</Label>
                  <Select
                    value={userData.userType}
                    onValueChange={(value: string) => handleInputChange("userType", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="border-[#BCCCDC] focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#F8FAFC] border border-[#BCCCDC] text-[#334155]">
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="working-professional">Working Professional</SelectItem>
                      <SelectItem value="job-seeker">Job Seeker</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="institutionCompany" className="text-[#334155]">
                      {userData.userType === "student" ? "Institution" : "Company"}
                    </Label>
                    <Input
                      id="institutionCompany"
                      value={userData.institutionCompany}
                      onChange={(e) => handleInputChange("institutionCompany", e.target.value)}
                      disabled={!isEditing}
                      placeholder={userData.userType === "student" ? "University of Colombo" : "Company Name"}
                      className="border-[#BCCCDC] focus-visible:ring-[#9AA6B2]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-[#334155]">Location</Label>
                    <Input
                      id="location"
                      value={userData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      disabled={!isEditing}
                      placeholder="Colombo"
                      className="border-[#BCCCDC] focus-visible:ring-[#9AA6B2]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="shadow-md bg-[#F8FAFC] border border-[#BCCCDC]">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-[#334155]">
                  <Bell className="h-4 w-4" />
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-sm text-[#9AA6B2]">
                  Choose how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-[#9AA6B2]" />
                    <div>
                      <p className="font-medium text-sm text-[#334155]">Email Notifications</p>
                      <p className="text-xs text-[#9AA6B2]">Receive updates about new listings and inquiries</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-[#9AA6B2]" />
                    <div>
                      <p className="font-medium text-sm text-[#334155]">SMS Notifications</p>
                      <p className="text-xs text-[#9AA6B2]">Get text messages for urgent updates</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => handleSettingChange("smsNotifications", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card className="shadow-md bg-[#F8FAFC] border border-[#BCCCDC]">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-[#334155]">
                  <Shield className="h-4 w-4" />
                  Privacy Settings
                </CardTitle>
                <CardDescription className="text-sm text-[#9AA6B2]">
                  Control who can see your information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="h-4 w-4 text-[#9AA6B2]" />
                    <div>
                      <p className="font-medium text-sm text-[#334155]">Profile Visibility</p>
                      <p className="text-xs text-[#9AA6B2]">Allow boarding owners to view your profile</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.profileVisibility}
                    onCheckedChange={(checked) => handleSettingChange("profileVisibility", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-[#9AA6B2]" />
                    <div>
                      <p className="font-medium text-sm text-[#334155]">Show Contact Information</p>
                      <p className="text-xs text-[#9AA6B2]">Display your phone and email to verified owners</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.showContactInfo}
                    onCheckedChange={(checked) => handleSettingChange("showContactInfo", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          {/* Danger Zone */}
          <Card className="border-destructive/50 shadow-md bg-[#F8FAFC] border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-sm text-[#9AA6B2]">
                Irreversible account actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div>
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-sm text-[#9AA6B2]">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="destructive" onClick={handleDeleteAccount} className="ml-4">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
