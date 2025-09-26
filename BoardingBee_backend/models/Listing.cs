using System.ComponentModel.DataAnnotations;

namespace BoardingBee_backend.models
{
    public class Listing
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string Title { get; set; } = string.Empty;
        [Required]
        public string Location { get; set; } = string.Empty;
        [Required]
        public decimal Price { get; set; }
        [Required]
        public bool IsAvailable { get; set; } = true;
        public string? ThumbnailUrl { get; set; }
        public double? Rating { get; set; }
    public string? Description { get; set; }
    // Added for compatibility with frontend and controller
    public string? Facilities { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        // Moderation/status & lifecycle
        public ListingStatus Status { get; set; } = ListingStatus.Pending; // Pending/Approved/Expired
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMonths(6);

        // Owner linkage (nullable so existing data still works)
        public int? OwnerId { get; set; }


        // Optional details used by your details page
        public string? ContactPhone { get; set; }
        public string? ContactEmail { get; set; }
        public string? AmenitiesCsv { get; set; }   // e.g. "WiFi,AC,Meals"
        public string? ImagesCsv { get; set; }      // e.g. "/img1.jpg,/img2.jpg"
    }
}

// ===== Added enums (same namespace) =====
namespace BoardingBee_backend.models
{
    public enum ListingStatus { Pending, Approved, Expired }
    public enum Availability { Available, Occupied }
}

