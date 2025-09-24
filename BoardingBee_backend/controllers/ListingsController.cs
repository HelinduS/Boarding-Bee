using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Controllers.Dto;     // ListingListItemDto, ListingDetailDto, Create/Update requests, ListingMappings
using BoardingBee_backend.models;
using BoardingBee_backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace BoardingBee_backend.controllers
{
    [ApiController]
    [Route("api/[controller]")]
    

    public class ListingsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ListingsController(AppDbContext context)
        {
            _context = context;
        }
        // POST: api/listings
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
            // Auth check
            var userRole = User.FindFirstValue("role")?.ToUpperInvariant();
            if (userRole != "OWNER")
                return Forbid("Only owners can create listings.");

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out var ownerId))
                return Unauthorized("Invalid user context.");


            if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(location) || price <= 0 || string.IsNullOrWhiteSpace(description) || images == null || images.Count == 0)
                return BadRequest("All required fields must be provided, and at least one image.");


            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var imageUrls = new List<string>();
            var env = HttpContext.RequestServices.GetService(typeof(IWebHostEnvironment)) as IWebHostEnvironment;
            var root = Path.Combine(env?.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "listings");
            Directory.CreateDirectory(root);

            foreach (var file in images)
            {
                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(ext))
                    return BadRequest($"Unsupported image format: {ext}");
                if (file.Length > 5 * 1024 * 1024)
                    return BadRequest("Image size must be under 5MB.");

                var fileName = $"l{ownerId}_{Guid.NewGuid():N}{ext}";
                var path = Path.Combine(root, fileName);
                using (var stream = System.IO.File.Create(path))
                {
                    await file.CopyToAsync(stream);
                }
                imageUrls.Add($"/uploads/listings/{fileName}");
            }

            var listing = new Listing
            {
                Title = title,
                Location = location,
                Price = price,
                Description = description,
                IsAvailable = isAvailable,
                ThumbnailUrl = imageUrls.FirstOrDefault(),
                CreatedAt = DateTime.UtcNow,

            _context.Listings.Add(listing);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to create listing: {ex.Message}");
            }
            return Ok(new { message = "Listing created successfully.", listingId = listing.Id });
        }

        // GET: api/listings?location=...&minPrice=...&maxPrice=...&page=1&pageSize=10
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

            return Ok(new { total, listings });
        }

        // GET: api/listings/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetListing(int id)
        {
            var listing = await _context.Listings.FindAsync(id);
            if (listing == null) return NotFound();
            return Ok(listing);
        }

        // Auto-expire listings when ExpiresAt has passed
        private async Task AutoExpireAsync()
        {
            var now = DateTime.UtcNow;
            var toExpire = await _context.Listings
                .Where(l => l.Status != ListingStatus.Expired && l.ExpiresAt < now)
                .ToListAsync();

            if (toExpire.Count > 0)
            {
                foreach (var l in toExpire) l.Status = ListingStatus.Expired;
                await _context.SaveChangesAsync();
            }
        }

        // GET: api/listings/owner/{ownerId}?page=1&pageSize=10&status=Approved|Pending|Expired
        [HttpGet("owner/{ownerId:int}")]
        public async Task<IActionResult> GetOwnerListings(
            int ownerId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = null)
        {
            await AutoExpireAsync();

            var query = _context.Listings.AsNoTracking().Where(l => l.OwnerId == ownerId);

            if (!string.IsNullOrWhiteSpace(status) &&
                Enum.TryParse<ListingStatus>(status, true, out var parsed))
            {
                query = query.Where(l => l.Status == parsed);
            }

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(l => l.LastUpdated == default ? l.CreatedAt : l.LastUpdated)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var dto = items.Select(ListingMappings.ToListItemDto).ToList();

            var counts = await _context.Listings
                .Where(l => l.OwnerId == ownerId)
                .GroupBy(l => l.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            return Ok(new
            {
                total,
                page,
                pageSize,
                data = dto,
                summary = new
                {
                    totalAll = await _context.Listings.CountAsync(l => l.OwnerId == ownerId),
                    approved = counts.FirstOrDefault(c => c.Status == ListingStatus.Approved)?.Count ?? 0,
                    pending = counts.FirstOrDefault(c => c.Status == ListingStatus.Pending)?.Count ?? 0,
                    expired = counts.FirstOrDefault(c => c.Status == ListingStatus.Expired)?.Count ?? 0
                }
            });
        }

        // POST: api/listings/json  (JSON create; your existing [HttpPost] with form-data stays)
        [HttpPost("json")]
        [Authorize]
        public async Task<IActionResult> CreateListingJson([FromBody] CreateListingRequest req)
        {
            var userRole = User.FindFirstValue("role")?.ToUpperInvariant();
            if (userRole != "OWNER")
                return Forbid("Only owners can create listings.");

            int? ownerId = null;
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdStr, out var parsedOwner))
                ownerId = parsedOwner;

            if (string.IsNullOrWhiteSpace(req.Title) ||
                string.IsNullOrWhiteSpace(req.Location) ||
                req.Price <= 0 ||
                string.IsNullOrWhiteSpace(req.Description))
            {
                return BadRequest("Title, location, price, and description are required.");
            }

            var listing = new Listing
            {
                Title = req.Title,
                Location = req.Location,
                Price = req.Price, // decimal in entity; your DTO uses int and casts in mapper
                Description = req.Description,
                IsAvailable = string.Equals(req.Availability, "Available", StringComparison.OrdinalIgnoreCase),
                AvailabilityStatus = string.Equals(req.Availability, "Available", StringComparison.OrdinalIgnoreCase)
                    ? Availability.Available
                    : Availability.Occupied,
                ContactPhone = req.ContactPhone,
                ContactEmail = req.ContactEmail,
                AmenitiesCsv = (req.Amenities is { Length: > 0 }) ? string.Join(",", req.Amenities) : null,
                ImagesCsv = (req.Images is { Length: > 0 }) ? string.Join(",", req.Images) : null,
                ThumbnailUrl = req.Images?.FirstOrDefault(),
                OwnerId = ownerId,                       // nullable — safe with your mapper (?? 0)
                Status = ListingStatus.Pending,
                ExpiresAt = DateTime.UtcNow.AddMonths(6),
                LastUpdated = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.Listings.Add(listing);
            await _context.SaveChangesAsync();

            // Uses your external mapper (returns ListingDetailDto)
            return CreatedAtAction(nameof(GetListing), new { id = listing.Id }, ListingMappings.ToDetailDto(listing));
        }

        // PUT: api/listings/{id}
        [HttpPut("{id:int}")]
        [Authorize]
        public async Task<IActionResult> UpdateListing(int id, [FromBody] UpdateListingRequest req)
        {
            var listing = await _context.Listings.FirstOrDefaultAsync(l => l.Id == id);
            if (listing == null) return NotFound();

            // Ownership guard (owner can edit only own listing; admins bypass)
            var userRole = User.FindFirstValue("role")?.ToUpperInvariant();
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int.TryParse(userIdStr, out var currentUserId);
            if (userRole == "OWNER" && listing.OwnerId.HasValue && listing.OwnerId.Value != currentUserId)
                return Forbid("You cannot edit another owner's listing.");

            listing.Title = req.Title;
            listing.Location = req.Location;
            listing.Price = req.Price;
            listing.Description = req.Description;
            listing.ContactPhone = req.ContactPhone;
            listing.ContactEmail = req.ContactEmail;
            listing.AmenitiesCsv = (req.Amenities is { Length: > 0 }) ? string.Join(",", req.Amenities) : null;
            listing.ImagesCsv = (req.Images is { Length: > 0 }) ? string.Join(",", req.Images) : listing.ImagesCsv;
            listing.ThumbnailUrl = req.Images?.FirstOrDefault() ?? listing.ThumbnailUrl;
            listing.IsAvailable = string.Equals(req.Availability, "Available", StringComparison.OrdinalIgnoreCase);
            listing.AvailabilityStatus = listing.IsAvailable ? Availability.Available : Availability.Occupied;
            listing.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Uses your external mapper (returns ListingDetailDto)
            return Ok(ListingMappings.ToDetailDto(listing));
        }

        // DELETE: api/listings/{id}
        [HttpDelete("{id:int}")]
        [Authorize]
        public async Task<IActionResult> DeleteListing(int id)
        {
            var listing = await _context.Listings.FirstOrDefaultAsync(l => l.Id == id);
            if (listing == null) return NotFound();

            // Ownership guard (owner can delete only own listing; admins bypass)
            var userRole = User.FindFirstValue("role")?.ToUpperInvariant();
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int.TryParse(userIdStr, out var currentUserId);
            if (userRole == "OWNER" && listing.OwnerId.HasValue && listing.OwnerId.Value != currentUserId)
                return Forbid("You cannot delete another owner's listing.");

            _context.Listings.Remove(listing);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/listings/{id}/renew
        [HttpPost("{id:int}/renew")]
        [Authorize]
        public async Task<IActionResult> RenewListing(int id)
        {
            var listing = await _context.Listings.FirstOrDefaultAsync(l => l.Id == id);
            if (listing == null) return NotFound();

            // Ownership guard
            var userRole = User.FindFirstValue("role")?.ToUpperInvariant();
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int.TryParse(userIdStr, out var currentUserId);
            if (userRole == "OWNER" && listing.OwnerId.HasValue && listing.OwnerId.Value != currentUserId)
                return Forbid("You cannot renew another owner's listing.");

            listing.ExpiresAt = DateTime.UtcNow.AddMonths(6);
            listing.Status = ListingStatus.Approved;
            listing.LastUpdated = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Uses your external mapper (returns ListingListItemDto)
            return Ok(ListingMappings.ToListItemDto(listing));
        }

        // GET: api/listings/detail/{id}  (enriched shape for your Next.js detail page)
        [HttpGet("detail/{id:int}")]
        public async Task<IActionResult> GetListingDetail(int id)
        {
            var listing = await _context.Listings.FirstOrDefaultAsync(l => l.Id == id);
            if (listing == null) return NotFound();

            // Uses your external mapper (returns ListingDetailDto)
            return Ok(ListingMappings.ToDetailDto(listing));
        }
    }
}
