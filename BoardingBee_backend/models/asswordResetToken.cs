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
        [Required] public string CodeHash { get; set; } = string.Empty;

        [Required] public DateTime ExpiresAtUtc { get; set; }

        public bool Used { get; set; } = false;

        public int Attempts { get; set; } = 0; // to limit brute force
    }
}
