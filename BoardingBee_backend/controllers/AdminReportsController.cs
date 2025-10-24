using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Models;
using BoardingBee_backend.Controllers.Dto;

namespace BoardingBee_backend.Controllers
{
    [ApiController]
    [Route("api/admin/reports")]
    [Authorize(Roles = "ADMIN")]
    public class AdminReportsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AdminReportsController(AppDbContext db)
        {
            _db = db;
        }

        // ==================== KPIs ====================
        // GET: /api/admin/reports/kpis
        [HttpGet("kpis")]
        public async Task<ActionResult<object>> GetKpis()
        {
            var now = DateTime.UtcNow;
            var from30 = now.AddDays(-30);

            var totalUsers     = await _db.Users.CountAsync();
            var totalListings  = await _db.Listings.CountAsync();
            var newListings30  = await _db.Listings.CountAsync(l => l.CreatedAt >= from30);
            var reviews30      = await _db.Reviews.CountAsync(r => r.CreatedAt >= from30);
            var inquiries30    = await _db.Inquiries.CountAsync(i => i.CreatedAt >= from30);

            return Ok(new
            {
                totalUsers,
                totalListings,
                newListings30,
                reviews30,
                inquiries30
            });
        }

        // ==================== Helpers ====================
        private static string NormalizeEntity(string? entity)
        {
            var e = (entity ?? "").Trim().ToLowerInvariant();
            return e switch
            {
                "users"    => "users",
                "listings" => "listings",
                "reviews"  => "reviews",
                "revenue"  => "revenue",
                _          => "activity"
            };
        }

        private static (DateTime from, DateTime to) ResolveRange(DateTime? from, DateTime? to, int? days)
        {
            if (from.HasValue && to.HasValue)
            {
                var f = DateTime.SpecifyKind(from.Value, DateTimeKind.Utc);
                var t = DateTime.SpecifyKind(to.Value, DateTimeKind.Utc);
                return (f, t);
            }
            var d = days.HasValue && days.Value > 0 ? days.Value : 180;
            var utcNow = DateTime.UtcNow;
            return (utcNow.AddDays(-d), utcNow);
        }

        private static IEnumerable<DateTime> EachDay(DateTime from, DateTime to)
        {
            for (var day = from.Date; day <= to.Date; day = day.AddDays(1))
                yield return day;
        }

        private static IEnumerable<(int Year, int Month)> LastNMonths(DateTime to, int months)
        {
            months = months <= 0 ? 6 : months;
            var start = new DateTime(to.Year, to.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-(months - 1));
            for (var i = 0; i < months; i++)
            {
                var d = start.AddMonths(i);
                yield return (d.Year, d.Month);
            }
        }

        private static string MonthLabel(int month)
            => CultureInfo.CurrentCulture.DateTimeFormat.GetAbbreviatedMonthName(month);

        // Shared series builder so we don't call HTTP actions from actions
        private async Task<List<ActivitySeriesPointDto>> BuildSeries(string ent, DateTime f, DateTime t)
        {
            if (ent == "users")
            {
                var grouped = await _db.Users
                    .Where(u => u.CreatedAt >= f && u.CreatedAt <= t)
                    .GroupBy(u => u.CreatedAt.Date)
                    .Select(g => new { D = g.Key, Count = g.Count() })
                    .ToListAsync();

                var map = grouped.ToDictionary(x => x.D, x => x.Count);
                return EachDay(f, t)
                    .Select(d => new ActivitySeriesPointDto { D = d, Count = map.GetValueOrDefault(d, 0) })
                    .ToList();
            }
            else if (ent == "listings")
            {
                var grouped = await _db.Listings
                    .Where(l => l.CreatedAt >= f && l.CreatedAt <= t)
                    .GroupBy(l => l.CreatedAt.Date)
                    .Select(g => new { D = g.Key, Count = g.Count() })
                    .ToListAsync();

                var map = grouped.ToDictionary(x => x.D, x => x.Count);
                return EachDay(f, t)
                    .Select(d => new ActivitySeriesPointDto { D = d, Count = map.GetValueOrDefault(d, 0) })
                    .ToList();
            }
            else if (ent == "reviews")
            {
                var grouped = await _db.Reviews
                    .Where(r => r.CreatedAt >= f && r.CreatedAt <= t)
                    .GroupBy(r => r.CreatedAt.Date)
                    .Select(g => new { D = g.Key, Count = g.Count() })
                    .ToListAsync();

                var map = grouped.ToDictionary(x => x.D, x => x.Count);
                return EachDay(f, t)
                    .Select(d => new ActivitySeriesPointDto { D = d, Count = map.GetValueOrDefault(d, 0) })
                    .ToList();
            }
            else if (ent == "revenue")
            {
                // Not implemented yet; keep UI stable with zeros
                return EachDay(f, t).Select(d => new ActivitySeriesPointDto { D = d, Count = 0 }).ToList();
            }
            else // activity from ActivityLogs
            {
                var grouped = await _db.ActivityLogs
                    .Where(a => a.At >= f && a.At <= t)
                    .GroupBy(a => a.At.Date)
                    .Select(g => new { D = g.Key, Count = g.Count() })
                    .ToListAsync();

                var map = grouped.ToDictionary(x => x.D, x => x.Count);
                return EachDay(f, t)
                    .Select(d => new ActivitySeriesPointDto { D = d, Count = map.GetValueOrDefault(d, 0) })
                    .ToList();
            }
        }

