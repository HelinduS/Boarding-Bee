namespace BoardingBee_backend.Controllers.Dto
{
    // What your frontend receives when fetching profile
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
        public string ProfileImage { get; set; } = "";

        // notification & privacy
        public bool EmailNotifications { get; set; }
        public bool SmsNotifications { get; set; }
        public bool ProfileVisibility { get; set; }
        public bool ShowContactInfo { get; set; }
    }

    // What frontend sends when user edits profile (name, address, etc.)
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

        // optional updates (because email/phone are stored in User, not UserProfile)
        public string? MobileNumber { get; set; }
        public string? EmailAddress { get; set; }
    }

    // What frontend sends when user toggles switches
    public class UpdateSettingsRequest
    {
        public bool EmailNotifications { get; set; }
        public bool SmsNotifications { get; set; }
        public bool ProfileVisibility { get; set; }
        public bool ShowContactInfo { get; set; }
    }
}
