using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
// Update the namespace below to the correct one where AppDbContext is defined
using BoardingBee_backend.Models; // Replace 'Models' with the actual namespace containing AppDbContext

namespace BoardingBee_backend.Controllers
{
    [ApiController, Route("api/admin/activity")]
    public class AdminActivityController : ControllerBase
    {
        private readonly AppDbContext _db;
        public AdminActivityController(AppDbContext db) { _db = db; }

        [HttpGet("recent")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Recent([FromQuery] int limit=50)
        {
            // Return activity rows with actor email and listing title for the admin UI
            var items = await (
                from a in _db.ActivityLogs.AsNoTracking()
                join u in _db.Users.AsNoTracking() on a.ActorUserId equals u.Id into au
                from u in au.DefaultIfEmpty()
                join l in _db.Listings.AsNoTracking() on a.ListingId equals l.Id into al
                from l in al.DefaultIfEmpty()
                orderby a.At descending
                select new {
                    id = a.Id,
                    at = a.At,
                    kind = a.Kind.ToString(),
                    actorUserId = a.ActorUserId,
                    actorEmail = u != null ? u.Email : null,
                    actorUsername = u != null ? u.Username : null,
                    listingId = a.ListingId,
                    listingTitle = l != null ? l.Title : null,
                    meta = a.Meta
                }
            ).Take(limit).ToListAsync();

            return Ok(items);
        }
    }
}
