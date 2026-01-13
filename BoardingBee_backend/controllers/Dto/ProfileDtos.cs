namespace BoardingBee_backend.Controllers.Dto
{
    /// <summary>
    /// DTO returned to frontend when fetching user profile details.
    /// </summary>
    public class ProfileResponse
    {
        public int UserId { get; set; }
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string PermanentAddress { get; set; } = "";
        public string Gender { get; set; } = "";
        public string MobileNumber { get; set; } = "";    // maps from User.PhoneNumber
        public string EmailAddress { get; set; } = "";    // maps from User.Email
        public string EmergencyContact { get; set; } = "";
        public string UserType { get; set; } = "";
        public string InstitutionCompany { get; set; } = "";
        public string Location { get; set; } = "";
        public string? ProfileImage { get; set; }  // URL endpoint to retrieve image

        // Notification & privacy settings
        public bool EmailNotifications { get; set; }
        public bool SmsNotifications { get; set; }
        public bool ProfileVisibility { get; set; }
        public bool ShowContactInfo { get; set; }
    }

    /// <summary>
    /// DTO received from frontend when user edits profile (name, address, etc.).
    /// </summary>
    public class UpdateProfileRequest
    {
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string PermanentAddress { get; set; } = "";
        public string Gender { get; set; } = "";
        public string EmergencyContact { get; set; } = "";
        public string UserType { get; set; } = "";
        public string InstitutionCompany { get; set; } = "";
        public string Location { get; set; } = "";

        // Optional updates (email/phone are stored in User, not UserProfile)
        public string? MobileNumber { get; set; }
        public string? EmailAddress { get; set; }
    }

    /// <summary>
    /// DTO received from frontend when user updates notification or privacy settings.
    /// </summary>
    public class UpdateSettingsRequest
    {
        public bool EmailNotifications { get; set; }
        public bool SmsNotifications { get; set; }
        public bool ProfileVisibility { get; set; }
        public bool ShowContactInfo { get; set; }
    }
}
