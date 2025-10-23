using System.Threading.Tasks;
using BoardingBee_backend.Models;
using BoardingBee_backend.Services.Notifications;

namespace BoardingBee.Tests.Unit.Tests.Fakes;

/// <summary>
/// Fake notification service that inherits NotificationService but performs no work.
/// Uses base(null,null) to avoid needing a real AppDbContext/EmailNotifier in unit tests.
/// </summary>
public class FakeNotificationService : NotificationService
{
    public FakeNotificationService() : base(null, null) { }

    public new Task QueueAndSendAsync(NotificationType type, int userId, string subject, string body, string? linkUrl = null, int? listingId = null, int? inquiryId = null)
    {
        // no-op for tests
        return Task.CompletedTask;
    }
}
