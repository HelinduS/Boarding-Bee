using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Models;

namespace BoardingBee_backend.Controllers
{
    [ApiController, Route("api/admin/notifications")]
    public class AdminNotificationsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public AdminNotificationsController(AppDbContext db) { _db = db; }

        [HttpGet("failed")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Failed([FromQuery] int days=7)
        {
            var since = DateTime.UtcNow.AddDays(-days);
            var items = await _db.Notifications.AsNoTracking()
               .Where(n => n.Status == NotificationStatus.Failed && n.CreatedAt >= since)
               .OrderByDescending(n => n.CreatedAt).ToListAsync();
            return Ok(items);
        }
    }
}
