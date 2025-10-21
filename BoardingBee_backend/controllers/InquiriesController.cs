using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using BoardingBee_backend.Models;
using BoardingBee_backend.Services.Notifications;

namespace BoardingBee_backend.Controllers
{
    [ApiController, Route("api/inquiries")]
    public class InquiriesController : ControllerBase
    {
        private readonly AppDbContext _db; private readonly NotificationService _notify;
        public InquiriesController(AppDbContext db, NotificationService notify) { _db = db; _notify = notify; }

        public record CreateDto(int ListingId, string Message);

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateDto dto)
        {
            var listing = await _db.Listings.AsNoTracking().FirstOrDefaultAsync(l => l.Id == dto.ListingId);
            if (listing == null) return NotFound("Listing not found");

            int? userId = int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : (int?)null;

            var inq = new Inquiry { ListingId = dto.ListingId, FromUserId = userId, Message = dto.Message };
            _db.Inquiries.Add(inq);
            await _db.SaveChangesAsync();

            await _db.ActivityLogs.AddAsync(new ActivityLog { Kind = ActivityKind.InquiryCreate, ActorUserId = userId, ListingId = dto.ListingId, InquiryId = inq.Id });
            await _db.SaveChangesAsync();

            if (listing.OwnerId.HasValue)
                await _notify.QueueAndSendAsync(NotificationType.NewInquiry, listing.OwnerId.Value,
                    "New inquiry on your listing", dto.Message,
                    $"https://your-frontend/listings/{listing.Id}?tab=inquiries", listingId: listing.Id, inquiryId: inq.Id);

            return Ok(new { inq.Id });
        }
    }
}
