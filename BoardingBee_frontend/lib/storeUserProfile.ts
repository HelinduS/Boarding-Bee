import { jwtDecode } from "jwt-decode"

export interface UserProfileData {
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
}

export interface UserSettingsData {
  emailNotifications: boolean
  smsNotifications: boolean
  profileVisibility: boolean
  showContactInfo: boolean
}

export async function storeUserProfileAndSettings(
  userData: UserProfileData,
  settings: UserSettingsData
): Promise<void> {
  const token = localStorage.getItem("token")
  if (!token) throw new Error("No auth token found")
  const decoded: any = jwtDecode(token)
  const userId = decoded.sub
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
}
