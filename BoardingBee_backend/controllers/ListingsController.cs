using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        public async Task<IActionResult> CreateListing([
            FromForm] string title,
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

            // Validation
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
                // Add more fields as needed
            };
            // Optionally: add OwnerId property to Listing and set it here

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
        public async Task<IActionResult> GetListings([FromQuery] string? location, [FromQuery] decimal? minPrice, [FromQuery] decimal? maxPrice, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
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
    }
}
