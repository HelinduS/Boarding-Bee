using System.Net;
using System.Net.Mail;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Models;

namespace BoardingBee_backend.Services.Notifications
{
    public class EmailNotifier
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _cfg;
        public EmailNotifier(AppDbContext db, IConfiguration cfg) { _db = db; _cfg = cfg; }

        public async Task<bool> SendAsync(int userId, string subject, string body, string? linkUrl)
        {
            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || string.IsNullOrWhiteSpace(user.Email)) return false;

            var host = _cfg["SMTP_HOST"];
            var port = int.TryParse(_cfg["SMTP_PORT"], out var p) ? p : 587;
            var usr  = _cfg["SMTP_USER"];
            var pass = _cfg["SMTP_PASS"];

            // Dev fallback: just print
            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(usr) || string.IsNullOrWhiteSpace(pass))
            {
                Console.WriteLine($"[DEV EMAIL] to={user.Email} | {subject}\n{body}\n{linkUrl}");
                return true;
            }

            using var client = new SmtpClient(host, port) { EnableSsl = true, Credentials = new NetworkCredential(usr, pass) };
            var mail = new MailMessage(usr!, user.Email!, subject, body + (linkUrl != null ? $"\n\n{linkUrl}" : ""));
            await client.SendMailAsync(mail);
            return true;
        }
    }
}
