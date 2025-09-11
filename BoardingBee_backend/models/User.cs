using System;

namespace BoardingBee_backend.Models
{
    public class User
    {
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? PhoneNumber { get; set; } // optional column
    public string Role { get; set; } = "User"; // Default role is User

    public string FirstName { get; set; } = string.Empty;
    public string LastName  { get; set; } = string.Empty;
    public string PermanentAddress { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;                // "male", "female", "other", "prefer-not-to-say"
    public string EmergencyContact { get; set; } = string.Empty;
    public string UserType { get; set; } = string.Empty;              // "student", "working-professional", "Job-Seeker", "Intern", "other"
    public string InstitutionCompany { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string ProfileImageUrl { get; set; } = string.Empty;       // where uploaded avatar is stored
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public UserSettings? UserSettings { get; set; } // Navigation property
    }
}