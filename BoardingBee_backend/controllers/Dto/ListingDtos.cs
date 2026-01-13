using System;
using System.Linq;
using BoardingBee_backend.Models;

namespace BoardingBee_backend.Controllers.Dto
{
    // Used by GET /api/listings
    public class ListingListItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = "";
        public string Location { get; set; } = "";
        public int Price { get; set; }
        public string Availability { get; set; } = ""; // "Available"/"Occupied"
        public string Status { get; set; } = "";       // "Approved"/"Pending"/"Expired"
        public string LastUpdated { get; set; } = "";  // "YYYY-MM-DD"
        public string ExpiresAt { get; set; } = "";    // "YYYY-MM-DD"
        public int OwnerId { get; set; }

        // Home needs the first image for thumbnail
        public string[] Images { get; set; } = Array.Empty<string>();

        // Ratings (populated from Listing aggregate columns)
        public double? Rating { get; set; }   // average 0–5
        public int ReviewCount { get; set; }  // number of reviews
    }

    // Used by GET /api/listings/{id}
    public class ListingDetailDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public string Location { get; set; } = "";
        public int Price { get; set; }
        public string Availability { get; set; } = "";
        public string Status { get; set; } = "";
        public string[] Amenities { get; set; } = Array.Empty<string>();
        public string[] Images { get; set; } = Array.Empty<string>();
        public string? ContactPhone { get; set; }
        public string? ContactEmail { get; set; }

        public string CreatedAt { get; set; } = "";
        public string LastUpdated { get; set; } = "";

        // Ratings on details too
        public double? Rating { get; set; }
        public int ReviewCount { get; set; }

        // (placeholders you already had)
        public string OwnerName { get; set; } = "";
        public string OwnerAvatar { get; set; } = "";
        public string OwnerJoinedDate { get; set; } = "";
        public double OwnerRating { get; set; } = 0;
        public int OwnerTotalReviews { get; set; } = 0;
    }

    public class CreateListingRequest
    {
        public string Title { get; set; } = "";
        public string Location { get; set; } = "";
        public int Price { get; set; }
        public string Availability { get; set; } = "Available";
        public string Description { get; set; } = "";
        public string? Facilities { get; set; }
        public string? ContactPhone { get; set; }
        public string? ContactEmail { get; set; }
        public string[]? Amenities { get; set; }
        public string[]? Images { get; set; }
    }

    public class UpdateListingRequest : CreateListingRequest { }

    public static class ListingMappings
    {
        public static ListingListItemDto ToListItemDto(Listing l) => new()
        {
            Id = l.Id.ToString(),
            Title = l.Title,
            Location = l.Location,
            Price = (int)l.Price,
            Availability = l.IsAvailable ? "Available" : "Occupied",
            Status = l.Status.ToString(),
            LastUpdated = l.LastUpdated.ToString("yyyy-MM-dd"),
            ExpiresAt = l.ExpiresAt.ToString("yyyy-MM-dd"),
            OwnerId = l.OwnerId ?? 0,

            // Generate image URLs from ListingImage collection
            Images = l.Images.Select(img => $"/api/listings/{l.Id}/images/{img.Id}").ToArray(),

            // CRITICAL: set aggregates so Home can show stars
            Rating = l.Rating,              // double? column in Listing
            ReviewCount = l.ReviewCount     // int column in Listing
        };

        public static ListingDetailDto ToDetailDto(Listing l) => new()
        {
            Id = l.Id.ToString(),
            Title = l.Title,
            Description = l.Description ?? "",
            Location = l.Location,
            Price = (int)l.Price,
            Availability = l.IsAvailable ? "Available" : "Occupied",
            Status = l.Status.ToString(),
            Amenities = !string.IsNullOrWhiteSpace(l.AmenitiesCsv)
                ? (l.AmenitiesCsv ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                : (!string.IsNullOrWhiteSpace(l.Facilities) ? l.Facilities.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) : Array.Empty<string>()),
            Images = l.Images.Select(img => $"/api/listings/{l.Id}/images/{img.Id}").ToArray(),
            ContactPhone = l.ContactPhone,
            ContactEmail = l.ContactEmail,
            CreatedAt = l.CreatedAt.ToString("yyyy-MM-dd"),
            LastUpdated = l.LastUpdated.ToString("yyyy-MM-dd"),

            // Ratings on details
            Rating = l.Rating,
            ReviewCount = l.ReviewCount,

            // Real owner data if available, fallback to placeholders
            OwnerName = l.Owner != null ? $"{l.Owner.FirstName} {l.Owner.LastName}".Trim() : "Owner",
            OwnerAvatar = l.Owner?.ProfileImage != null ? $"/api/users/{l.OwnerId}/profile-image" : "/sri-lankan-woman.jpg",
            OwnerJoinedDate = l.Owner?.CreatedAt.ToString("yyyy-MM-dd") ?? DateTime.UtcNow.ToString("yyyy-MM-dd"),
                OwnerRating = 0, // No rating property available
                OwnerTotalReviews = 0 // No review count property available
        };
    }
}
