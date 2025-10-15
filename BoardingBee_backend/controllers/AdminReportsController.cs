using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
// Update the namespace below to the actual location of AppDbContext
using BoardingBee_backend.Models; // Example: if AppDbContext is in the Models folder

namespace BoardingBee_backend.Controllers
{
    [ApiController, Route("api/admin/reports")]
    public class AdminReportsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public AdminReportsController(AppDbContext db) { _db = db; }

        [HttpGet("kpis")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Kpis()
        {
            var since = DateTime.UtcNow.AddDays(-30);
            var totalUsers = await _db.Users.CountAsync();
            var totalListings = await _db.Listings.CountAsync();
            var newListings30 = await _db.Listings.CountAsync(l => l.CreatedAt >= since);
            var reviews30 = await _db.Reviews.CountAsync(r => r.CreatedAt >= since);
            var inquiries30 = await _db.Inquiries.CountAsync(i => i.CreatedAt >= since);
            return Ok(new { totalUsers, totalListings, newListings30, reviews30, inquiries30 });
        }

        [HttpGet("activity/series")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> ActivitySeries([FromQuery] int days=14)
        {
            var since = DateTime.UtcNow.AddDays(-days);
            var items = await _db.ActivityLogs
                .Where(a => a.At >= since)
                .GroupBy(a => new { d = a.At.Date, a.Kind })
                .Select(g => new { g.Key.d, g.Key.Kind, Count = g.Count() })
                .OrderBy(x => x.d).ToListAsync();
            return Ok(items);
        }
    }
}
