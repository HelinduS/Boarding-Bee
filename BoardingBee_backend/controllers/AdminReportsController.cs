
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
        public async Task<IActionResult> ActivitySeries([FromQuery] int days = 14)
        {
            var since = DateTime.UtcNow.AddDays(-days);
            var items = await _db.ActivityLogs
                .Where(a => a.At >= since)
                .GroupBy(a => new { d = a.At.Date, a.Kind })
                .Select(g => new { g.Key.d, g.Key.Kind, Count = g.Count() })
                .OrderBy(x => x.d).ToListAsync();
            return Ok(items);
        }

        [HttpGet("activity/monthly")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> ActivityMonthly([FromQuery] string? entity, [FromQuery] int months = 6, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
        {
            DateTime toDt = to ?? DateTime.UtcNow;
            DateTime fromDt = from ?? toDt.AddMonths(-months + 1);
            entity = (entity ?? string.Empty).ToLower();

            if (entity == "users")
            {
                var q = _db.Users.Where(u => u.CreatedAt >= fromDt && u.CreatedAt <= toDt)
                    .GroupBy(u => new { year = u.CreatedAt.Year, month = u.CreatedAt.Month })
                    .Select(g => new { label = "", year = g.Key.year, month = g.Key.month, count = g.Count() });
                var list = await q.ToListAsync();
                var outp = new List<object>();
                for (var dt = new DateTime(fromDt.Year, fromDt.Month, 1); dt <= toDt; dt = dt.AddMonths(1))
                {
                    var found = list.FirstOrDefault(x => x.year == dt.Year && x.month == dt.Month);
                    outp.Add(new { label = dt.ToString("MMM"), year = dt.Year, month = dt.Month, count = found?.count ?? 0 });
                }
                return Ok(outp);
            }

            if (entity == "listings")
            {
                var q = _db.Listings.Where(l => l.CreatedAt >= fromDt && l.CreatedAt <= toDt)
                    .GroupBy(l => new { year = l.CreatedAt.Year, month = l.CreatedAt.Month })
                    .Select(g => new { label = "", year = g.Key.year, month = g.Key.month, count = g.Count() });
                var list = await q.ToListAsync();
                var outp = new List<object>();
                for (var dt = new DateTime(fromDt.Year, fromDt.Month, 1); dt <= toDt; dt = dt.AddMonths(1))
                {
                    var found = list.FirstOrDefault(x => x.year == dt.Year && x.month == dt.Month);
                    outp.Add(new { label = dt.ToString("MMM"), year = dt.Year, month = dt.Month, count = found?.count ?? 0 });
                }
                return Ok(outp);
            }

            // default/reviews
            if (entity == "reviews" || string.IsNullOrEmpty(entity))
            {
                var q = _db.Reviews.Where(r => r.CreatedAt >= fromDt && r.CreatedAt <= toDt)
                    .GroupBy(r => new { year = r.CreatedAt.Year, month = r.CreatedAt.Month })
                    .Select(g => new { label = "", year = g.Key.year, month = g.Key.month, count = g.Count() });
                var list = await q.ToListAsync();
                var outp = new List<object>();
                for (var dt = new DateTime(fromDt.Year, fromDt.Month, 1); dt <= toDt; dt = dt.AddMonths(1))
                {
                    var found = list.FirstOrDefault(x => x.year == dt.Year && x.month == dt.Month);
                    outp.Add(new { label = dt.ToString("MMM"), year = dt.Year, month = dt.Month, count = found?.count ?? 0 });
                }
                return Ok(outp);
            }

            // fallback: activity logs monthly aggregated
            var aq = _db.ActivityLogs.Where(a => a.At >= fromDt && a.At <= toDt)
                .GroupBy(a => new { year = a.At.Year, month = a.At.Month })
                .Select(g => new { label = "", year = g.Key.year, month = g.Key.month, count = g.Count() });
            var alist = await aq.ToListAsync();
            var aout = new List<object>();
            for (var dt = new DateTime(fromDt.Year, fromDt.Month, 1); dt <= toDt; dt = dt.AddMonths(1))
            {
                var found = alist.FirstOrDefault(x => x.year == dt.Year && x.month == dt.Month);
                aout.Add(new { label = dt.ToString("MMM"), year = dt.Year, month = dt.Month, count = found?.count ?? 0 });
            }
            return Ok(aout);
        }

        // Public debug/activity endpoints so frontend development can fetch sample series/monthly data without auth
        [HttpGet("debug/public/activity/series")]
        public async Task<IActionResult> PublicActivitySeries([FromQuery] string? entity, [FromQuery] int days = 180, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
        {
            // map entity to DB source
            // supported entities: users, listings, reviews, activity
            DateTime fromDt = from ?? DateTime.UtcNow.AddDays(-days);
            DateTime toDt = to ?? DateTime.UtcNow;
            entity = (entity ?? string.Empty).ToLower();

            if (entity == "users")
            {
                var items = await _db.Users
                    .Where(u => u.CreatedAt >= fromDt && u.CreatedAt <= toDt)
                    .GroupBy(u => u.CreatedAt.Date)
                    .Select(g => new { d = g.Key, Kind = "UserCreate", Count = g.Count() })
                    .OrderBy(x => x.d).ToListAsync();
                return Ok(items);
            }

            if (entity == "listings")
            {
                var items = await _db.Listings
                    .Where(l => l.CreatedAt >= fromDt && l.CreatedAt <= toDt)
                    .GroupBy(l => l.CreatedAt.Date)
                    .Select(g => new { d = g.Key, Kind = "ListingCreate", Count = g.Count() })
                    .OrderBy(x => x.d).ToListAsync();
                return Ok(items);
            }

            // default -> reviews/activity
            if (entity == "reviews")
            {
                var items = await _db.Reviews
                    .Where(r => r.CreatedAt >= fromDt && r.CreatedAt <= toDt)
                    .GroupBy(r => r.CreatedAt.Date)
                    .Select(g => new { d = g.Key, Kind = "ReviewCreate", Count = g.Count() })
                    .OrderBy(x => x.d).ToListAsync();
                return Ok(items);
            }

            // fallback: activity logs
            var act = await _db.ActivityLogs
                .Where(a => a.At >= fromDt && a.At <= toDt)
                .GroupBy(a => new { d = a.At.Date, a.Kind })
                .Select(g => new { d = g.Key.d, Kind = g.Key.Kind, Count = g.Count() })
                .OrderBy(x => x.d).ToListAsync();
            return Ok(act);
        }

        [HttpGet("debug/public/activity/monthly")]
        public async Task<IActionResult> PublicActivityMonthly([FromQuery] string? entity, [FromQuery] int months = 6, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
        {
            DateTime toDt = to ?? DateTime.UtcNow;
            DateTime fromDt = from ?? toDt.AddMonths(-months + 1);
            entity = (entity ?? string.Empty).ToLower();

            if (entity == "users")
            {
                var q = _db.Users.Where(u => u.CreatedAt >= fromDt && u.CreatedAt <= toDt)
                    .GroupBy(u => new { year = u.CreatedAt.Year, month = u.CreatedAt.Month })
                    .Select(g => new { label = "", year = g.Key.year, month = g.Key.month, count = g.Count() });
                var list = await q.ToListAsync();
                var outp = new List<object>();
                for (var dt = new DateTime(fromDt.Year, fromDt.Month, 1); dt <= toDt; dt = dt.AddMonths(1))
                {
                    var found = list.FirstOrDefault(x => x.year == dt.Year && x.month == dt.Month);
                    outp.Add(new { label = dt.ToString("MMM"), year = dt.Year, month = dt.Month, count = found?.count ?? 0 });
                }
                return Ok(outp);
            }

            if (entity == "listings")
            {
                var q = _db.Listings.Where(l => l.CreatedAt >= fromDt && l.CreatedAt <= toDt)
                    .GroupBy(l => new { year = l.CreatedAt.Year, month = l.CreatedAt.Month })
                    .Select(g => new { label = "", year = g.Key.year, month = g.Key.month, count = g.Count() });
                var list = await q.ToListAsync();
                var outp = new List<object>();
                for (var dt = new DateTime(fromDt.Year, fromDt.Month, 1); dt <= toDt; dt = dt.AddMonths(1))
                {
                    var found = list.FirstOrDefault(x => x.year == dt.Year && x.month == dt.Month);
                    outp.Add(new { label = dt.ToString("MMM"), year = dt.Year, month = dt.Month, count = found?.count ?? 0 });
                }
                return Ok(outp);
            }

            if (entity == "reviews")
            {
                var q = _db.Reviews.Where(r => r.CreatedAt >= fromDt && r.CreatedAt <= toDt)
                    .GroupBy(r => new { year = r.CreatedAt.Year, month = r.CreatedAt.Month })
                    .Select(g => new { label = "", year = g.Key.year, month = g.Key.month, count = g.Count() });
                var list = await q.ToListAsync();
                var outp = new List<object>();
                for (var dt = new DateTime(fromDt.Year, fromDt.Month, 1); dt <= toDt; dt = dt.AddMonths(1))
                {
                    var found = list.FirstOrDefault(x => x.year == dt.Year && x.month == dt.Month);
                    outp.Add(new { label = dt.ToString("MMM"), year = dt.Year, month = dt.Month, count = found?.count ?? 0 });
                }
                return Ok(outp);
            }

            // fallback: activity logs monthly aggregated
            var aq = _db.ActivityLogs.Where(a => a.At >= fromDt && a.At <= toDt)
                .GroupBy(a => new { year = a.At.Year, month = a.At.Month })
                .Select(g => new { label = "", year = g.Key.year, month = g.Key.month, count = g.Count() });
            var alist = await aq.ToListAsync();
            var aout = new List<object>();
            for (var dt = new DateTime(fromDt.Year, fromDt.Month, 1); dt <= toDt; dt = dt.AddMonths(1))
            {
                var found = alist.FirstOrDefault(x => x.year == dt.Year && x.month == dt.Month);
                aout.Add(new { label = dt.ToString("MMM"), year = dt.Year, month = dt.Month, count = found?.count ?? 0 });
            }
            return Ok(aout);
        }

        // CSV Export endpoints
        [HttpGet("export/csv")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> ExportCsv([FromQuery] string reportType, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null, [FromQuery] int? year = null, [FromQuery] int? month = null)
        {
            DateTime toDt = to ?? DateTime.UtcNow;
            DateTime fromDt = from ?? toDt.AddMonths(-1);
            
            // Use provided year/month if available, otherwise extract from date
            int displayYear = year ?? fromDt.Year;
            int displayMonth = month ?? fromDt.Month;
            var monthDate = new DateTime(displayYear, displayMonth, 1);
            
            var csvContent = new System.Text.StringBuilder();
            var reportTypeLower = (reportType ?? "overview").ToLower();

            if (reportTypeLower == "overview")
            {
                // Overview: Users, Listings, Reviews counts for the selected month only
                csvContent.AppendLine("Month,Year,Users,Listings,Reviews");
                
                var userCount = await _db.Users
                    .Where(u => u.CreatedAt >= fromDt && u.CreatedAt <= toDt)
                    .CountAsync();
                
                var listingCount = await _db.Listings
                    .Where(l => l.CreatedAt >= fromDt && l.CreatedAt <= toDt)
                    .CountAsync();
                
                var reviewCount = await _db.Reviews
                    .Where(r => r.CreatedAt >= fromDt && r.CreatedAt <= toDt)
                    .CountAsync();
                
                // Output only the selected month
                csvContent.AppendLine($"{monthDate.ToString("MMM")},{monthDate.Year},{userCount},{listingCount},{reviewCount}");
            }
            else if (reportTypeLower == "users")
            {
                // Users: User count for the selected month only
                csvContent.AppendLine("Month,Year,User Count");
                
                var count = await _db.Users
                    .Where(u => u.CreatedAt >= fromDt && u.CreatedAt <= toDt)
                    .CountAsync();
                
                csvContent.AppendLine($"{monthDate.ToString("MMM")},{monthDate.Year},{count}");
            }
            else if (reportTypeLower == "listings")
            {
                // Listings: Listing count for the selected month only
                csvContent.AppendLine("Month,Year,Listing Count");
                
                var count = await _db.Listings
                    .Where(l => l.CreatedAt >= fromDt && l.CreatedAt <= toDt)
                    .CountAsync();
                
                csvContent.AppendLine($"{monthDate.ToString("MMM")},{monthDate.Year},{count}");
            }
            else if (reportTypeLower == "reviews")
            {
                // Reviews: Review count for the selected month only
                csvContent.AppendLine("Month,Year,Review Count");
                
                var count = await _db.Reviews
                    .Where(r => r.CreatedAt >= fromDt && r.CreatedAt <= toDt)
                    .CountAsync();
                
                csvContent.AppendLine($"{monthDate.ToString("MMM")},{monthDate.Year},{count}");
            }

            var bytes = System.Text.Encoding.UTF8.GetBytes(csvContent.ToString());
            return File(bytes, "text/csv", $"{reportType}_report_{DateTime.Now:yyyyMMdd}.csv");
        }

        [HttpGet("debug/public/export/csv")]
        public async Task<IActionResult> PublicExportCsv([FromQuery] string reportType, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null, [FromQuery] int? year = null, [FromQuery] int? month = null)
        {
            // Same logic as authenticated endpoint for development
            DateTime toDt = to ?? DateTime.UtcNow;
            DateTime fromDt = from ?? toDt.AddMonths(-1);
            
            // Use provided year/month if available, otherwise extract from date
            int displayYear = year ?? fromDt.Year;
            int displayMonth = month ?? fromDt.Month;
            var monthDate = new DateTime(displayYear, displayMonth, 1);
            
            var csvContent = new System.Text.StringBuilder();
            var reportTypeLower = (reportType ?? "overview").ToLower();

            if (reportTypeLower == "overview")
            {
                csvContent.AppendLine("Month,Year,Users,Listings,Reviews");
                
                var userCount = await _db.Users
                    .Where(u => u.CreatedAt >= fromDt && u.CreatedAt <= toDt)
                    .CountAsync();
                
                var listingCount = await _db.Listings
                    .Where(l => l.CreatedAt >= fromDt && l.CreatedAt <= toDt)
                    .CountAsync();
                
                var reviewCount = await _db.Reviews
                    .Where(r => r.CreatedAt >= fromDt && r.CreatedAt <= toDt)
                    .CountAsync();
                
                csvContent.AppendLine($"{monthDate.ToString("MMM")},{monthDate.Year},{userCount},{listingCount},{reviewCount}");
            }
            else if (reportTypeLower == "users")
            {
                csvContent.AppendLine("Month,Year,User Count");
                
                var count = await _db.Users
                    .Where(u => u.CreatedAt >= fromDt && u.CreatedAt <= toDt)
                    .CountAsync();
                
                csvContent.AppendLine($"{monthDate.ToString("MMM")},{monthDate.Year},{count}");
            }
            else if (reportTypeLower == "listings")
            {
                csvContent.AppendLine("Month,Year,Listing Count");
                
                var count = await _db.Listings
                    .Where(l => l.CreatedAt >= fromDt && l.CreatedAt <= toDt)
                    .CountAsync();
                
                csvContent.AppendLine($"{monthDate.ToString("MMM")},{monthDate.Year},{count}");
            }
            else if (reportTypeLower == "reviews")
            {
                csvContent.AppendLine("Month,Year,Review Count");
                
                var count = await _db.Reviews
                    .Where(r => r.CreatedAt >= fromDt && r.CreatedAt <= toDt)
                    .CountAsync();
                
                csvContent.AppendLine($"{monthDate.ToString("MMM")},{monthDate.Year},{count}");
            }

            var bytes = System.Text.Encoding.UTF8.GetBytes(csvContent.ToString());
            return File(bytes, "text/csv", $"{reportType}_report_{DateTime.Now:yyyyMMdd}.csv");
        }
        

                // DEBUG: Returns the current user's claims for troubleshooting
        [HttpGet("debug/claims")]
        [Authorize]
        public IActionResult DebugClaims()
        {
            var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
            return Ok(claims);
        }
    }
}
