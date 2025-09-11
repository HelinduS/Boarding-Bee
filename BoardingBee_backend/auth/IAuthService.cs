// auth/IAuthService.cs
using System.Threading.Tasks;
using BoardingBee_backend.Models;

namespace BoardingBee_backend.Auth
{
    public interface IAuthService
    {
        // Check username or email + password and return the user if valid
        Task<User?> AuthenticateAsync(string usernameOrEmail, string password);

        // Issue a JWT (or any access token string) for a valid user
        Task<string> GenerateJwtAsync(User user);
    }
}
