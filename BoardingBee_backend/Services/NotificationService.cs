using BoardingBee_backend.Models;

namespace BoardingBee_backend.Services.Notifications
{
    public class NotificationService
    {
        private readonly AppDbContext _db;
        private readonly EmailNotifier _email;

        public NotificationService(AppDbContext db, EmailNotifier email)
        { _db = db; _email = email; }

        public virtual async Task QueueAndSendAsync(
            NotificationType type, int userId, string subject, string body,
            string? linkUrl = null, int? listingId = null, int? inquiryId = null)
        {
            var n = new Notification {
                UserId = userId, Type = type, Subject = subject, Body = body,
                LinkUrl = linkUrl, ListingId = listingId, InquiryId = inquiryId,
                Status = NotificationStatus.Pending
            };
            _db.Notifications.Add(n);
            await _db.SaveChangesAsync();

            var ok = await _email.SendAsync(userId, subject, body, linkUrl);
            n.Status = ok ? NotificationStatus.Sent : NotificationStatus.Failed;
            n.SentAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }
}
