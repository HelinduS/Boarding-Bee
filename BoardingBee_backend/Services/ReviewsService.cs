using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Models;
using BoardingBee_backend.Models;
using BoardingBee_backend.Controllers.Dto;

namespace BoardingBee_backend.Services
{
    /// One-stop service for Reviews: writes (create/update/delete + recompute)
    /// and reads (paged list + rating summary).
    public class ReviewsService
    {
        private readonly AppDbContext _db;
        public ReviewsService(AppDbContext db) => _db = db;

        // ---------- WRITE ----------
        public async Task<Review> CreateOrUpdateAsync(int listingId, int userId, int rating, string? text)
        {
            var listing = await _db.Listings.FirstOrDefaultAsync(l => l.Id == listingId)
                          ?? throw new KeyNotFoundException("Listing not found");

            // Optional rule: owner cannot review own listing
            if (listing.OwnerId == userId)
                throw new InvalidOperationException("Owner cannot review own listing.");

            var review = await _db.Reviews
                .FirstOrDefaultAsync(r => r.ListingId == listingId && r.UserId == userId);

            if (review is null)
            {
                review = new Review
                {
                    ListingId = listingId,
                    UserId = userId,
                    Rating = rating,
                    Text = text,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.Reviews.Add(review);
            }
            else
            {
                review.Rating = rating;
                review.Text = text;
                review.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            await RecomputeListingAggregates(listingId);
            return review;
        }

        public async Task DeleteAsync(int reviewId, int userId, bool isAdmin = false)
        {
            var review = await _db.Reviews.FindAsync(reviewId)
                         ?? throw new KeyNotFoundException("Review not found");

            if (!isAdmin && review.UserId != userId)
                throw new UnauthorizedAccessException("Not your review.");

            var listingId = review.ListingId;
            _db.Reviews.Remove(review);
            await _db.SaveChangesAsync();
            await RecomputeListingAggregates(listingId);
        }

        public async Task DeleteByAdminAsync(int reviewId)
        {
            var review = await _db.Reviews.FindAsync(reviewId)
                         ?? throw new KeyNotFoundException("Review not found");

            var listingId = review.ListingId;
            _db.Reviews.Remove(review);
            await _db.SaveChangesAsync();
            await RecomputeListingAggregates(listingId);
        }

        private async Task RecomputeListingAggregates(int listingId)
        {
            var ratings = await _db.Reviews
                .Where(r => r.ListingId == listingId)
                .Select(r => r.Rating)
                .ToListAsync();

            var listing = await _db.Listings.FindAsync(listingId);
            if (listing is null) return;

            listing.ReviewCount = ratings.Count;
            listing.Rating = ratings.Count == 0 ? 0 : Math.Round(ratings.Average(), 2); // uses your existing double? Rating

            await _db.SaveChangesAsync();
        }

        // ---------- READ ----------
        public async Task<PagedResult<ReviewResponseDto>> GetReviewsAsync(
            int listingId, int page = 1, int pageSize = 10, string sort = "recent")
        {
            var q = _db.Reviews.Where(r => r.ListingId == listingId);

            q = sort switch
            {
                "top" => q.OrderByDescending(r => r.Rating).ThenByDescending(r => r.CreatedAt),
                _     => q.OrderByDescending(r => r.CreatedAt)
            };

            var total = await q.CountAsync();

            var items = await q.Skip((page - 1) * pageSize)
                               .Take(pageSize)
                               .Select(r => new ReviewResponseDto
                               {
                                   Id = r.Id,
                                   UserId = r.UserId,
                                   Username = r.User.Username, // your User model has Username
                                   Rating = r.Rating,
                                   Text = r.Text,
                                   CreatedAt = r.CreatedAt
                               })
                               .ToListAsync();

            return new PagedResult<ReviewResponseDto>
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<RatingSummaryDto> GetRatingSummaryAsync(int listingId)
        {
            var summary = new RatingSummaryDto();

            var ratings = await _db.Reviews
                .Where(r => r.ListingId == listingId)
                .Select(r => r.Rating)
                .ToListAsync();

            if (ratings.Count == 0) return summary;

            summary.Count = ratings.Count;
            summary.Average = Math.Round(ratings.Average(), 2);
            foreach (var g in ratings.GroupBy(x => x))
                summary.Histogram[g.Key] = g.Count();

            return summary;
        }
    }
}