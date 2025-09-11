// auth/AuthService.cs
using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Models;

namespace BoardingBee_backend.Auth
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _db;

        public AuthService(AppDbContext db)
        {
            _db = db;
        }

        // Accepts either email or username for convenience
        public async Task<User?> AuthenticateAsync(string usernameOrEmail, string password)
        {
            // Try email first, then username
            var user = await _db.Users.FirstOrDefaultAsync(u =>
                u.Email == usernameOrEmail || u.Username == usernameOrEmail);

            if (user == null) return null;

            // TODO: replace with your real password hasher/validator
            if (!VerifyPassword(password, user.PasswordHash))
                return null;

            return user;
        }

        public Task<string> GenerateJwtAsync(User user)
        {
            // TODO: replace with your actual JWT issuing logic (signing key, claims, expiry)
            // This is a placeholder token so you can unblock the build and wire the flow end-to-end.
            var fakeToken = $"FAKE-JWT-{user.Id}-{Guid.NewGuid()}";
            return Task.FromResult(fakeToken);
        }

        // ==== Helpers (replace with PBKDF2/BCrypt/Argon2) ====
        private bool VerifyPassword(string plain, string storedHash)
        {
            // Must match your hashing strategy used when creating users
            // Placeholder: "hashed" + plain
            return storedHash == "hashed" + plain;
        }
    }
}
