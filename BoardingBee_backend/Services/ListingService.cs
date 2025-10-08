using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Models;
using BoardingBee_backend.models;
using BoardingBee_backend.Controllers.Dto;

namespace BoardingBee_backend.Services
{
    public class ListingService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;
        public ListingService(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        public async Task<(bool Success, string Message, int? ListingId)> CreateListingAsync(int ownerId, string title, string location, decimal price, string description, string facilities, bool isAvailable, IFormFileCollection images)
        {
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var imageUrls = new List<string>();
            var root = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "listings");
            Directory.CreateDirectory(root);
            foreach (var file in images)
            {
                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(ext))
                    return (false, $"Unsupported image format: {ext}", null);
                if (file.Length > 5 * 1024 * 1024)
                    return (false, "Image size must be under 5MB.", null);
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
            return (true, "Listing created successfully.", listing.Id);
        }

        // Add similar methods for update, delete, fetch, renew, etc.
    }
}
