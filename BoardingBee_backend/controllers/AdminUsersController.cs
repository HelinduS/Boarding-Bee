using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Models;

namespace BoardingBee_backend.Controllers
{
    [ApiController, Route("api/admin/users")]
    public class AdminUsersController : ControllerBase
    {
        private readonly AppDbContext _db;
        public AdminUsersController(AppDbContext db) { _db = db; }

        // GET: /api/admin/users/summary
        // Returns user list with aggregated counts (listings, reviews)
        [HttpGet("summary")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Summary()
        {
            var users = await _db.Users.AsNoTracking().ToListAsync();

            var listingCounts = await _db.Listings
                .AsNoTracking()
                .Where(l => l.OwnerId != null)
                .GroupBy(l => l.OwnerId)
                .Select(g => new { OwnerId = g.Key, Count = g.Count() })
                .ToListAsync();

            var reviewCounts = await _db.Reviews
                .AsNoTracking()
                .GroupBy(r => r.UserId)
                .Select(g => new { UserId = g.Key, Count = g.Count() })
                .ToListAsync();

            var owners = new List<object>();
            var usersList = new List<object>();

            foreach (var u in users)
            {
                var lc = listingCounts.FirstOrDefault(x => x.OwnerId == u.Id)?.Count ?? 0;
                var rc = reviewCounts.FirstOrDefault(x => x.UserId == u.Id)?.Count ?? 0;
                var name = string.IsNullOrWhiteSpace(u.FirstName) && string.IsNullOrWhiteSpace(u.LastName) ? u.Username : ($"{u.FirstName} {u.LastName}".Trim());
                var item = new {
                    userId = u.Id,
                    name,
                    email = u.Email,
                    phone = u.PhoneNumber,
                    profileImage = u.ProfileImage != null ? $"/api/users/{u.Id}/profile-image" : null,
                    totalListings = lc,
                    totalReviews = rc,
                    role = u.Role
                };
                if ((u.Role ?? "").ToUpper() == "OWNER") owners.Add(item);
                else usersList.Add(item);
            }

            var totalUsers = users.Count;
            var totalOwners = owners.Count;

            // total listings in DB
            var totalListings = await _db.Listings.CountAsync();

            // assigned listings (sum of listingCounts)
            var assignedListings = listingCounts.Sum(x => x.Count);
            var unassignedListings = totalListings - assignedListings;

            // listings that reference a missing user (orphaned owner ids)
            var userIds = users.Select(u => u.Id).ToHashSet();
            var orphanedListings = listingCounts.Where(x => x.OwnerId != null && !userIds.Contains(x.OwnerId.Value)).Sum(x => x.Count);

            return Ok(new { owners, users = usersList, totalUsers, totalOwners, totalListings, assignedListings, unassignedListings, orphanedListings });
        }
    }
}
