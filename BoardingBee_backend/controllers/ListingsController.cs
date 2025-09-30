using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using BoardingBee_backend.Models;
using BoardingBee_backend.models;
using BoardingBee_backend.Controllers.Dto;

namespace BoardingBee_backend.controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // Handles CRUD operations for property listings, including creation, retrieval, and update.
    // Only users with OWNER role can create or modify listings.
    public class ListingsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private const string OwnerRole = "OWNER";
    // Constructor injecting the database context.
        public ListingsController(AppDbContext context)
        {
            _context = context;
        }

        // Helper: Extract user role robustly
    // Extracts the user's role from claims.
        private string? GetUserRole() =>
            User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirstValue("roles");

    // Extracts the user's ID from claims.
        private int? GetUserId()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(idStr, out var id) ? id : (int?)null;
        }

    // Creates a new property listing (OWNER only, form-data).
    // Validates input, saves images, and stores listing in the database.
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateListing([
            FromForm] string title,
            [FromForm] string location,
            [FromForm] decimal price,
            [FromForm] string description,
            [FromForm] string facilities,
            [FromForm] bool isAvailable,
            [FromForm] IFormFileCollection images)
        {
            var userRole = GetUserRole()?.ToUpperInvariant();
            var ownerId = GetUserId();
            // Only owners can create listings
            if (userRole != OwnerRole || ownerId == null)
                return Forbid("Only owners can create listings.");
            // Validate required fields and at least one image
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
                // Validate image extension and size
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
                Facilities = facilities,
                IsAvailable = isAvailable,
                ImagesCsv = string.Join(",", imageUrls),
                ThumbnailUrl = imageUrls.FirstOrDefault(),
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

        // POST: api/listings/json (JSON body, OWNER only)
        [HttpPost("json")]
        [Authorize]
        public async Task<IActionResult> CreateListingJson([FromBody] CreateListingRequest req)
        {
            var userRole = GetUserRole()?.ToUpperInvariant();
            var ownerId = GetUserId();
            if (userRole != OwnerRole || ownerId == null)
                return Forbid("Only owners can create listings.");
            if (string.IsNullOrWhiteSpace(req.Title) || string.IsNullOrWhiteSpace(req.Location) || req.Price <= 0 || string.IsNullOrWhiteSpace(req.Description))
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

        // GET: api/listings (public, with filters)
        [HttpGet]
        public async Task<IActionResult> GetListings([
            FromQuery] string? location,
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
            var listingDtos = listings.Select(BoardingBee_backend.Controllers.Dto.ListingMappings.ToListItemDto).ToList();
            return Ok(new { total, listings = listingDtos });
        }

        // GET: api/listings/{id} (public)
        [HttpGet("{id}")]
    public async Task<IActionResult> GetListing(int id)
        {
            var listing = await _context.Listings.FindAsync(id);
            if (listing == null) return NotFound();
            // Return ListingDetailDto so images are always an array
            var dto = BoardingBee_backend.Controllers.Dto.ListingMappings.ToDetailDto(listing);
            return Ok(dto);
        }

        // PUT: api/listings/{id} (OWNER only)
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

            // Check content type
            if (Request.HasFormContentType)
            {
                // Handle multipart/form-data (with images)
                var form = await Request.ReadFormAsync();
                listing.Title = form["title"];
                listing.Location = form["location"];
                listing.Price = decimal.TryParse(form["price"], out var price) ? price : listing.Price;
                listing.Description = form["description"];
                listing.Facilities = form["facilities"];
                listing.ContactPhone = form["contactPhone"];
                listing.ContactEmail = form["contactEmail"];
                listing.IsAvailable = string.Equals(form["availability"], "Available", StringComparison.OrdinalIgnoreCase);
                // Handle amenities
                var amenities = form["amenities"].FirstOrDefault();
                listing.AmenitiesCsv = !string.IsNullOrWhiteSpace(amenities) ? amenities : listing.AmenitiesCsv;
                // Handle images
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                var env = HttpContext.RequestServices.GetService(typeof(IWebHostEnvironment)) as IWebHostEnvironment;
                var root = Path.Combine(env?.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "listings");
                Directory.CreateDirectory(root);
                // Parse current images
                var currentImages = (listing.ImagesCsv ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList();
                // Remove images if requested
                var removedImagesRaw = form["removedImages"].FirstOrDefault();
                if (!string.IsNullOrWhiteSpace(removedImagesRaw))
                {
                    var toRemove = removedImagesRaw.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToHashSet();
                    currentImages = currentImages.Where(url => !toRemove.Contains(url)).ToList();
                }
                // Add new images
                var newImageUrls = new List<string>();
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
                // Update images list only if changed
                var allImages = currentImages.Concat(newImageUrls).ToList();
                if ((!string.IsNullOrWhiteSpace(removedImagesRaw)) || newImageUrls.Count > 0) {
                    listing.ImagesCsv = allImages.Count > 0 ? string.Join(",", allImages) : null;
                    listing.ThumbnailUrl = allImages.FirstOrDefault() ?? null;
                } else {
                    // No image changes, keep existing ImagesCsv and ThumbnailUrl
                }
            }
            else
            {
                // Handle JSON body
                var req = await System.Text.Json.JsonSerializer.DeserializeAsync<Controllers.Dto.UpdateListingRequest>(Request.Body, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
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

        // DELETE: api/listings/{id} (OWNER only)
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

        // POST: api/listings/{id}/renew (OWNER only)
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
    }
}