        // ==================== Activity: Daily Series ====================
        // GET: /api/admin/reports/activity/series
        [HttpGet("activity/series")]
        public async Task<ActionResult<IEnumerable<ActivitySeriesPointDto>>> GetSeries(
            [FromQuery] string? entity,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] int? days)
        {
            var ent = NormalizeEntity(entity);
            var (f, t) = ResolveRange(from, to, days);
            var points = await BuildSeries(ent, f, t);
            return Ok(points);
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
        

        // ==================== Activity: Monthly ====================
        // GET: /api/admin/reports/activity/monthly
        // Removed duplicate/ambiguous GetMonthly endpoint. Only ActivityMonthly remains for /activity/monthly.

        // ==================== Export CSV ====================
        // GET: /api/admin/reports/export/csv
        [HttpGet("export/csv")]
        public async Task<IActionResult> ExportCsv(
            [FromQuery] string reportType,
            [FromQuery] int year,
            [FromQuery] int month)
        {
            var type = (reportType ?? "").Trim().ToLowerInvariant();
            
            // Calculate date range for the selected month
            var fromDate = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
            var toDate = fromDate.AddMonths(1).AddDays(-1).AddHours(23).AddMinutes(59).AddSeconds(59);

            var sb = new StringBuilder();
            var fileName = $"{reportType}_{year}_{month:D2}.csv";

            if (type == "overview")
            {
                // Overview: Users, Listings, Ratings counts
                var users = await _db.Users
                    .Where(u => u.CreatedAt >= fromDate && u.CreatedAt <= toDate)
                    .OrderBy(u => u.CreatedAt)
                    .ToListAsync();
                
                var listings = await _db.Listings
                    .Where(l => l.CreatedAt >= fromDate && l.CreatedAt <= toDate)
                    .OrderBy(l => l.CreatedAt)
                    .ToListAsync();
                
                var reviews = await _db.Reviews
                    .Include(r => r.Listing)
                    .Where(r => r.CreatedAt >= fromDate && r.CreatedAt <= toDate)
                    .OrderBy(r => r.CreatedAt)
                    .ToListAsync();

                sb.AppendLine("Metric,Count");
                sb.AppendLine($"Users,{users.Count}");
                sb.AppendLine($"Listings,{listings.Count}");
                sb.AppendLine($"Ratings,{reviews.Count}");

                // Users Table
                sb.AppendLine("\n\nUsers");
                sb.AppendLine("User ID,Email,Name,Role");
                foreach (var user in users)
                {
                    var name = $"{user.FirstName} {user.LastName}".Trim();
                    sb.AppendLine($"{user.Id},\"{user.Email}\",\"{name}\",{user.Role}");
                }
                sb.AppendLine($"\nTotal Users,{users.Count}");

                // Listings Table
                sb.AppendLine("\n\nListings");
                sb.AppendLine("Listing ID,Listing Name,Location,Price,Owner ID,Status");
                foreach (var listing in listings)
                {
                    var title = listing.Title?.Replace("\"", "\"\"") ?? "";
                    var location = listing.Location?.Replace("\"", "\"\"") ?? "";
                    sb.AppendLine($"{listing.Id},\"{title}\",\"{location}\",{listing.Price},{listing.OwnerId},{listing.Status}");
                }
                sb.AppendLine($"\nTotal Listings,{listings.Count}");

                // Reviews Table
                sb.AppendLine("\n\nReviews");
                sb.AppendLine("Review ID,Listing ID,Listing Name,User ID,Rating,Comment");
                foreach (var review in reviews)
                {
                    var comment = review.Text?.Replace("\"", "\"\"") ?? "";
                    var listingName = review.Listing?.Title?.Replace("\"", "\"\"") ?? "";
                    sb.AppendLine($"{review.Id},{review.ListingId},\"{listingName}\",{review.UserId},{review.Rating},\"{comment}\"");
                }
                sb.AppendLine($"\nTotal Reviews,{reviews.Count}");
                var avgRating = reviews.Any() ? reviews.Average(r => r.Rating) : 0;
                sb.AppendLine($"Average Rating,{avgRating:F2}");
            }
            else if (type == "users")
            {
                // Users: Detailed user information for the month
                var users = await _db.Users
                    .Where(u => u.CreatedAt >= fromDate && u.CreatedAt <= toDate)
                    .OrderBy(u => u.CreatedAt)
                    .ToListAsync();

                sb.AppendLine("User ID,Email,Name,Role");
                foreach (var user in users)
                {
                    var name = $"{user.FirstName} {user.LastName}".Trim();
                    sb.AppendLine($"{user.Id},\"{user.Email}\",\"{name}\",{user.Role}");
                }
                sb.AppendLine($"\nTotal Users,{users.Count}");
            }
            else if (type == "listings")
            {
                // Listings: Detailed listing information for the month
                var listings = await _db.Listings
                    .Where(l => l.CreatedAt >= fromDate && l.CreatedAt <= toDate)
                    .OrderBy(l => l.CreatedAt)
                    .ToListAsync();

                sb.AppendLine("Listing ID,Listing Name,Location,Price,Owner ID,Status");
                foreach (var listing in listings)
                {
                    var title = listing.Title?.Replace("\"", "\"\"") ?? "";
                    var location = listing.Location?.Replace("\"", "\"\"") ?? "";
                    sb.AppendLine($"{listing.Id},\"{title}\",\"{location}\",{listing.Price},{listing.OwnerId},{listing.Status}");
                }
                sb.AppendLine($"\nTotal Listings,{listings.Count}");
            }
            else if (type == "reviews")
            {
                // Reviews/Ratings: Detailed review information for the month
                var reviews = await _db.Reviews
                    .Include(r => r.Listing)
                    .Where(r => r.CreatedAt >= fromDate && r.CreatedAt <= toDate)
                    .OrderBy(r => r.CreatedAt)
                    .ToListAsync();

                sb.AppendLine("Review ID,Listing ID,Listing Name,User ID,Rating,Comment");
                foreach (var review in reviews)
                {
                    var comment = review.Text?.Replace("\"", "\"\"") ?? "";
                    var listingName = review.Listing?.Title?.Replace("\"", "\"\"") ?? "";
                    sb.AppendLine($"{review.Id},{review.ListingId},\"{listingName}\",{review.UserId},{review.Rating},\"{comment}\"");
                }
                
                var avgRating = reviews.Any() ? reviews.Average(r => r.Rating) : 0;
                sb.AppendLine($"\nTotal Reviews,{reviews.Count}");
                sb.AppendLine($"Average Rating,{avgRating:F2}");

                // Add average rating per listing table
                if (reviews.Any())
                {
                    sb.AppendLine("\n\nAverage Rating Per Listing");
                    sb.AppendLine("Listing ID,Listing Name,Review Count,Average Rating");
                    
                    var listingStats = reviews
                        .GroupBy(r => r.ListingId)
                        .Select(g => new
                        {
                            ListingId = g.Key,
                            ListingName = g.First().Listing?.Title ?? "",
                            ReviewCount = g.Count(),
                            AverageRating = g.Average(r => r.Rating)
                        })
                        .OrderBy(s => s.ListingId)
                        .ToList();

                    foreach (var stat in listingStats)
                    {
                        var listingName = stat.ListingName.Replace("\"", "\"\"");
                        sb.AppendLine($"{stat.ListingId},\"{listingName}\",{stat.ReviewCount},{stat.AverageRating:F2}");
                    }
                }
            }
            else
            {
                // Fallback: default to overview
                var usersCount = await _db.Users
                    .Where(u => u.CreatedAt >= fromDate && u.CreatedAt <= toDate)
                    .CountAsync();
                
                var listingsCount = await _db.Listings
                    .Where(l => l.CreatedAt >= fromDate && l.CreatedAt <= toDate)
                    .CountAsync();
                
                var ratingsCount = await _db.Reviews
                    .Where(r => r.CreatedAt >= fromDate && r.CreatedAt <= toDate)
                    .CountAsync();

                sb.AppendLine("Metric,Count");
                sb.AppendLine($"Users,{usersCount}");
                sb.AppendLine($"Listings,{listingsCount}");
                sb.AppendLine($"Ratings,{ratingsCount}");
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", fileName);
        }
    }

    // DTOs used by this controller
    public class ActivitySeriesPointDto
    {
        public DateTime D { get; set; }
        public int Count { get; set; }
    }

    public class MonthlyCountDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string Label { get; set; } = "";
        public int Count { get; set; }
    }
}