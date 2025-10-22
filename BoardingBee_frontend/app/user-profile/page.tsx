"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Bell, Eye, Mail, MessageSquare, Shield, Upload, User, Briefcase, Settings as SettingsIcon, Lock, CheckCircle2 } from "lucide-react"
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

  // Derived UI helpers
  const requiredFields: (keyof UserData)[] = [
    "firstName",
    "lastName",
    "permanentAddress",
    "gender",
    "mobileNumber",
    "emailAddress",
    "emergencyContact",
    "userType",
    "institutionCompany",
    "location",
  ]
  const completedFields = requiredFields.filter((k) => (userData[k] as string)?.toString().trim().length > 0).length
  const profileCompletion = Math.round((completedFields / requiredFields.length) * 100)

  // Fetch user profile and settings from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return
        // Use jwt-decode if available, or just mock userId for now
        let userId = ""
        try {
          const { jwtDecode } = await import("jwt-decode")
          const decoded: any = jwtDecode(token)
          userId = decoded.sub
        } catch {
          userId = "1"
        }
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        const res = await fetch(`${API}/api/users/${userId}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("Failed to fetch profile")
        const data = await res.json()
        setUserData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          permanentAddress: data.permanentAddress || "",
          gender: data.gender || "",
          mobileNumber: data.mobileNumber || "",
          emailAddress: data.emailAddress || "",
          emergencyContact: data.emergencyContact || "",
          userType: data.userType || "",
          institutionCompany: data.institutionCompany || "",
          location: data.location || "",
          profileImage: data.profileImage || "",
        })
        setSettings({
          emailNotifications: data.emailNotifications ?? true,
          smsNotifications: data.smsNotifications ?? true,
          profileVisibility: data.profileVisibility ?? true,
          showContactInfo: data.showContactInfo ?? true,
        })
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchProfile()
  }, [])

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<"profile" | "notifications" | "privacy" | "account">("profile")

  const handleInputChange = (field: keyof UserData, value: string) => {
    setUserData((prev) => ({ ...prev, [field]: value }))
  }

  const handleInputEvent = (field: keyof UserData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleInputChange(field, e.target.value)
  }

  const handleSettingChange = (setting: keyof SettingsData, value: boolean) => {
    setSettings((prev) => ({ ...prev, [setting]: value }))
  }

  const handleSwitchEvent = (setting: keyof SettingsData) => (checked: boolean) => {
    handleSettingChange(setting, checked)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No auth token found")
      let userId = ""
      try {
        const { jwtDecode } = await import("jwt-decode")
        const decoded: any = jwtDecode(token)
        userId = decoded.sub
      } catch {
        userId = "1"
      }
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      // Save profile info
      const profileBody = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        permanentAddress: userData.permanentAddress,
        gender: userData.gender,
        mobileNumber: userData.mobileNumber,
        emailAddress: userData.emailAddress,
        emergencyContact: userData.emergencyContact,
        userType: userData.userType,
        institutionCompany: userData.institutionCompany,
        location: userData.location,
      }
      const res = await fetch(`${API}/api/users/${userId}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileBody),
      })
      if (!res.ok) throw new Error("Failed to update profile")
      // Save settings (notification/privacy)
      const settingsBody = {
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
        profileVisibility: settings.profileVisibility,
        showContactInfo: settings.showContactInfo,
      }
      const res2 = await fetch(`${API}/api/users/${userId}/profile/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsBody),
      })
      if (!res2.ok) throw new Error("Failed to update settings")
      setIsEditing(false)
      toast.success("Profile updated successfully")
    } catch (err) {
      toast.error("Could not update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = () => {
    toast.error("Account deletion requires additional confirmation")
  }

  const navItems = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "privacy" as const, label: "Privacy", icon: Lock },
    { id: "account" as const, label: "Account", icon: SettingsIcon },
  ]

  return (
  <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
  <div className="w-full max-w-screen-2xl 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-8">
        
        {/* Layout Grid: Sidebar + Main */}
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 2xl:gap-10">
          {/* Sidebar */}
          <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-24 self-start">
            <Card className="shadow-sm border-indigo-100">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-white shadow">
                    <AvatarImage src={userData.profileImage || "/placeholder.jpg"} />
                  </Avatar>
                  <div>
                    <p className="text-base font-medium text-slate-900">
                      {userData.firstName} {userData.lastName}
                    </p>
                    <p className="text-xs text-slate-600 truncate max-w-[180px]">{userData.emailAddress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-indigo-100">
              <CardContent className="p-2">
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const active = activeSection === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full px-3 py-2 text-sm flex items-center gap-2 rounded-md transition-all text-left ${
                          active
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-indigo-800 hover:bg-indigo-50 hover:text-indigo-900"
                        }`}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>

            {/* Profile completeness */}
            <Card className="shadow-sm border-indigo-100">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">Profile completeness</p>
                  <span className="text-xs text-slate-600">{profileCompletion}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-indigo-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600">Complete your details to improve trust and responses.</p>
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card className="shadow-sm border-indigo-100">
              <CardContent className="p-4 space-y-2">
                <Button
                  size="sm"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => setIsEditing(true)}
                  disabled={isEditing}
                >
                  {isEditing ? "Editing Enabled" : "Edit Profile"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                  onClick={handleSave}
                  disabled={!isEditing || isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-indigo-800 hover:bg-indigo-50"
                  onClick={() => setActiveSection("account")}
                >
                  Go to Account
                </Button>
                <div className="pt-2 border-t border-indigo-100">
                  <p className="text-xs text-slate-600">Visibility</p>
                  <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                    settings.profileVisibility ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}>
                    {settings.profileVisibility ? "Public" : "Hidden"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main content */}
          <main className="lg:col-span-9">
            {isEditing && (
              <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
                You have unsaved changes. Don’t forget to save.
              </div>
            )}

    {/* Content Card */}
  <Card className="shadow-sm border-indigo-100">
          <CardContent className="p-6">
            {/* Profile Section */}
            {activeSection === "profile" && (
              <div className="space-y-8">
                {/* Personal Information */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
                    <h3 className="text-sm text-indigo-900 uppercase tracking-wide">Personal Information</h3>
                  </div>
                  <div className="space-y-4 bg-indigo-50 rounded-lg p-5 border border-indigo-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm text-slate-700">First Name</Label>
                        <Input
                          id="firstName"
                          value={userData.firstName}
                          onChange={handleInputEvent("firstName")}
                          disabled={!isEditing}
                          className="h-10 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm text-slate-700">Last Name</Label>
                        <Input
                          id="lastName"
                          value={userData.lastName}
                          onChange={handleInputEvent("lastName")}
                          disabled={!isEditing}
                          className="h-10 bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm text-slate-700">Gender</Label>
                      <Select
                        value={userData.gender}
                        onValueChange={(value: string) => handleInputChange("gender", value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="h-10 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="permanentAddress" className="text-sm text-slate-700">Permanent Address</Label>
                      <Textarea
                        id="permanentAddress"
                        value={userData.permanentAddress}
                        onChange={handleInputEvent("permanentAddress")}
                        disabled={!isEditing}
                        rows={3}
                        className="resize-none bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
                    <h3 className="text-sm text-indigo-900 uppercase tracking-wide">Contact Information</h3>
                  </div>
                  <div className="space-y-4 bg-indigo-50 rounded-lg p-5 border border-indigo-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mobileNumber" className="text-sm text-slate-700">Mobile Number</Label>
                        <Input
                          id="mobileNumber"
                          value={userData.mobileNumber}
                          onChange={handleInputEvent("mobileNumber")}
                          disabled={!isEditing}
                          className="h-10 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emailAddress" className="text-sm text-slate-700">Email Address</Label>
                        <Input
                          id="emailAddress"
                          type="email"
                          value={userData.emailAddress}
                          onChange={handleInputEvent("emailAddress")}
                          disabled={!isEditing}
                          className="h-10 bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact" className="text-sm text-slate-700">Emergency Contact</Label>
                      <Input
                        id="emergencyContact"
                        value={userData.emergencyContact}
                        onChange={handleInputEvent("emergencyContact")}
                        disabled={!isEditing}
                        className="h-10 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
                    <h3 className="text-sm text-indigo-900 uppercase tracking-wide">Professional Information</h3>
                  </div>
                  <div className="space-y-4 bg-indigo-50 rounded-lg p-5 border border-indigo-100">
                    <div className="space-y-2">
                      <Label htmlFor="userType" className="text-sm text-slate-700">Current Status</Label>
                      <Select
                        value={userData.userType}
                        onValueChange={(value: string) => handleInputChange("userType", value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="h-10 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="working-professional">Working Professional</SelectItem>
                          <SelectItem value="job-seeker">Job Seeker</SelectItem>
                          <SelectItem value="intern">Intern</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="institutionCompany" className="text-sm text-slate-700">
                          {userData.userType === "student" ? "Institution" : "Company"}
                        </Label>
                        <Input
                          id="institutionCompany"
                          value={userData.institutionCompany}
                          onChange={handleInputEvent("institutionCompany")}
                          disabled={!isEditing}
                          className="h-10 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-sm text-slate-700">Location</Label>
                        <Input
                          id="location"
                          value={userData.location}
                          onChange={handleInputEvent("location")}
                          disabled={!isEditing}
                          className="h-10 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg mb-1 text-indigo-900">Notification Preferences</h3>
                  <p className="text-sm text-indigo-700">Manage how you receive updates and alerts</p>
                </div>

                <div className="space-y-3">
                  <Card className="border-indigo-100 shadow-none">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                            <Mail className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm text-slate-900">Email Notifications</p>
                            <p className="text-sm text-slate-600">Receive updates about new listings and inquiries</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.emailNotifications}
                          onCheckedChangeAction={handleSwitchEvent("emailNotifications")}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-indigo-100 shadow-none">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-lg bg-green-50 border border-green-100">
                            <MessageSquare className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm text-slate-900">SMS Notifications</p>
                            <p className="text-sm text-slate-600">Get text messages for urgent updates</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.smsNotifications}
                          onCheckedChangeAction={handleSwitchEvent("smsNotifications")}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Privacy Section */}
            {activeSection === "privacy" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg mb-1 text-indigo-900">Privacy & Visibility</h3>
                  <p className="text-sm text-indigo-700">Control who can see your information</p>
                </div>

                <div className="space-y-3">
                  <Card className="border-indigo-100 shadow-none">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-100">
                            <Eye className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm text-slate-900">Profile Visibility</p>
                            <p className="text-sm text-slate-600">Allow boarding owners to view your profile</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.profileVisibility}
                          onCheckedChangeAction={handleSwitchEvent("profileVisibility")}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-indigo-100 shadow-none">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                            <Shield className="h-5 w-5 text-amber-600" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm text-slate-900">Show Contact Information</p>
                            <p className="text-sm text-slate-600">Display your phone and email to verified owners</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.showContactInfo}
                          onCheckedChangeAction={handleSwitchEvent("showContactInfo")}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Account Section */}
            {activeSection === "account" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg mb-1 text-indigo-900">Account Management</h3>
                  <p className="text-sm text-indigo-700">Manage your account settings and data</p>
                </div>

                <Card className="border-red-200 bg-red-50 shadow-none">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-red-100">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="text-sm text-red-900 mb-1">Delete Account</h4>
                        <p className="text-sm text-red-700">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount}
                      size="sm"
                    >
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
          </main>
        </div>
      </div>
    </div>
  )
}
