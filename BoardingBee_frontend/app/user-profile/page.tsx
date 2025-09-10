"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
// Update the import path if the file exists elsewhere, for example:
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// Or create the file "@/components/ui/avatar.tsx" if missing.
import { AlertTriangle, Bell, Eye, Mail, MessageSquare, Shield, Upload, Phone, MapPin } from "lucide-react"
// If your toast hook is located at 'app/hooks/use-toast.ts', create it as below:
// Or update the import path to the correct location, e.g.:
import { toast } from "sonner"
// If you use a library like 'sonner', you might use:
// import { useToast } from "sonner"

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
    firstName: "Kasun",
    lastName: "Perera",
    permanentAddress: "123 Galle Road, Colombo 03, Sri Lanka",
    gender: "male",
    mobileNumber: "+94 77 123 4567",
    emailAddress: "kasun.perera@email.com",
    emergencyContact: "+94 71 987 6543",
    userType: "student",
    institutionCompany: "University of Colombo",
    location: "Colombo",
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

  const handleInputChange = (field: keyof UserData, value: string) => {
    setUserData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSettingChange = (setting: keyof SettingsData, value: boolean) => {
    setSettings((prev) => ({ ...prev, [setting]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsEditing(false)
    setIsSaving(false)

    toast("Profile Updated: Your profile information has been successfully updated.")
  }

  const handleDeleteAccount = () => {
    // This would typically show a confirmation dialog
    toast(
      <div className="text-destructive">
        <strong>Account Deletion</strong>
        <div>This action requires additional confirmation.</div>
      </div>
    )
  }

  return (
    <div className=" bg-secondary w-full">
      {/* Profile Header with user info that updates automatically */}
      <div className="bg-card border-b shadow-sm w-full">
        <div className="container mx-auto px-6 py-8 w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-balance">Profile Settings</h1>
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={userData.profileImage || "/placeholder.svg"} />
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {userData.firstName[0]}
                {userData.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-card-foreground">
                {userData.firstName} {userData.lastName}
              </h2>
              <div className="flex items-center gap-4 mt-2 text-muted-foreground">
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
                  <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                    <Upload className="h-4 w-4" />
                    Change Photo
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Personal Information */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your basic personal details and identification information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={userData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={userData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permanentAddress">Permanent Address</Label>
                  <Textarea
                    id="permanentAddress"
                    value={userData.permanentAddress}
                    onChange={(e) => handleInputChange("permanentAddress", e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={userData.gender}
                    onValueChange={(value: string) => handleInputChange("gender", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
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
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>How boarding owners and other users can reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">Mobile Number</Label>
                    <Input
                      id="mobileNumber"
                      value={userData.mobileNumber}
                      onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                      disabled={!isEditing}
                      placeholder="+94 77 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailAddress">Email Address</Label>
                    <Input
                      id="emailAddress"
                      type="email"
                      value={userData.emailAddress}
                      onChange={(e) => handleInputChange("emailAddress", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={userData.emergencyContact}
                    onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                    disabled={!isEditing}
                    placeholder="+94 71 987 6543"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Academic & Professional Information */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Academic & Professional Information</CardTitle>
                <CardDescription>Your current status and institutional affiliations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="userType">Status</Label>
                  <Select
                    value={userData.userType}
                    onValueChange={(value: string) => handleInputChange("userType", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="institutionCompany">
                      {userData.userType === "student" ? "Institution" : "Company"}
                    </Label>
                    <Input
                      id="institutionCompany"
                      value={userData.institutionCompany}
                      onChange={(e) => handleInputChange("institutionCompany", e.target.value)}
                      disabled={!isEditing}
                      placeholder={userData.userType === "student" ? "University of Colombo" : "Company Name"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={userData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      disabled={!isEditing}
                      placeholder="Colombo"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-4 w-4" />
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-sm">Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive updates about new listings and inquiries</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">SMS Notifications</p>
                      <p className="text-xs text-muted-foreground">Get text messages for urgent updates</p>
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
            <Card className="shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-4 w-4" />
                  Privacy Settings
                </CardTitle>
                <CardDescription className="text-sm">Control who can see your information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Profile Visibility</p>
                      <p className="text-xs text-muted-foreground">Allow boarding owners to view your profile</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.profileVisibility}
                    onCheckedChange={(checked) => handleSettingChange("profileVisibility", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Show Contact Information</p>
                      <p className="text-xs text-muted-foreground">Display your phone and email to verified owners</p>
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
          <Card className="border-destructive/50 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-sm">Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div>
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
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
