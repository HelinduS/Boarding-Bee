using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using BoardingBee_backend.Models;
using Microsoft.EntityFrameworkCore;

namespace BoardingBee_backend.Services
{
    public class PasswordResetService : IPasswordResetService
    {
        private readonly AppDbContext _db;
        private readonly IEmailSender _email;

        public PasswordResetService(AppDbContext db, IEmailSender email)
        {
            _db = db;
            _email = email;
        }

        public async Task StartAsync(string email)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return; // don't reveal existence

            // generate 6-digit code
            var code = RandomNumberGenerator.GetInt32(100000, 999999).ToString();

            var token = new PasswordResetToken
            {
                UserId = user.Id,
                CodeHash = Hash(code),
                ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10),
                Used = false,
                Attempts = 0
            };

            _db.PasswordResetTokens.Add(token);
            await _db.SaveChangesAsync();

            await _email.SendAsync(
                user.Email,
                "Boarding Bee – Password Reset Code",
                $"<p>Your verification code is: <b>{code}</b></p><p>It expires in 10 minutes.</p>"
            );
        }

        public async Task<bool> VerifyAsync(string email, string code)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return false;

            var token = await _db.PasswordResetTokens
                .Where(t => t.UserId == user.Id && !t.Used && t.ExpiresAtUtc > DateTime.UtcNow)
                .OrderByDescending(t => t.Id)
                .FirstOrDefaultAsync();

            if (token == null) return false;

            if (token.Attempts >= 5) return false;

            token.Attempts += 1;
            var ok = token.CodeHash == Hash(code);
            if (ok) token.Used = true;

            await _db.SaveChangesAsync();
            return ok;
        }

        public async Task<bool> ResetAsync(string email, string code, string newPassword)
        {
            var isVerified = await VerifyAsync(email, code);
            if (!isVerified) return false;

            var user = await _db.Users.FirstAsync(u => u.Email == email);
            user.PasswordHash = HashPassword(newPassword); // replace with your real hashing
            await _db.SaveChangesAsync();
            return true;
        }

        // simple placeholders — replace with your existing AuthService hashing
        private static string Hash(string input)
        {
            using var sha = SHA256.Create();
            return Convert.ToHexString(sha.ComputeHash(Encoding.UTF8.GetBytes(input)));
        }

        private static string HashPassword(string password) => "hashed" + password; // TODO: use a real hasher (PBKDF2/BCrypt/Argon2)
    }
}
