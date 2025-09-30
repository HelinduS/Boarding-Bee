using System.Net;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using BoardingBee_backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BoardingBee_backend.controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // Handles password reset and recovery endpoints, including token generation and email delivery.
    public class PasswordController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _cfg;

    // Constructor injecting database context and configuration.
        public PasswordController(AppDbContext db, IConfiguration cfg)
        {
            _db = db;
            _cfg = cfg;
        }

        // --- DTOs ---
    // Request body for forgot password endpoint.
        public class ForgotPasswordRequest { public string Email { get; set; } = default!; }
    // Request body for verifying a password reset token.
        public class VerifyResetTokenRequest { public string Email { get; set; } = default!; public string Token { get; set; } = default!; }

    // Request body for resetting password.
        public class ResetPasswordRequest
        {
            public string Email { get; set; } = default!;
            public string Token { get; set; } = default!;
            public string NewPassword { get; set; } = default!;
            public string ConfirmPassword { get; set; } = default!;
        }

        // --- Helpers (inline, no DI services) ---
    // Generates a secure random token and its hash for password reset.
        private static (string raw, string hash) GenerateToken()
        {
            var raw = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)); // 256-bit
            return (raw, Hash(raw));
        }
    // Hashes a string using SHA256 and returns hex.
        private static string Hash(string value)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
            return Convert.ToHexString(bytes); // uppercase hex
        }
    // Hashes a password using ASP.NET Identity's strong salted format.
        private static string HashPassword(string password)
        {
            // Strong, salted format from ASP.NET (works even without full Identity)
            var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<object>();
            return hasher.HashPassword(null!, password);
        }
    // Sends an email using SMTP configuration.
        private async Task SendEmailAsync(string toEmail, string subject, string html)
        {
            using var client = new SmtpClient(_cfg["Smtp:Host"], int.Parse(_cfg["Smtp:Port"] ?? "587"))
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(_cfg["Smtp:User"], _cfg["Smtp:Pass"])
            };
            var msg = new MailMessage
            {
                From = new MailAddress(_cfg["Smtp:From"] ?? _cfg["Smtp:User"]!),
                Subject = subject,
                Body = html,
                IsBodyHtml = true
            };
            msg.To.Add(toEmail);
            await client.SendMailAsync(msg);
        }

        // --- Endpoints ---
        [HttpPost("forgot")]
        public async Task<IActionResult> Forgot([FromBody] ForgotPasswordRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email))
                return BadRequest("Email is required.");

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
            // Always generic response to prevent user enumeration
            if (user is null)
                return Ok(new { message = "If that email exists, a reset link has been sent." });

            // Revoke existing open tokens

            var openTokens = await _db.PasswordResetTestTokens
                .Where(t => t.UserId == user.Id && t.UsedAt == null && !t.IsRevoked)
                .ToListAsync();
            foreach (var t in openTokens) t.IsRevoked = true;

            // Generate a 4-digit OTP code
            var rng = new Random();
            var rawCode = rng.Next(1000, 10000).ToString();
            var hash = Hash(rawCode);

            _db.PasswordResetTestTokens.Add(new PasswordResetTestToken
            {
                UserId = user.Id,
                TokenHash = hash,
                ExpiresAt = DateTime.UtcNow.AddMinutes(10),
                CreatedAt = DateTime.UtcNow,
                CreatedByIp = HttpContext.Connection?.RemoteIpAddress?.ToString(),
                UserAgent = Request.Headers.UserAgent.ToString(),
                User = user
            });
            await _db.SaveChangesAsync();

            var html = $@"
                <p>Hello {WebUtility.HtmlEncode(user.Username)},</p>
                <p>Your password reset code is: <b>{rawCode}</b></p>
                <p>This code is valid for 10 minutes. If you didn’t request this, you can ignore this email.</p>";

            await SendEmailAsync(user.Email, "Your Boarding Bee password reset code", html);
            return Ok(new { message = "If that email exists, a reset code has been sent." });
        }

        [HttpPost("verify")]
        public async Task<IActionResult> Verify([FromBody] VerifyResetTokenRequest req)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
            if (user is null) return Ok(new { valid = false });


            var tokenHash = Hash(req.Token);
            var token = await _db.PasswordResetTestTokens
                .FirstOrDefaultAsync(t => t.UserId == user.Id && t.TokenHash == tokenHash);

            var valid = token is not null && token.UsedAt == null && !token.IsRevoked && token.ExpiresAt > DateTime.UtcNow;
            // Return the raw token (code) if valid, otherwise null
            return Ok(new { valid, token = valid ? req.Token : null });
        }

        [HttpPost("reset")]
        public async Task<IActionResult> Reset([FromBody] ResetPasswordRequest req)
        {
            if (req.NewPassword != req.ConfirmPassword)
                return BadRequest("Passwords do not match.");

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
            if (user is null) return BadRequest("Invalid token or user.");

            var tokenHash = Hash(req.Token);
            var token = await _db.PasswordResetTestTokens
                .FirstOrDefaultAsync(t => t.UserId == user.Id && t.TokenHash == tokenHash);

            if (token is null || token.UsedAt != null || token.IsRevoked || token.ExpiresAt <= DateTime.UtcNow)
                return BadRequest("Invalid or expired token.");

            user.PasswordHash = HashPassword(req.NewPassword);

            token.UsedAt = DateTime.UtcNow;
            var others = await _db.PasswordResetTestTokens
                .Where(t => t.UserId == user.Id && t.Id != token.Id && t.UsedAt == null && !t.IsRevoked)
                .ToListAsync();
            foreach (var t in others) t.IsRevoked = true;

            await _db.SaveChangesAsync();
            return Ok(new { message = "Password has been reset successfully." });
        }
    }
}
