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

        // ==================== Activity: Monthly ====================
        // GET: /api/admin/reports/activity/monthly
        [HttpGet("activity/monthly")]
        public async Task<ActionResult<IEnumerable<MonthlyCountDto>>> GetMonthly(
            [FromQuery] string? entity,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] int? months)
        {
            var ent = NormalizeEntity(entity);
            var (f, t) = ResolveRange(from, to, null);
            var monthsBack = months.HasValue && months.Value > 0 ? months.Value : 6;

            List<(int Year, int Month, int Count)> grouped;

            if (ent == "users")
            {
                grouped = await _db.Users
                    .Where(u => u.CreatedAt >= f && u.CreatedAt <= t)
                    .GroupBy(u => new { u.CreatedAt.Year, u.CreatedAt.Month })
                    .Select(g => new ValueTuple<int, int, int>(g.Key.Year, g.Key.Month, g.Count()))
                    .ToListAsync();
            }
            else if (ent == "listings")
            {
                grouped = await _db.Listings
                    .Where(l => l.CreatedAt >= f && l.CreatedAt <= t)
                    .GroupBy(l => new { l.CreatedAt.Year, l.CreatedAt.Month })
                    .Select(g => new ValueTuple<int, int, int>(g.Key.Year, g.Key.Month, g.Count()))
                    .ToListAsync();
            }
            else if (ent == "reviews")
            {
                grouped = await _db.Reviews
                    .Where(r => r.CreatedAt >= f && r.CreatedAt <= t)
                    .GroupBy(r => new { r.CreatedAt.Year, r.CreatedAt.Month })
                    .Select(g => new ValueTuple<int, int, int>(g.Key.Year, g.Key.Month, g.Count()))
                    .ToListAsync();
            }
            else if (ent == "revenue")
            {
                // Not implemented yet
                grouped = new List<(int Year, int Month, int Count)>();
            }
            else // activity
            {
                grouped = await _db.ActivityLogs
                    .Where(a => a.At >= f && a.At <= t)
                    .GroupBy(a => new { a.At.Year, a.At.Month })
                    .Select(g => new ValueTuple<int, int, int>(g.Key.Year, g.Key.Month, g.Count()))
                    .ToListAsync();
            }

            var map = grouped.ToDictionary(x => (x.Item1, x.Item2), x => x.Item3);

            var filled = LastNMonths(t, monthsBack)
                .Select(tuple => new MonthlyCountDto
                {
                    Year  = tuple.Year,
                    Month = tuple.Month,
                    Label = MonthLabel(tuple.Month),
                    Count = map.GetValueOrDefault((tuple.Year, tuple.Month), 0)
                })
                .ToList();

            return Ok(filled);
        }

        // ==================== Export CSV ====================
        // GET: /api/admin/reports/export/csv
        [HttpGet("export/csv")]
        public async Task<IActionResult> ExportCsv(
            [FromQuery] string reportType,
            [FromQuery] string? entity,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] int? days)
        {
            var ent = NormalizeEntity(entity);
            var (f, t) = ResolveRange(from, to, days);

            // Reuse series data for CSV
            var series = await BuildSeries(ent, f, t);

            var sb = new StringBuilder();
            sb.AppendLine("date,count");
            foreach (var p in series)
                sb.AppendLine($"{p.D:yyyy-MM-dd},{p.Count}");

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", "report.csv");
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