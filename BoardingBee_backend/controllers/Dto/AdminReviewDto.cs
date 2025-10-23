using System;

namespace BoardingBee_backend.Controllers.Dto
{
    public class AdminReviewDto
    {
        public int Id { get; set; }
        public int ListingId { get; set; }
        public string? ListingTitle { get; set; }
        public string? ListingLocation { get; set; }
        public int UserId { get; set; }
        public string? UserEmail { get; set; }
        public string? ReviewerName { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
