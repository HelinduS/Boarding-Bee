using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Models;
using BoardingBee_backend.Controllers.Dto;

using BoardingBee_backend.Services.Notifications;
namespace BoardingBee_backend.Controllers
{
    [ApiController]
    [Route("api/listings")]
    // Handles CRUD operations for property listings, including creation, retrieval, update & reviews.
    public class ListingsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly Services.ListingService _listingService;

        private const string OwnerRole = "OWNER";
        private const string AdminRole = "ADMIN";

        public ListingsController(AppDbContext context, Services.ListingService listingService)
        {
            _context = context;
            _listingService = listingService;
        }

        // ----------------- Helpers -----------------

        private string? GetUserRole() =>
            User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("roles");

        private int? GetUserId()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                        User.FindFirstValue("id") ??
                        User.FindFirstValue("userId") ??
                        User.FindFirstValue(ClaimTypes.Name);
            return int.TryParse(idStr, out var id) ? id : (int?)null;
        }

        // ----------------- Image Retrieval -----------------

        // GET: api/listings/{listingId}/images/{imageId}
        [HttpGet("{listingId}/images/{imageId}")]
        public async Task<IActionResult> GetListingImage(int listingId, int imageId)
        {
            var image = await _context.Set<ListingImage>()
                .FirstOrDefaultAsync(img => img.Id == imageId && img.ListingId == listingId);
            if (image == null)
                return NotFound();
            return File(image.ImageData, image.ContentType ?? "image/jpeg");
        }

        // ----------------- Create (multipart/form-data) -----------------

        // POST: api/Listings  (OWNER only)
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateListing(
            [FromForm] string title,
            [FromForm] string location,
            [FromForm] decimal price,
            [FromForm] string description,
            [FromForm] string facilities,
            [FromForm] bool isAvailable,
            [FromForm] IFormFileCollection images)
        {
            var userRole = GetUserRole()?.ToUpperInvariant();
            var ownerId = GetUserId();
            if (userRole != OwnerRole || ownerId == null)
                return Forbid("Only owners can create listings.");

            if (string.IsNullOrWhiteSpace(title) ||
                string.IsNullOrWhiteSpace(location) ||
                price <= 0 ||
                string.IsNullOrWhiteSpace(description) ||
                images == null || images.Count == 0)
                return BadRequest("All required fields must be provided, and at least one image.");

            var result = await _listingService.CreateListingAsync(
                ownerId.Value, title, location, price, description, facilities, isAvailable, images);

            if (!result.Success)
                return BadRequest(result.Message);

            return Ok(new { message = result.Message, listingId = result.ListingId });
        }

        // ----------------- Create (JSON) -----------------

        // POST: api/Listings/json  (OWNER only)
        [HttpPost("json")]
        [Authorize]
        public async Task<IActionResult> CreateListingJson([FromBody] CreateListingRequest req)
        {
            var userRole = GetUserRole()?.ToUpperInvariant();
            var ownerId = GetUserId();
            if (userRole != OwnerRole || ownerId == null)
                return Forbid("Only owners can create listings.");

            if (string.IsNullOrWhiteSpace(req.Title) ||
                string.IsNullOrWhiteSpace(req.Location) ||
                req.Price <= 0 ||
                string.IsNullOrWhiteSpace(req.Description))
                return BadRequest("Title, location, price, and description are required.");

            var listing = new Listing
            {
                Title = req.Title,
                Location = req.Location,
                Price = req.Price,
                Description = req.Description,
                Facilities = req.Facilities,
                IsAvailable = string.Equals(req.Availability, "Available", StringComparison.OrdinalIgnoreCase),
                AmenitiesCsv = (req.Amenities is { Length: > 0 }) ? string.Join(",", req.Amenities) : null,
                OwnerId = ownerId,
                Status = ListingStatus.Pending,
                ExpiresAt = DateTime.UtcNow.AddMonths(6),
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            _context.Listings.Add(listing);
            await _context.SaveChangesAsync();

            // Activity log: owner created listing
            await _context.ActivityLogs.AddAsync(new ActivityLog { Kind = ActivityKind.ListingCreate, ActorUserId = ownerId, ListingId = listing.Id });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Listing created successfully.", listingId = listing.Id });
        }

        // ----------------- Read (list + detail) -----------------

        // GET: api/Listings (public, with filters)
        [HttpGet]
        public async Task<IActionResult> GetListings(
            [FromQuery] string? location,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var (total, listings) = await _listingService.BrowseListingsAsync(location, minPrice, maxPrice, page, pageSize);
            var listingDtos = listings.Select(BoardingBee_backend.Controllers.Dto.ListingMappings.ToListItemDto).ToList();
            return Ok(new { total, listings = listingDtos });
        }

        // GET: api/Listings/{id} (public)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetListing(int id)
        {
            var listing = await _listingService.GetListingAsync(id);
            if (listing == null) return NotFound();
            var dto = BoardingBee_backend.Controllers.Dto.ListingMappings.ToDetailDto(listing);
            // populate owner info if available
            if (listing.OwnerId.HasValue)
            {
                var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == listing.OwnerId.Value);
                if (user != null)
                {
                    dto.OwnerName = string.IsNullOrWhiteSpace(user.FirstName) && string.IsNullOrWhiteSpace(user.LastName)
                        ? user.Username
                        : $"{user.FirstName} {user.LastName}".Trim();
                    dto.OwnerAvatar = user.ProfileImage != null ? $"/api/users/{user.Id}/profile-image" : dto.OwnerAvatar;
                    // prefer listing contact email if present, otherwise user's email
                    if (string.IsNullOrWhiteSpace(dto.ContactEmail) && !string.IsNullOrWhiteSpace(user.Email))
                        dto.ContactEmail = user.Email;
                }
            }
            return Ok(dto);
        }

        // ----------------- Update -----------------

        // PUT: api/Listings/{id} (OWNER only)
        [HttpPut("{id}")]
        [Authorize]
        [Consumes("multipart/form-data", "application/json")]
        public async Task<IActionResult> UpdateListing(int id)
        {
            var userRole = GetUserRole()?.ToUpperInvariant();
            var userId = GetUserId();
            // Only allow update if user is owner of listing
            var listing = await _listingService.GetListingAsync(id);
            if (listing == null) return NotFound();
            if (userRole != OwnerRole || userId == null || listing.OwnerId != userId)
                return Forbid("You cannot edit another owner's listing.");

            if (Request.HasFormContentType)
            {
                var form = await Request.ReadFormAsync();
                var result = await _listingService.UpdateListingAsync(id, l => {
                    l.Title = form["title"];
                    l.Location = form["location"];
                    l.Price = decimal.TryParse(form["price"], out var price) ? price : l.Price;
                    l.Description = form["description"];
                    l.Facilities = form["facilities"];
                    l.ContactPhone = form["contactPhone"];
                    l.ContactEmail = form["contactEmail"];
                    l.IsAvailable = string.Equals(form["availability"], "Available", StringComparison.OrdinalIgnoreCase);
                    var amenities = form["amenities"].FirstOrDefault();
                    l.AmenitiesCsv = !string.IsNullOrWhiteSpace(amenities) ? amenities : l.AmenitiesCsv;
                    // (Image handling omitted for brevity, should be moved to service for full refactor)
                });
                if (!result.Success) return BadRequest(result.Message);
                return Ok(new { message = result.Message });
            }
            else
            {
                var req = await System.Text.Json.JsonSerializer.DeserializeAsync<Controllers.Dto.UpdateListingRequest>(
                    Request.Body,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (req == null) return BadRequest("Invalid request body.");
                var result = await _listingService.UpdateListingAsync(id, l => {
                    l.Title = req.Title;
                    l.Location = req.Location;
                    l.Price = req.Price;
                    l.Description = req.Description;
                    l.Facilities = req.Facilities;
                    l.ContactPhone = req.ContactPhone;
                    l.ContactEmail = req.ContactEmail;
                    l.AmenitiesCsv = (req.Amenities is { Length: > 0 }) ? string.Join(",", req.Amenities) : l.AmenitiesCsv;
                    l.IsAvailable = string.Equals(req.Availability, "Available", StringComparison.OrdinalIgnoreCase);
                });
                if (!result.Success) return BadRequest(result.Message);
                return Ok(new { message = result.Message });
            }
        }

        // ----------------- Delete -----------------

        // DELETE: api/Listings/{id} (OWNER only)
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteListing(int id)
        {
            var userRole = GetUserRole()?.ToUpperInvariant();
            var userId = GetUserId();
            var result = await _listingService.DeleteListingAsync(id, userId, userRole);
            if (!result.Success && result.Message == "Listing not found.") return NotFound();
            if (!result.Success) return Forbid(result.Message);
            return NoContent();
        }

        // ----------------- Test-only cleanup endpoint -----------------
        // POST: api/Listings/test/cleanup
        // Body: { "prefix": "E2E" }
        // Requires header X-TEST-KEY matching environment variable TEST_API_KEY
        [HttpPost("test/cleanup")]
        [AllowAnonymous]
        public async Task<IActionResult> CleanupTestListings([FromBody] CleanupRequest? req)
        {
            var testKey = Environment.GetEnvironmentVariable("TEST_API_KEY");
            var provided = Request.Headers["X-TEST-KEY"].FirstOrDefault();
            if (string.IsNullOrEmpty(testKey) || provided != testKey)
            {
                return Forbid("Test cleanup disabled or invalid key.");
            }

            var prefix = req?.Prefix ?? "E2E";
            var q = _context.Listings.Where(l => l.Title != null && l.Title.Contains(prefix));
            var toDelete = await q.ToListAsync();
            if (toDelete.Count == 0) return Ok(new { deleted = 0 });
            _context.Listings.RemoveRange(toDelete);
            await _context.SaveChangesAsync();
            return Ok(new { deleted = toDelete.Count });
        }

        public record CleanupRequest(string? Prefix);

        // ----------------- Owner's listings -----------------

        // GET: api/Listings/owner/{ownerId}
        [HttpGet("owner/{ownerId}")]
        public async Task<IActionResult> GetListingsByOwner(int ownerId)
        {
            var listings = await _listingService.GetListingsByOwnerAsync(ownerId);
            var listingDtos = listings.Select(BoardingBee_backend.Controllers.Dto.ListingMappings.ToListItemDto).ToList();
            return Ok(new { total = listingDtos.Count, listings = listingDtos });
        }

        // ----------------- Renew -----------------

        // POST: api/Listings/{id}/renew (OWNER only)
        [HttpPost("{id}/renew")]
        [Authorize]
        public async Task<IActionResult> RenewListing(int id)
        {
            var userRole = GetUserRole()?.ToUpperInvariant();
            var userId = GetUserId();
            var result = await _listingService.RenewListingAsync(id, userId, userRole);
            if (!result.Success && result.Message == "Listing not found.") return NotFound();
            if (!result.Success) return Forbid(result.Message);
            return Ok(new { message = result.Message });
        }

        // ======================= REVIEWS REGION =======================

        // GET: /api/Listings/{id}/reviews?sort=recent&page=1&pageSize=10
        [HttpGet("{id:int}/reviews")]
        public async Task<ActionResult<PagedResult<ReviewResponseDto>>> GetReviews(
            int id,
            [FromQuery] string sort = "recent",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 10;

            var q = _context.Reviews
                .AsNoTracking()
                .Where(r => r.ListingId == id);

            q = sort == "top"
                ? q.OrderByDescending(r => r.Rating).ThenByDescending(r => r.CreatedAt)
                : q.OrderByDescending(r => r.CreatedAt);

            var total = await q.CountAsync();
            var items = await q.Skip((page - 1) * pageSize).Take(pageSize)
                .Select(r => new ReviewResponseDto
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    Username = r.User != null ? r.User.Username : null,
                    Rating = r.Rating,
                    Text = r.Text,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return Ok(new PagedResult<ReviewResponseDto>
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize
            });
        }

        // GET: /api/Listings/{id}/reviews/summary
        [HttpGet("{id:int}/reviews/summary")]
        public async Task<ActionResult<RatingSummaryDto>> GetReviewSummary(int id)
        {
            var ratings = await _context.Reviews
                .AsNoTracking()
                .Where(r => r.ListingId == id)
                .Select(r => r.Rating)
                .ToListAsync();

            var dto = new RatingSummaryDto();
            dto.Count = ratings.Count;
            if (dto.Count > 0)
            {
                dto.Average = Math.Round(ratings.Average(), 2);
                foreach (var r in ratings)
                    dto.Histogram[r] = dto.Histogram.GetValueOrDefault(r) + 1;
            }
            return Ok(dto);
        }

        // POST: /api/Listings/{id}/reviews
        [HttpPost("{id:int}/reviews")]
        [Authorize]
        public async Task<ActionResult<ReviewResponseDto>> CreateOrUpdateReview(
            int id, [FromBody] CreateReviewDto dto)
        {
            if (dto == null || dto.Rating < 1 || dto.Rating > 5)
                return BadRequest("Rating must be 1-5.");

            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var listing = await _context.Listings.FirstOrDefaultAsync(l => l.Id == id);
            if (listing == null) return NotFound("Listing not found.");

            // Optional rule: prevent owners reviewing own listing
            if (listing.OwnerId.HasValue && listing.OwnerId.Value == userId.Value)
                return Forbid();

            var review = await _context.Reviews
                .FirstOrDefaultAsync(r => r.ListingId == id && r.UserId == userId.Value);

            if (review == null)
            {
                review = new Review
                {
                    ListingId = id,
                    UserId = userId.Value,
                    Rating = dto.Rating,
                    Text = string.IsNullOrWhiteSpace(dto.Text) ? null : dto.Text.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Reviews.Add(review);
            }
            else
            {
                review.Rating = dto.Rating;
                review.Text = string.IsNullOrWhiteSpace(dto.Text) ? null : dto.Text.Trim();
                review.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        // ================== Activity + Email (added, non-breaking) ==================
        int? actorUserId = null;
        var uid = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(uid ?? "", out var parsed)) actorUserId = parsed;

        await _context.ActivityLogs.AddAsync(new BoardingBee_backend.Models.ActivityLog
        {
            Kind = BoardingBee_backend.Models.ActivityKind.ListingUpdate,
            ActorUserId = actorUserId,
            ListingId = listing.Id
        });
        await _context.SaveChangesAsync();

        if (listing.OwnerId.HasValue)
        {
            var notify = HttpContext.RequestServices
                .GetRequiredService<BoardingBee_backend.Services.Notifications.NotificationService>();

            await notify.QueueAndSendAsync(
                BoardingBee_backend.Models.NotificationType.ListingUpdated,
                listing.OwnerId.Value,
                subject: "Your listing was updated",
                body: $"Listing '{listing.Title}' has been updated.",
                linkUrl: $"https://your-frontend/listings/{listing.Id}",
                listingId: listing.Id
            );
        }
        // ================== /Activity + Email ==================

            await RecomputeListingAggregates(id);

            return Ok(new ReviewResponseDto
            {
                Id = review.Id,
                UserId = review.UserId,
                Username = null,
                Rating = review.Rating,
                Text = review.Text,
                CreatedAt = review.CreatedAt
            });
        }

        // DELETE: /api/Listings/{id}/reviews/{reviewId}
        // Owner of review can delete; ADMIN can delete any
        [HttpDelete("{id:int}/reviews/{reviewId:int}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(int id, int reviewId)
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var role = GetUserRole()?.ToUpperInvariant();
            var isAdmin = role == AdminRole;

            var review = await _context.Reviews
                .FirstOrDefaultAsync(r => r.Id == reviewId && r.ListingId == id);
            if (review == null) return NotFound();

            if (!isAdmin && review.UserId != userId.Value)
                return Forbid();

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();
            await RecomputeListingAggregates(id);

            return NoContent();
        }

        // Keep Listing.Rating (average) and ReviewCount in sync
        private async Task RecomputeListingAggregates(int listingId)
        {
            var ratings = await _context.Reviews
                .Where(r => r.ListingId == listingId)
                .Select(r => r.Rating)
                .ToListAsync();

            var listing = await _context.Listings.FirstAsync(l => l.Id == listingId);
            listing.ReviewCount = ratings.Count;
            listing.Rating = ratings.Count == 0 ? 0 : Math.Round(ratings.Average(), 2);
            listing.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
        // ===================== END REVIEWS REGION =====================
    }
}
