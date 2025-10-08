using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

// Listing is in BoardingBee_backend.models (lowercase ‘models’)
using BoardingBee_backend.models;

// User is in BoardingBee_backend.Models (uppercase ‘Models’)
using BoardingBee_backend.Models;

namespace BoardingBee_backend.models
{
    public class Review
    {
        [Key] public int Id { get; set; }

        [Required] public int ListingId { get; set; }

        [ForeignKey(nameof(ListingId))]
        public Listing? Listing { get; set; }

        [Required] public int UserId { get; set; }

        public User? User { get; set; }

        [Range(1,5)] public int Rating { get; set; }

        [MaxLength(1000)] public string? Text { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
