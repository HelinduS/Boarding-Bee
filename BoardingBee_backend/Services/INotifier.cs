namespace BoardingBee_backend.Services.Notifications
{
    public interface INotifier
    {
        Task<bool> SendAsync(int userId, string subject, string body, string? linkUrl);
    }
}
