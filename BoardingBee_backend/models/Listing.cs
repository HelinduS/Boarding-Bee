using System.ComponentModel.DataAnnotations;

namespace BoardingBee_backend.Models
{
    public class Listing
    {
        [Key] public int Id { get; set; }

        [Required] public string Title { get; set; } = string.Empty;
        [Required] public string Location { get; set; } = string.Empty;

        // EF warning fix will be set in AppDbContext (HasPrecision)
        [Required] public decimal Price { get; set; }

        [Required] public bool IsAvailable { get; set; } = true;

        public string? ThumbnailUrl { get; set; }

        // Aggregates for reviews
        public double? Rating { get; set; }          // average rating (0–5, can be null if no reviews)
        public int ReviewCount { get; set; } = 0;    // total number of reviews

        public string? Description { get; set; }
        public string? Facilities { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ListingStatus Status { get; set; } = ListingStatus.Pending;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMonths(6);

        public int? OwnerId { get; set; }

        public string? ContactPhone { get; set; }
        public string? ContactEmail { get; set; }
        public string? AmenitiesCsv { get; set; }
        public string? ImagesCsv { get; set; }
    }

    public enum ListingStatus { Pending, Approved, Expired, Rejected }
    public enum Availability { Available, Occupied }
}
