using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Models;
using BoardingBee_backend.Services.Notifications;

namespace BoardingBee_backend.Controllers
{
    [ApiController, Route("api/admin/listings")]
    public class AdminListingsController : ControllerBase
    {
        private readonly AppDbContext _db; private readonly NotificationService _notify;
        public AdminListingsController(AppDbContext db, NotificationService notify) { _db = db; _notify = notify; }

        [HttpGet("pending")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Pending([FromQuery] int page=1, [FromQuery] int pageSize=20)
        {
            var q = _db.Listings.AsNoTracking().Where(l => l.Status == ListingStatus.Pending).OrderByDescending(l => l.CreatedAt);
            var total = await q.CountAsync();
            var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
            return Ok(new { total, items });
        }

        public record ActionDto(int ListingId, string? Reason);

        [HttpPost("approve")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Approve([FromBody] ActionDto dto)
        {
            var listing = await _db.Listings.FirstOrDefaultAsync(l => l.Id == dto.ListingId);
            if (listing == null) return NotFound();

            listing.Status = ListingStatus.Approved;
            await _db.SaveChangesAsync();

            await _db.ActivityLogs.AddAsync(new ActivityLog { Kind = ActivityKind.ListingApprove, ListingId = listing.Id });
            await _db.SaveChangesAsync();

            if (listing.OwnerId.HasValue)
            {
                try
                {
                    await _notify.QueueAndSendAsync(NotificationType.ListingApproved, listing.OwnerId.Value,
                        "Listing approved", $"Your listing '{listing.Title}' was approved.",
                        $"https://your-frontend/listings/{listing.Id}", listingId: listing.Id);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Notification failed: " + ex.Message);
                    // swallow notification errors to keep admin flow resilient
                }
            }

            return Ok(new { ok = true });
        }

        [HttpPost("reject")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Reject([FromBody] ActionDto dto)
        {
            var listing = await _db.Listings.FirstOrDefaultAsync(l => l.Id == dto.ListingId);
            if (listing == null) return NotFound();

            // Mark listing as rejected and persist
            listing.Status = ListingStatus.Rejected;
            await _db.SaveChangesAsync();

            // Record activity with optional reason
            await _db.ActivityLogs.AddAsync(new ActivityLog { Kind = ActivityKind.ListingReject, ListingId = listing.Id, Meta = dto.Reason });
            await _db.SaveChangesAsync();

            if (listing.OwnerId.HasValue)
            {
                try
                {
                    await _notify.QueueAndSendAsync(NotificationType.ListingRejected, listing.OwnerId.Value,
                        "Listing needs changes", $"Your listing '{listing.Title}' needs updates. Reason: {dto.Reason}",
                        $"https://your-frontend/edit-listing/{listing.Id}", listingId: listing.Id);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Notification failed: " + ex.Message);
                }
            }

            return Ok(new { ok = true });
        }
    }
}
