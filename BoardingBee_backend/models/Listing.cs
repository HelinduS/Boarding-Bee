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
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
