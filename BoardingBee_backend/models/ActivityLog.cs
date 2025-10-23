using System.ComponentModel.DataAnnotations;

namespace BoardingBee_backend.Models
{
    public enum ActivityKind { UserLogin, ListingCreate, ListingUpdate, ListingRenew, ListingApprove, ListingReject, ReviewCreate, InquiryCreate, ListingDelete }

    public class ActivityLog
    {
        [Key] public long Id { get; set; }
        public DateTime At { get; set; } = DateTime.UtcNow;

        public ActivityKind Kind { get; set; }
        public int? ActorUserId { get; set; }
        public int? ListingId { get; set; }
        public int? ReviewId { get; set; }
        public int? InquiryId { get; set; }
        public string? Meta { get; set; }   // JSON or plain text
    }
}
