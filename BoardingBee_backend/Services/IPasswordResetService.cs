using System.Threading.Tasks;

namespace  BoardingBee_backend.Services
{
    public interface IPasswordResetService
    {
        Task StartAsync(string email);
        Task<bool> VerifyAsync(string email, string code);
        Task<bool> ResetAsync(string email, string code, string newPassword);
    }
}
