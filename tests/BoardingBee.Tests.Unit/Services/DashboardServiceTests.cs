using System.Collections.Generic;
using System.Threading.Tasks;
using BoardingBee_backend.Models;
using BoardingBee_backend.services;
using BoardingBee_backend.models;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BoardingBee.Tests.Unit.Services
{
    public class DashboardServiceTests
    {
        private AppDbContext GetInMemoryContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: System.Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        [Fact]
        public async Task GetOwnerDashboardSummaryAsync_ReturnsCorrectCounts()
        {
            using var context = GetInMemoryContext();
            var listings = new List<Listing>
            {
                new() { Id = 1, OwnerId = 1, Status = ListingStatus.Approved },
                new() { Id = 2, OwnerId = 1, Status = ListingStatus.Pending },
                new() { Id = 3, OwnerId = 1, Status = ListingStatus.Expired },
                new() { Id = 4, OwnerId = 2, Status = ListingStatus.Approved }
            };
            context.Listings.AddRange(listings);
            await context.SaveChangesAsync();

            var service = new DashboardService(context);
            var summary = await service.GetOwnerDashboardSummaryAsync(1);

            summary.TotalAll.Should().Be(3);
            summary.Approved.Should().Be(1);
            summary.Pending.Should().Be(1);
            summary.Expired.Should().Be(1);
        }
    }
}