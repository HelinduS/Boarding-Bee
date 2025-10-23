using System.ComponentModel.DataAnnotations;

namespace BoardingBee_backend.Models
{
    public enum NotificationChannel { Email, Sms, InApp }
    public enum NotificationType { ListingCreated, ListingApproved, ListingRejected, ListingUpdated, NewInquiry, ReviewAdded, ListingExpiring }
    public enum NotificationStatus { Pending, Sent, Failed }

    public class Notification
    {
        [Key] public int Id { get; set; }
        [Required] public int UserId { get; set; }
        public User? User { get; set; }

        [Required] public NotificationType Type { get; set; }
        [Required] public NotificationChannel Channel { get; set; }
        [Required] public string Subject { get; set; } = string.Empty;
        [Required] public string Body { get; set; } = string.Empty;

        public string? LinkUrl { get; set; }
        public int? ListingId { get; set; }
        public int? InquiryId { get; set; }

        public NotificationStatus Status { get; set; } = NotificationStatus.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? SentAt { get; set; }
    }
}
