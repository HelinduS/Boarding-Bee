using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BoardingBee_backend.Models
{
    public enum ListingStatus { Pending, Approved, Expired }
    public enum Availability { Available, Occupied }

    public class Listing
    {
        [Key] public Guid Id { get; set; } = Guid.NewGuid();

        [Required, MaxLength(140)]
        public string Title { get; set; } = string.Empty;

        [Required, MaxLength(140)]
        public string Location { get; set; } = string.Empty;

        [Range(0, 2_000_000)]
        public int Price { get; set; }

        [Required]
        public Availability Availability { get; set; } = Availability.Available;

        [Required]
        public ListingStatus Status { get; set; } = ListingStatus.Pending;

        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        // Optional owner-facing contact
        [MaxLength(60)]  public string? ContactPhone { get; set; }
        [MaxLength(120)] public string? ContactEmail { get; set; }

        // Simple arrays as CSV to move fast (can normalize later)
        public string? AmenitiesCsv { get; set; }  // e.g. "WiFi,AC,Meals"
        public string? ImagesCsv { get; set; }     // e.g. "/img1.jpg,/img2.jpg"

        // Ownership
        [Required] public int OwnerId { get; set; }            // map from your User.Id
        [ForeignKey(nameof(OwnerId))] public User? Owner { get; set; }

        // Lifecycle
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMonths(6);
    }
}
