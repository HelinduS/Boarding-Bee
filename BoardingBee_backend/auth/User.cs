using System.ComponentModel.DataAnnotations;

namespace BoardingBee_backend.Auth.Models
{
    // Represents a user in the system. Base class for Admin and Owner.
    public class User
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string Username { get; set; }
        [Required]
        public string PasswordHash { get; set; }
        [Required]
        public string Role { get; set; } // User, Admin, Owner
    }
}
