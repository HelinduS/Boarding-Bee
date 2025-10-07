using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BoardingBee_backend.Models;
using BoardingBee_backend.models;
using Microsoft.EntityFrameworkCore;

namespace BoardingBee_backend.services
{
    public class DashboardSummary
    {
        public int TotalAll { get; set; }
        public int Approved { get; set; }
        public int Pending { get; set; }
        public int Expired { get; set; }
    }

    public class DashboardService
    {
        private readonly AppDbContext _context;
        public DashboardService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardSummary> GetOwnerDashboardSummaryAsync(int ownerId)
        {
            var now = DateTime.UtcNow;
            var listings = await _context.Listings.Where(l => l.OwnerId == ownerId).ToListAsync();
            return new DashboardSummary
            {
                TotalAll = listings.Count,
                Approved = listings.Count(l => l.Status == ListingStatus.Approved),
                Pending = listings.Count(l => l.Status == ListingStatus.Pending),
                Expired = listings.Count(l => l.Status == ListingStatus.Expired || l.ExpiresAt < now)
            };
        }
    }
}