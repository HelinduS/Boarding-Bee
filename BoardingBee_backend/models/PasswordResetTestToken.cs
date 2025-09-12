using System;

namespace BoardingBee_backend.Models
{
    public class PasswordResetTestToken
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string TokenHash { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedByIp { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
        public DateTime? UsedAt { get; set; }
        public bool IsRevoked { get; set; }
        public User User { get; set; } = null!;
    }
}
