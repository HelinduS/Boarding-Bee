using System;
using System.Linq;
using BoardingBee_backend.Models;
using BoardingBee_backend.models;

namespace BoardingBee_backend.Controllers.Dto
{
    public class ListingListItemDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = "";
        public string Location { get; set; } = "";
        public int Price { get; set; }
        public string Availability { get; set; } = ""; // "Available"/"Occupied"
        public string Status { get; set; } = "";       // "Approved"/"Pending"/"Expired"
        public string LastUpdated { get; set; } = "";  // "YYYY-MM-DD"
        public string ExpiresAt { get; set; } = "";    // "YYYY-MM-DD"
        public int OwnerId { get; set; }
    }

    public class ListingDetailDto
    {
        public Guid Id { get; set; }
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
        public string OwnerName { get; set; } = "";
        public string OwnerAvatar { get; set; } = "";
        public string OwnerJoinedDate { get; set; } = "";
        public double OwnerRating { get; set; } = 0;   // placeholder until you add reviews
        public int OwnerTotalReviews { get; set; } = 0;
    }

    public class CreateListingRequest
    {
        public string Title { get; set; } = "";
        public string Location { get; set; } = "";
        public int Price { get; set; }
        public string Availability { get; set; } = "Available";
        public string Description { get; set; } = "";
        public string? Facilities { get; set; } // Added for compatibility
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
            Id = Guid.NewGuid(),
            Title = l.Title,
            Location = l.Location,
            Price = (int)l.Price,
            Availability = l.IsAvailable ? "Available" : "Occupied",
            Status = l.Status.ToString(),
            LastUpdated = l.LastUpdated.ToString("yyyy-MM-dd"),
            ExpiresAt = l.ExpiresAt.ToString("yyyy-MM-dd"),
            OwnerId = l.OwnerId ?? 0
        };

        public static ListingDetailDto ToDetailDto(Listing l) => new()
        {
            Id = Guid.NewGuid(),
            Title = l.Title,
            Description = l.Description ?? "",
            Location = l.Location,
            Price = (int)l.Price,
            Availability = l.IsAvailable ? "Available" : "Occupied",
            Status = l.Status.ToString(),
            Amenities = (l.AmenitiesCsv ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
            Images = (l.ImagesCsv ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries),
            ContactPhone = l.ContactPhone,
            ContactEmail = l.ContactEmail,
            CreatedAt = l.CreatedAt.ToString("yyyy-MM-dd"),
            LastUpdated = l.LastUpdated.ToString("yyyy-MM-dd"),
            OwnerName = "Owner",
            OwnerAvatar = "/sri-lankan-woman.jpg",
            OwnerJoinedDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            OwnerRating = 4.8,
            OwnerTotalReviews = 24
        };
    }
}
