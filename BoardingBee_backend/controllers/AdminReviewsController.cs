using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Models;
using BoardingBee_backend.Controllers.Dto;

namespace BoardingBee_backend.Controllers
{
    [ApiController]
    [Route("api/admin/reviews")]
    [Authorize(Roles = "ADMIN")]
    public class AdminReviewsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public AdminReviewsController(AppDbContext db) { _db = db; }

        // GET: /api/admin/reviews?page=1&pageSize=50
        [HttpGet]
        public async Task<IActionResult> GetAllReviews([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 1000) pageSize = 50;

            var q = _db.Reviews.AsNoTracking()
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new AdminReviewDto {
                    Id = r.Id,
                    ListingId = r.ListingId,
                    ListingTitle = r.Listing != null ? r.Listing.Title : null,
                    ListingLocation = r.Listing != null ? r.Listing.Location : null,
                    UserId = r.UserId,
                    UserEmail = r.User != null ? r.User.Email : null,
                    ReviewerName = r.User != null ? (string.IsNullOrWhiteSpace(r.User.FirstName) && string.IsNullOrWhiteSpace(r.User.LastName) ? r.User.Username : (r.User.FirstName + " " + r.User.LastName).Trim()) : null,
                    Rating = r.Rating,
                    Comment = r.Text,
                    CreatedAt = r.CreatedAt
                });

            var total = await q.CountAsync();
            var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            return Ok(new PagedResult<AdminReviewDto> {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize
            });
        }
    }
}
