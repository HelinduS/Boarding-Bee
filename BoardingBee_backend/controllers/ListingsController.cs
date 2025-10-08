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
using BoardingBee_backend.models;
using BoardingBee_backend.Controllers.Dto;

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
                ImagesCsv = (req.Images is { Length: > 0 }) ? string.Join(",", req.Images) : null,
                ThumbnailUrl = req.Images?.FirstOrDefault(),
                OwnerId = ownerId,
                Status = ListingStatus.Pending,
                ExpiresAt = DateTime.UtcNow.AddMonths(6),
                CreatedAt = DateTime.UtcNow,
                LastUpdated = DateTime.UtcNow
            };

            _context.Listings.Add(listing);
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
            var query = _context.Listings.AsQueryable();

            if (!string.IsNullOrWhiteSpace(location))
                query = query.Where(l => l.Location.ToLower().Contains(location.ToLower()));
            if (minPrice.HasValue)
                query = query.Where(l => l.Price >= minPrice.Value);
            if (maxPrice.HasValue)
                query = query.Where(l => l.Price <= maxPrice.Value);

            query = query.OrderByDescending(l => l.CreatedAt);

            var total = await query.CountAsync();
            var listings = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            var listingDtos = listings
                .Select(BoardingBee_backend.Controllers.Dto.ListingMappings.ToListItemDto)
                .ToList();

            return Ok(new { total, listings = listingDtos });
        }

        // GET: api/Listings/{id} (public)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetListing(int id)
        {
            var listing = await _context.Listings.FindAsync(id);
            if (listing == null) return NotFound();

            var dto = BoardingBee_backend.Controllers.Dto.ListingMappings.ToDetailDto(listing);
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

            var listing = await _context.Listings.FirstOrDefaultAsync(l => l.Id == id);
            if (listing == null) return NotFound();

            if (userRole != OwnerRole || userId == null || listing.OwnerId != userId)
                return Forbid("You cannot edit another owner's listing.");

            if (Request.HasFormContentType)
            {
                // multipart/form-data with optional images
                var form = await Request.ReadFormAsync();

                listing.Title = form["title"];
                listing.Location = form["location"];
                listing.Price = decimal.TryParse(form["price"], out var price) ? price : listing.Price;
                listing.Description = form["description"];
                listing.Facilities = form["facilities"];
                listing.ContactPhone = form["contactPhone"];
                listing.ContactEmail = form["contactEmail"];
                listing.IsAvailable = string.Equals(form["availability"], "Available", StringComparison.OrdinalIgnoreCase);

                var amenities = form["amenities"].FirstOrDefault();
                listing.AmenitiesCsv = !string.IsNullOrWhiteSpace(amenities) ? amenities : listing.AmenitiesCsv;

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                var env = HttpContext.RequestServices.GetService(typeof(IWebHostEnvironment)) as IWebHostEnvironment;
                var root = Path.Combine(env?.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "listings");
                Directory.CreateDirectory(root);

                var currentImages = (listing.ImagesCsv ?? "")
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => s.Trim())
                    .ToList();

                var removedImagesRaw = form["removedImages"].FirstOrDefault();
                if (!string.IsNullOrWhiteSpace(removedImagesRaw))
                {
                    var toRemove = removedImagesRaw
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(s => s.Trim())
                        .ToHashSet(StringComparer.OrdinalIgnoreCase);

                    currentImages = currentImages.Where(url => !toRemove.Contains(url)).ToList();
                }

                var newImageUrls = new System.Collections.Generic.List<string>();
                foreach (var file in form.Files)
                {
                    if (file == null || file.Name != "images") continue;

                    var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                    if (!allowedExtensions.Contains(ext, StringComparer.OrdinalIgnoreCase))
                        return BadRequest($"Unsupported image format: {ext}");
                    if (file.Length > 5 * 1024 * 1024)
                        return BadRequest("Image size must be under 5MB.");

                    var fileName = $"l{userId}_{Guid.NewGuid():N}{ext}";
                    var path = Path.Combine(root, fileName);
                    using (var stream = System.IO.File.Create(path))
                    {
                        await file.CopyToAsync(stream);
                    }
                    newImageUrls.Add($"/uploads/listings/{fileName}");
                }

                var allImages = currentImages.Concat(newImageUrls).ToList();
                if ((!string.IsNullOrWhiteSpace(removedImagesRaw)) || newImageUrls.Count > 0)
                {
                    listing.ImagesCsv = allImages.Count > 0 ? string.Join(",", allImages) : null;
                    listing.ThumbnailUrl = allImages.FirstOrDefault() ?? null;
                }
            }
            else
            {
                // JSON body
                var req = await System.Text.Json.JsonSerializer.DeserializeAsync<Controllers.Dto.UpdateListingRequest>(
                    Request.Body,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (req == null) return BadRequest("Invalid request body.");

                listing.Title = req.Title;
                listing.Location = req.Location;
                listing.Price = req.Price;
                listing.Description = req.Description;
                listing.Facilities = req.Facilities;
                listing.ContactPhone = req.ContactPhone;
                listing.ContactEmail = req.ContactEmail;
                listing.AmenitiesCsv = (req.Amenities is { Length: > 0 }) ? string.Join(",", req.Amenities) : listing.AmenitiesCsv;
                listing.ImagesCsv = (req.Images is { Length: > 0 }) ? string.Join(",", req.Images) : listing.ImagesCsv;
                listing.ThumbnailUrl = req.Images?.FirstOrDefault() ?? listing.ThumbnailUrl;
                listing.IsAvailable = string.Equals(req.Availability, "Available", StringComparison.OrdinalIgnoreCase);
            }

            listing.LastUpdated = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Listing updated successfully." });
        }

        // ----------------- Delete -----------------

        // DELETE: api/Listings/{id} (OWNER only)
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteListing(int id)
        {
            var userRole = GetUserRole()?.ToUpperInvariant();
            var userId = GetUserId();

            var listing = await _context.Listings.FirstOrDefaultAsync(l => l.Id == id);
            if (listing == null) return NotFound();

            if (userRole != OwnerRole || userId == null || listing.OwnerId != userId)
                return Forbid("You cannot delete another owner's listing.");

            _context.Listings.Remove(listing);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ----------------- Owner's listings -----------------

        // GET: api/Listings/owner/{ownerId}
        [HttpGet("owner/{ownerId}")]
        public async Task<IActionResult> GetListingsByOwner(int ownerId)
        {
            var listings = await _context.Listings
                .Where(l => l.OwnerId == ownerId)
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();

            var listingDtos = listings
                .Select(BoardingBee_backend.Controllers.Dto.ListingMappings.ToListItemDto)
                .ToList();

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

            var listing = await _context.Listings.FirstOrDefaultAsync(l => l.Id == id);
            if (listing == null) return NotFound();

            if (userRole != OwnerRole || userId == null || listing.OwnerId != userId)
                return Forbid("You cannot renew another owner's listing.");

            listing.ExpiresAt = DateTime.UtcNow.AddMonths(6);
            listing.Status = ListingStatus.Approved;
            listing.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Listing renewed successfully." });
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
