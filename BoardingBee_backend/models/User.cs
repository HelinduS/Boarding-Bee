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
        public string? PhoneNumber { get; set; }// optional column
        public string Role { get; set; } = "User"; // Default role is User
    }
}