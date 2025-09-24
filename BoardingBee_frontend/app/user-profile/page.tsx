"use client"

import { useEffect, useState } from "react"
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
import { jwtDecode } from "jwt-decode"

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

export default function UserProfile() {
  const [userData, setUserData] = useState<UserData>({
    firstName: "",
    lastName: "",
    permanentAddress: "",
    gender: "",
    mobileNumber: "",
    emailAddress: "",
    emergencyContact: "",
    userType: "",
    institutionCompany: "",
    location: "",
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

  // Fetch user profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return
        const decoded: any = jwtDecode(token)
        const userId = decoded.sub
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        const res = await fetch(`${API}/api/users/${userId}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("Failed to fetch profile")
        const data = await res.json()
        setUserData({
          firstName: data.firstName,
          lastName: data.lastName,
          permanentAddress: data.permanentAddress,
          gender: data.gender,
          mobileNumber: data.mobileNumber,
          emailAddress: data.emailAddress,
          emergencyContact: data.emergencyContact,
          userType: data.userType,
          institutionCompany: data.institutionCompany,
          location: data.location,
          profileImage: data.profileImage,
        })
        setSettings({
          emailNotifications: data.emailNotifications,
          smsNotifications: data.smsNotifications,
          profileVisibility: data.profileVisibility,
          showContactInfo: data.showContactInfo,
        })
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchProfile()
  }, [])

  const handleInputChange = (field: keyof UserData, value: string) => {
    setUserData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSettingChange = (setting: keyof SettingsData, value: boolean) => {
    setSettings((prev) => ({ ...prev, [setting]: value }))
  }

  const handleSave = async () => {
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
    <div className="min-h-screen flex bg-gradient-to-br from-purple-200 to-blue-200 relative">
      {/* Glass effect overlay */}
      <div className="absolute inset-0 backdrop-blur-xl bg-white/50" />

      <div className="relative flex w-full max-w-7xl mx-auto overflow-hidden rounded-3xl m-4 shadow-2xl bg-white/20 backdrop-blur-xl">
        <div className="flex flex-col w-full p-0 md:p-0 gap-0">
          {/* Header with themed background */}
          <div className="w-full bg-indigo-600  shadow-sm rounded-t-3xl px-8 py-8 md:px-12 md:py-10">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="border-blue-300 text-blue-700">
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-blue-700 text-white">
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="bg-white text-indigo-600  hover:bg-gray-200">Edit Profile</Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 ring-2 ring-white">
                <AvatarImage src={userData.profileImage || "/placeholder.svg"} />
                <AvatarFallback className="text-lg bg-blue-200 text-blue-700">
                  {userData.firstName[0]}
                  {userData.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-white">
                  {userData.firstName} {userData.lastName}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-blue-100">
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
                      className="flex items-center gap-2 bg-transparent border-blue-300 text-blue-700"
                    >
                      <Upload className="h-4 w-4" />
                      Change Photo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 px-8 md:px-12 pb-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Personal Information */}
              <Card className="shadow-md bg-white/80 border border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-700">Personal Information</CardTitle>
                  <CardDescription className="text-blue-400">
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
              <Card className="shadow-md bg-white/80 border border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-700">Contact Information</CardTitle>
                  <CardDescription className="text-blue-400">
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
                        className="border-[#BCCCDC] focus-visible:ring-[#9AA6B2]"
                      />
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
              <Card className="shadow-md bg-white/80 border border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-700">Academic & Professional Information</CardTitle>
                  <CardDescription className="text-blue-400">
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
              <Card className="shadow-md bg-white/80 border border-blue-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg text-blue-700">
                    <Bell className="h-4 w-4" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription className="text-sm text-blue-400">
                    Choose how you want to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="font-medium text-sm text-blue-700">Email Notifications</p>
                        <p className="text-xs text-blue-400">Receive updates about new listings and inquiries</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="font-medium text-sm text-blue-700">SMS Notifications</p>
                        <p className="text-xs text-blue-400">Get text messages for urgent updates</p>
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
              <Card className="shadow-md bg-white/80 border border-blue-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg text-blue-700">
                    <Shield className="h-4 w-4" />
                    Privacy Settings
                  </CardTitle>
                  <CardDescription className="text-sm text-blue-400">
                    Control who can see your information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Eye className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="font-medium text-sm text-blue-700">Profile Visibility</p>
                        <p className="text-xs text-blue-400">Allow boarding owners to view your profile</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.profileVisibility}
                      onCheckedChange={(checked) => handleSettingChange("profileVisibility", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="font-medium text-sm text-blue-700">Show Contact Information</p>
                        <p className="text-xs text-blue-400">Display your phone and email to verified owners</p>
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

          {/* Danger Zone */}
          <div className="mt-8 px-8 md:px-12 pb-8">
            <Card className="border-destructive/50 shadow-md bg-white/80 border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-sm text-blue-400">
                  Irreversible account actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div>
                    <p className="font-medium text-destructive">Delete Account</p>
                    <p className="text-sm text-blue-400">
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
    </div>
  )
}
