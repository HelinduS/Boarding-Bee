using BoardingBee_backend.Models;

namespace BoardingBee_backend.Auth.Services
{
    public interface IAuthService
    {
        string HashPassword(string password);
        bool VerifyPassword(string password, string passwordHash);
    string GenerateJwtToken(User user);
    User Authenticate(string username, string password);
    }
}
