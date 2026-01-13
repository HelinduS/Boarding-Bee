using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BoardingBee_backend.Models
{
    public class ListingImage
    {
        [Key] public int Id { get; set; }
        [Required] public byte[] ImageData { get; set; } = Array.Empty<byte>();
        public string? ContentType { get; set; } // e.g., "image/jpeg"
        public int ListingId { get; set; }
        [ForeignKey("ListingId")]
        public Listing Listing { get; set; } = null!;
    }
}
