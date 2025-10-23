using System;
using System.Threading.Tasks;
using BoardingBee_backend.Models;
using BoardingBee_backend.Services.Notifications;

namespace BoardingBee.Tests.Unit.Tests.Fakes;

public class ThrowingNotificationService : NotificationService
{
    public ThrowingNotificationService() : base(null, null) { }

    public override Task QueueAndSendAsync(NotificationType type, int userId, string subject, string body, string? linkUrl = null, int? listingId = null, int? inquiryId = null)
    {
        throw new InvalidOperationException("Simulated notification failure");
    }
}
