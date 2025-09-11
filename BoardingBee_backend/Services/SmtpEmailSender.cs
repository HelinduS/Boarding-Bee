using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace BoardingBee_backend.Services
{
    public class SmtpEmailSender : IEmailSender
    {
        private readonly IConfiguration _config;
        public SmtpEmailSender(IConfiguration config) => _config = config;

        public async Task SendAsync(string toEmail, string subject, string htmlBody)
        {
            var host = _config["Smtp:Host"];
            var port = int.Parse(_config["Smtp:Port"] ?? "587");
            var user = _config["Smtp:User"];
            var pass = _config["Smtp:Pass"];
            var from = _config["Smtp:From"] ?? user;

            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(user, pass),
                EnableSsl = true
            };

            using var message = new MailMessage(from!, toEmail, subject, htmlBody) { IsBodyHtml = true };
            await client.SendMailAsync(message);
        }
    }
}
