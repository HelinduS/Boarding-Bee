using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BoardingBee_backend.Models
{
    public class PasswordResetToken
    {
        [Key] public int Id { get; set; }
        [Required] public int UserId { get; set; }
        [ForeignKey(nameof(UserId))] public User User { get; set; } = null!;
        // Store a hashed code/token — never plain text
        public string TokenHash { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedByIp { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
        public DateTime? UsedAt { get; set; }
        public bool IsRevoked { get; set; }
    }
}
