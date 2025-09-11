using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BoardingBee_backend.Models
{
    public class UserProfile
    {
        public int Id { get; set; }

        [Required]
        [ForeignKey(nameof(User))]
        public int UserId { get; set; }
        public User User { get; set; } = default!;

        // Profile fields 
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
    }
}
