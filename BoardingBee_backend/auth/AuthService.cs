using BoardingBee_backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace BoardingBee_backend.Auth.Services
{
    public class AuthService : IAuthService
    {
        private readonly BoardingBee_backend.Models.AppDbContext _db;
        public AuthService(BoardingBee_backend.Models.AppDbContext db)
        {
            _db = db;
        }

        public string HashPassword(string password)
        {
            var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<object>();
            return hasher.HashPassword(null!, password);
        }

        public bool VerifyPassword(string password, string passwordHash)
        {
            var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<object>();
            var result = hasher.VerifyHashedPassword(null!, passwordHash, password);
            return result == Microsoft.AspNetCore.Identity.PasswordVerificationResult.Success;
        }

        public string GenerateJwtToken(User user)
        {
            var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "your-very-strong-secret-key";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim("role", (user.Role ?? "USER").ToUpperInvariant())
            };

            var token = new JwtSecurityToken(
                issuer: "BoardingBee_backend",
                audience: "BoardingBee_frontend",
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public User Authenticate(string username, string password)
        {
        var user = _db.Users.FirstOrDefault(u => u.Username == username || u.Email == username);
            if (user == null) return null;
            if (!VerifyPassword(password, user.PasswordHash)) return null;
            return user;
        }
    }
}
