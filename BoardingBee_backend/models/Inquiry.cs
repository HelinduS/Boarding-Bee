using System.ComponentModel.DataAnnotations;

namespace BoardingBee_backend.Models
{
    public class Inquiry
    {
        [Key] public int Id { get; set; }
        [Required] public int ListingId { get; set; }
        public Listing? Listing { get; set; }

        public int? FromUserId { get; set; }           // tenant user (optional)
        [Required, MaxLength(2000)] public string Message { get; set; } = string.Empty;

        public bool OwnerSeen { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
