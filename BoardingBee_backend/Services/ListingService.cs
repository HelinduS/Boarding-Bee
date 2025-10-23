using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Models;
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

            // Activity log: owner created listing
            await _context.ActivityLogs.AddAsync(new ActivityLog { Kind = ActivityKind.ListingCreate, ActorUserId = ownerId, ListingId = listing.Id });
            await _context.SaveChangesAsync();
            return (true, "Listing created successfully.", listing.Id);
        }

        // Browse listings with filters and pagination
        public async Task<(int Total, List<Listing> Listings)> BrowseListingsAsync(string? location, decimal? minPrice, decimal? maxPrice, int page = 1, int pageSize = 10)
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
            return (total, listings);
        }

        // Get a single listing by ID
        public async Task<Listing?> GetListingAsync(int id)
        {
            return await _context.Listings.FindAsync(id);
        }

        // Update listing (form or JSON)
        public async Task<(bool Success, string Message)> UpdateListingAsync(int id, Action<Listing> updateAction)
        {
            var listing = await _context.Listings.FirstOrDefaultAsync(l => l.Id == id);
            if (listing == null) return (false, "Listing not found.");
            updateAction(listing);
            listing.LastUpdated = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return (true, "Listing updated successfully.");
        }

        // Delete listing
        public async Task<(bool Success, string Message)> DeleteListingAsync(int id, int? userId, string? userRole)
        {
            var listing = await _context.Listings.FirstOrDefaultAsync(l => l.Id == id);
            if (listing == null) return (false, "Listing not found.");
            if (userRole != null && userRole != "OWNER" && userRole != "ADMIN")
                return (false, "You cannot delete another owner's listing.");
            if (userRole == "OWNER" && (userId == null || listing.OwnerId != userId))
                return (false, "You cannot delete another owner's listing.");
            _context.Listings.Remove(listing);
            await _context.SaveChangesAsync();

            // Activity log: listing deleted
            try
            {
                await _context.ActivityLogs.AddAsync(new ActivityLog { Kind = ActivityKind.ListingDelete, ActorUserId = userId, ListingId = id });
                await _context.SaveChangesAsync();
            }
            catch { /* don't block deletion on logging errors */ }
            return (true, "Listing deleted.");
        }

        // Get listings by owner
        public async Task<List<Listing>> GetListingsByOwnerAsync(int ownerId)
        {
            return await _context.Listings
                .Where(l => l.OwnerId == ownerId)
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();
        }

        // Renew listing
        public async Task<(bool Success, string Message)> RenewListingAsync(int id, int? userId, string? userRole)
        {
            var listing = await _context.Listings.FirstOrDefaultAsync(l => l.Id == id);
            if (listing == null) return (false, "Listing not found.");
            if (userRole != null && userRole != "OWNER" && userRole != "ADMIN")
                return (false, "You cannot renew another owner's listing.");
            if (userRole == "OWNER" && (userId == null || listing.OwnerId != userId))
                return (false, "You cannot renew another owner's listing.");
            listing.ExpiresAt = DateTime.UtcNow.AddMonths(6);
            listing.Status = ListingStatus.Approved;
            listing.LastUpdated = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return (true, "Listing renewed successfully.");
        }
    }
}
